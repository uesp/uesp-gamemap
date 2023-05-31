/**
 * @name gamemap.js
 * @author Dave Humphrey <dave@uesp.net> (21st Jan 2014)
 * @summary The main source code for the interactive gamemap.
 */

// import leaflet
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// import plugins
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import RasterCoords from "./plugins/rastercoords";
import './plugins/smoothwheelzoom';
import './plugins/tilelayercanvas';
import './plugins/canvasoverlay';
import './plugins/edgebuffer';

// import map classes
import World from "./objects/world.js";
import MapState from "./objects/mapstate.js";
import Location from "./objects/location.js";
import Point from "./objects/point.js";

/*================================================
					Locals
================================================*/

let map; // Leaflet map instance
let self; // Local "this" instance of Gamemap
let RC; // RasterCoords instance, for converting leaflet latlongs to XY coords and back
let mapWorldNameIndex = {}; // Local list of map world names
let mapWorldDisplayNameIndex = {}; // Local list of map display names
let mapBounds; // Current map bounds
let tileLayer; // Local tiles

/*================================================
				  Constructor
================================================*/
export default class Gamemap {
	/**
	 * Interactive map viewer class.
	 * @param {String} mapRootID - The root gamemap element in which the map is displayed
	 * @param {Object} mapConfig - The map config object, controls the type, state, and view of the map
	 * @param {Object} mapCallbacks - The callbacks object, to optionally receive events back from the gamemap
	 */
	constructor(mapRoot, mapConfig, mapCallbacks) {

		// create map root element if it doesn't exist
		if (mapRoot == null) {
			let gamemap = document.createElement("div");
			gamemap.id = "gamemap";
			let appNode = (document.body.children[0] != null) ? document.body.children[0] : document.body;
			appNode.prepend(gamemap);
			mapRoot = gamemap;
		}

		// check if other params are valid
		if (mapConfig != null && mapCallbacks != null) {

			// load in map config
			this.mapConfig = mapConfig;

			// set up map callbacks
			this.mapCallbacks = mapCallbacks;

			// set up the root map element
			this.mapRoot = mapRoot;
			self = this;

			// set up css
			if (this.mapConfig.hasCustomFavIcon) { changeFavIcon(mapConfig.iconPath + "favicon.png"); }
			if (this.mapConfig.bgColor) { mapRoot.style.backgroundColor = mapConfig.bgColor; }
			if (this.mapConfig.hasCustomCSS) { let cssPath = mapConfig.assetsPath + "css/" + mapConfig.database + "-styles.css"; print("Loading custom map css: " + cssPath); injectCSS(cssPath);}

			// set the default map world info
			this.mapWorlds = {};
			this.gridEnabled = false;
			this.mapLock = null;

			// check user editing permission
			this.checkEditingPermissions();

			// get world data for this mapConfig
			this.getWorlds(mapConfig);

		} else {
			throw new Error("The gamemap was provided invalid/missing params.");
		}
	}

	/*================================================
					   Initialise
	================================================*/

	/** Initialise default map state and variables.
	 * @param {Object} mapConfig - Object that controls the default settings of the map.
	 */
	initialiseMap(mapConfig) {
		// set global map options
		var mapOptions = {
			crs: L.CRS.Simple, // CRS: coordinate reference system
			zoomSnap: false, // enable snapping to zoom levels
			zoomDelta: 0.50, // control how much the map zooms in by per scroll
			zoomControl: false, // hide leaflet zoom control (we have our own)
			boxZoom: false, // disable box zoom
			doubleClickZoom: false, // disable double click to zoom
			scrollWheelZoom: false, // disable original zoom function
			smoothWheelZoom: true,  // enable smooth zoom
  			smoothSensitivity: 0.9, // zoom sensitivity. default is 1
			attributionControl: false, // disable leaflet attribution control
			renderer: L.svg({ padding: 2 }) // custom SVG renderer
        }

		// create root map object
		map = L.map(this.mapRoot.id, mapOptions);

		// create inital mapState object
		let mapState = new MapState();
		mapState.world = this.getWorldFromID(mapConfig.defaultWorldID || 0);

		if (getURLParams().has("centeron")) { // check if URL has "centeron" param
			// TODO: find location and centre on it
		} else if (this.hasMultipleURLParams()) { // else check if has multiple url params
			// load state from URL
			mapState = this.getMapStateFromURL();
		}

		// load map state
		this.setMapState(mapState);

		// bind map events
		this.bindMapEvents();
	}

	/*================================================
						  State
	================================================*/

	/** Get current map state object.
	 * @returns {Object} mapState - Object that controls the state and view of the map.
	 */
	getMapState() {
		return this.currentMapState;
	}

	/** Override mapState to provided map state (use to load from URL or from saved state).
	 * @param {Object} mapState - Object that controls the state and view of the map.
	 * @param {Boolean} onlyUpdateTiles - Flag to only update map tiles. Default: false (overrides everything).
	 */
	setMapState(mapState, onlyUpdateTiles) {

		print("Setting map state!");
		onlyUpdateTiles = onlyUpdateTiles ?? false;

		// remove previous tiles
		if (tileLayer != null) {
			tileLayer.remove();
			if (!onlyUpdateTiles) {
				this.clearLocations();
			}
		}

		// make sure the map state is valid
		if (mapState.world == null) {
			throw new Error("Map was provided an invalid/null world!");
		}

		// update world
		this.currentWorldID = mapState.world.id;

		// set full image width & height
		let mapImageDimens = mapState.world.getWorldDimensions();
		this.mapImage = {
			width: mapImageDimens.width,  // original full width of image
			height: mapImageDimens.height, // original full height of image
		}
		mapState.world.totalWidth = this.mapImage.width;
		mapState.world.totalHeight = this.mapImage.height;

		// calculate raster coords
		RC = new RasterCoords(map, this.mapImage);

		// default tilelayer options
		let tileOptions = {
			noWrap: true,
			bounds: RC.getMaxBounds(),
			errorTileUrl: IMAGES_DIR + "outofrange.png",
			minZoom: mapState.world.minZoomLevel,
			maxZoom: mapState.world.maxZoomLevel,
			edgeBufferTiles: 2,
		}

		// set map tile layer
		if (isFirefox()){ // use HTML-based rendering on firefox
			tileLayer = L.tileLayer(this.getMapTileImageURL(mapState.world, mapState.layerIndex), tileOptions);
		} else { // use canvas based tile rendering on everything else
			tileLayer = L.tileLayer.canvas(this.getMapTileImageURL(mapState.world, mapState.layerIndex), tileOptions);
		}
		tileLayer.addTo(map);

		// set map view
		print(mapState.coords);
		if(mapState.coords == null || mapState.zoomLevel == null) {
			// reset map to fill world bounds
			map.fitBounds(RC.getMaxBounds(), {animate: false});
			// now actually reset it
			setTimeout(function() { map.fitBounds(RC.getMaxBounds(), {animate: true}) }, 1);
		} else {
			map.setView(this.toLatLngs(mapState.coords), mapState.zoomLevel, {animate: false});
		}

		// set background colour
		if (mapState.world.layers[mapState.layerIndex].bg_color != null) { this.mapRoot.style.backgroundColor = mapState.world.layers[mapState.layerIndex].bg_color; }

		if (!onlyUpdateTiles) {
			// get/set locations
			if (mapState.world.locations == null) {
				// get locations for this map
				this.getLocations(mapState.world.id);
			} else {
				//redraw locations from cache
				this.redrawLocations(mapState.world.locations);
			}
		}

		// add padding around max bounds
		map.setMaxBounds(RC.getMaxBoundsWithPadding());

		// finally, update map state
		this.updateMapState(mapState);

		// set grid if available
		this.toggleGrid(mapState.showGrid, (mapState.showGrid) ? mapState.showGrid : null);
	}

	/** Gets map state object from URL params (XY coords, world etc).
	 * @returns {Object} mapState - Object that controls the state and view of the map.
	 */
	getMapStateFromURL() {

		// initialise mapstate
		let mapState = new MapState();

		if (getURLParams().has("zoom")){
			mapState.zoomLevel = getURLParams().get("zoom");
		} else {
			mapState.zoomLevel = this.mapConfig.defaultZoomLevel;
		}

		if (getURLParams().has("world")) {
			mapState.world = isNaN(parseInt(getURLParams().get("world"))) ? (getURLParams().get("world") != "undefined" ? this.getWorldFromName(getURLParams().get("world")) : this.getWorldFromID(this.mapConfig.defaultWorldID)) : this.getWorldFromID(getURLParams().get("world"));
		} else {
			mapState.world = this.getWorldFromID(this.mapConfig.defaultWorldID);
		}

		if (getURLParams().has("x") && getURLParams().has("y")) {
			mapState.coords = [getURLParams().get("x"), getURLParams().get("y")];
		}

		if (getURLParams().has("grid")) {
			mapState.showGrid = getURLParams().get("grid");
		} else {
			mapState.showGrid = false;
		}

		if (getURLParams().has("cellresource")) {
			mapState.cellResource = getURLParams().get("cellresource");
		}

		if (getURLParams().has("layer")) {
			let layer = getURLParams().get("layer");
			mapState.layerIndex = (isNaN(parseInt(layer))) ? this.getLayerIndexFromName(layer, mapState.world.layers) : parseInt(layer);
		} else {
			mapState.layerIndex = 0;
		}

		return mapState;
	}

	/** Update the map state with a given mapState object.
	 * @param {Object} mapState - Object that controls the state and view of the map.
	 */
	updateMapState(mapState) {

		let newMapState;

		if (mapState == null) {
			newMapState = this.getMapState();
		} else {
			newMapState = mapState;
		}

		// update map state
		let x = Number(this.toCoords(map.getCenter()).x, this.mapConfig.coordType).toFixed(3);
		let y = Number(this.toCoords(map.getCenter()).y, this.mapConfig.coordType).toFixed(3);
		newMapState.coords = (this.mapConfig.coordType == COORD_TYPES.NORMALISED || this.mapConfig.coordType == COORD_TYPES.PSEUDO_NORMALISED) ? [x, y] : [Math.floor(x), Math.floor(y)];
		newMapState.zoomLevel = parseFloat(map.getZoom().toFixed(3));
		newMapState.world = this.getWorldFromID(this.currentWorldID);
		this.currentMapState = newMapState;

		// update url
		let mapLink;
		if (!location.href.includes("localhost")) { // use server schema if hosted, else use query params
			mapLink = (window.location.href.includes("/"+this.mapConfig.database+"/")) ? "?" : (this.mapConfig.database+"/?");
		} else {
			mapLink = "?game=" + this.mapConfig.database + "&";
		}

		// world related
		if (this.hasMultipleWorlds()){
			mapLink += 'world=' + newMapState.world.name;
			mapLink += '&';
		}
		if (newMapState.world.hasMultipleLayers()) {
			mapLink += 'layer=' + newMapState.world.layers[newMapState.layerIndex].name;
			mapLink += '&';
		}
		mapLink += 'x=' + newMapState.coords[0];
		mapLink += '&y=' + newMapState.coords[1];
		mapLink += '&zoom=' + newMapState.zoomLevel;
		if (newMapState.showGrid) {
			mapLink += '&grid=' + newMapState.showGrid;
		}

		// callback
		if (self.mapCallbacks != null) {
			self.mapCallbacks.onMapStateChanged(newMapState);
		}

		// update url with new state
		window.history.replaceState(newMapState, document.title, mapLink);
  		window.dispatchEvent(new PopStateEvent('popstate'));
	}

	/*================================================
						  Worlds
	================================================*/

	/** Get world data for this game's mapConfig. If no mapConfig param provided, returns current list of worlds
	 * @see initialiseMap()
	 */
	getWorlds(mapConfig) {

		if (mapConfig != null) {

			let queryParams = {};
			queryParams.action = "get_worlds";
			queryParams.db = mapConfig.database;

			if (self.mapCallbacks != null) {
				self.mapCallbacks.setLoading("Loading world");
			}

			if (Object.keys(this.mapWorlds).length === 0) {
				getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

					if (!error && data != null) {

						if (data.worlds == null) {
							throw new Error("World data was null.");
						}

						for (var key in data.worlds) {
							let world = data.worlds[key];

							if (world.id > mapConfig.minWorldID && world.id < mapConfig.maxWorldID && world.name != null) {

								self.mapWorlds[world.id] = new World(world, mapConfig);
								mapWorldNameIndex[world.name] = world.id;

								if (world.displayName != null) {
									mapWorldDisplayNameIndex[world.displayName] = world.id;
								} else {
									mapWorldDisplayNameIndex[world.name] = world.id;
								}

							}
						}
						if (self.mapCallbacks != null) {
							self.mapCallbacks.onWorldsLoaded(self.mapWorlds);

							// load map
							self.initialiseMap(mapConfig);
						}

					} else {
						throw new Error("Could not retrieve world data.");
					}
				});
			}
		} else {
			return this.mapWorlds;
		}
	}

	/** Function to check whether a world object or a worldID is valid (exists, is within bounds)
	 * @param {String} world - Either a worldID or a world object
	 * @returns {Boolean} Whether or not the provided world is valid or not
	 */
	isWorldValid(world) {
		return (world != null && world >= 0 && world in this.mapWorlds);
	}

	/** Get the current world object
	 * @returns {Object} world - An object that represents the current map world.
	 */
	getCurrentWorld() {
		return ( !isNull(this.getMapState()) && !isNull(this.getMapState().world) != null) ? self.getMapState().world : this.getWorldFromID( (this.currentWorldID != null) ? this.currentWorldID : this.mapConfig.defaultWorldID);
	}

	/** Gets the current world ID (0 by default).
	 * @returns {int} worldID - ID that represents a world in the database.
	 */
	getCurrentWorldID() {
		return (this.currentWorldID != null) ? this.currentWorldID : getCurrentWorld().id;
	}

	/** Gets the world object associated to a given worldID.
	 * @param {int} worldID - ID that represents a world in the database.
	 * @returns {Object} world - A world object that contains map info for the gamemap.
	 */
	getWorldFromID(worldID) {
		return this.mapWorlds[worldID];
	}

	/** Get internal world name from a given worldID
	 * @param {Object} world - An object that represents the current map world.
	 * @returns {String} worldName - The internal name of the world.
	 */
	getWorldNameFromID(worldID) {
		if (this.getWorldFromID(worldID) != null) return this.getWorldFromID(worldID).name; else return null;
	}

	/** Get world display name from a given worldID
	 * @param {Int} worldID - A world ID.
	 * @returns {String} displayName - The user facing display name of the world.
	 */
	getWorldDisplayNameFromID(worldID) {
		if (this.getWorldFromID(worldID) == null) {
			return null;
		} else {
			return this.getWorldFromID(worldID).displayName || null;
		}
	}

	/** Get world object from internal world name
	 * @param {String} worldName - An internal worldName as a string.
	 * @returns {Object} world - A world object.
	 */
	getWorldFromName(worldName){
		return this.mapWorlds[mapWorldNameIndex[worldName]];
	}

	/** Get world object from user facing display name
	 * @param {String} worldDisplayName - A world's display name.
	 * @returns {Object} world - A world object.
	 */
	getWorldFromDisplayName(worldDisplayName){
		return this.mapWorlds[mapWorldDisplayNameIndex[worldDisplayName]];
	}

	/** Simple function that returns whether the current gamemap has multiple worlds.
	 * @returns {Boolean} - A boolean whether or not the current gamemap contains multiple worlds.
	 */
	hasMultipleWorlds() {
		return Object.keys(this.mapWorlds).length > 1;
	}

	/*================================================
						Navigation
	================================================*/

	/** Convenience method to quickly "goto" a location, world, or certain coordinates.
	 * @param {Object} place - Either a world, a location, or ID of one of those two.
	 * @param {Object} coords - Coord object (can also contain zoom)
	 */
	goto(place, coords) {
		// figure out what data we're being passed
		this.mapCallbacks.setLoading(true);
		place = (place != null) ? (isString(place)) ? parseInt(place) : place : this.getCurrentWorldID();
		let isWorld = place instanceof World || place.numTilesX;
		let isID = !isNaN(place);
		let isLocation = place instanceof Location || place.coords;

		if (isWorld) {
			gotoWorld(place.id, coords);
		} else if (isLocation) {
			let location = place;
			gotoWorld(location.worldID, location.coords);
			//openPopup(location); //TODO

		} else if (isID) {
			if (place >= 0) { // is destination a worldID?
				gotoWorld(place);
			} else { // it is a locationID
				let locationID = Math.abs(place);
				print("going to location");
				this.getLocation(locationID, onGetLocation);
				function onGetLocation(location) {
					if (location != null) {
						print(location);
						self.goto(location);
					} else {
						M.toast({html: "That location doesn't exist!"});
						self.mapCallbacks.setLoading(false);
					}
				}
			}
		}

		function gotoWorld(worldID, coords) {
			print(worldID);
			if (self.isWorldValid(worldID)) {
				// if we are in the same world, just pan to the provided location (or just reset map)
				if (worldID == self.getCurrentWorldID()) {
					if (coords != null) {
						map.setView(self.toLatLngs(coords), (coords[0].zoom != null) ? coords[0].zoom : coords.zoom);

					} else {
						self.reset(true);
					}
					self.mapCallbacks.setLoading(false);
				} else { // else load up the new world
					let mapState = new MapState(coords);
					let world = self.getWorldFromID(worldID);
					print("Going to world... " + world.displayName + " (" + world.id + ").");
					print(world);
					mapState.world = world;
					self.setMapState(mapState);
				}

			} else {
				throw new Error('Gamemap attempted to navigate to invalid world ID: ' + worldID);
			}
		}
	}

	/**
	 * Convert leaflet LatLngs to human readable map coordinates coordinates.
	 * @param {Object} latLngs - the leaflet latLng coordinate object
	 */
	toCoords(latLngs, coordType) {

		var coords;
		latLngs = structuredClone(latLngs);
		coordType = (coordType != null) ? coordType : (latLngs instanceof Point) ? latLngs.coordType : this.mapConfig.coordType;

		// convert latlng to XY coords;
		if (latLngs.lat != null) {
			coords = RC.project(latLngs);
		} else if (Array.isArray(latLngs)) {
			coords = [];
			latLngs.forEach((latLng) => {
				coords.push(RC.project(latLng));
			});
		}

		if (coordType != COORD_TYPES.XY) {
			if (coordType == COORD_TYPES.NORMALISED || coordType == COORD_TYPES.PSEUDO_NORMALISED) {
				if (coords.x > 1.5 || coords.y > 1.5) { // make sure to only convert non-normalised coordinates
					// divide xy coords by height to get normalised coords (0.xxx , 0.yyy)
					coords.x = (coords.x / this.mapImage.width).toFixed(3);
					coords.y = (coords.y / this.mapImage.height).toFixed(3);
					coords.coordType = COORD_TYPES.NORMALISED;
				}
			} else if (coordType == COORD_TYPES.WORLDSPACE) {
				// get current map world pixel position values
				let world = this.getCurrentWorld();
				let nX = coords.x / world.totalWidth;
				let nY = 1 - (coords.y / world.totalHeight);

				// reproject pixel values to worldspace
				coords.x = Math.trunc(world.minX + (world.maxX - world.minX) * nX);
				coords.y = Math.trunc(world.minY + (world.maxY - world.minY) * nY);
				coords.coordType = COORD_TYPES.WORLDSPACE;
			}
		}

		// return point object for coords
		return coords;
	}

	/**
	 * Convert XY/Worldspace coordinates to leaflet's LatLongs.
	 * @param {Object} coords - the coordinate/point object
	 */
	toLatLngs(coords) {

		var latLngs;

		if ( (coords instanceof Point || coords.x) && !Array.isArray(coords)) {

			switch (coords.coordType) {
				default:
				case COORD_TYPES.XY || null:
					latLngs = RC.unproject([coords.x , coords.y]);
					return latLngs;
				case COORD_TYPES.NORMALISED || COORD_TYPES.PSEUDO_NORMALISED:
					let x = (Number(coords.x) * this.mapImage.width);
					let y = (Number(coords.y) * this.mapImage.height);

					latLngs = RC.unproject([x , y]);
					return latLngs;
				case COORD_TYPES.WORLDSPACE:

					let xN = coords.x;
					let yN = coords.y;

					// get max range of x and y, assure it is a positive number
					let maxRangeX = Math.abs(this.getCurrentWorld().maxX - this.getCurrentWorld().minX);
					let maxRangeY = Math.abs(this.getCurrentWorld().maxY - this.getCurrentWorld().minY);

					// get normalised value of x and y in range
					xN = (xN - this.getCurrentWorld().minX) / maxRangeX;
					yN = Math.abs((yN - this.getCurrentWorld().maxY) / maxRangeY); // flip y around

					latLngs = this.toLatLngs(new Point(xN, yN, COORD_TYPES.NORMALISED));
					return latLngs;
			}

		} else if (Array.isArray(coords)) {

			if (coords[0].x != null) { // are we given an array of coord objects?

				if (coords.length == 1) { // are we given a single coord object? (marker, point)
					latLngs = this.toLatLngs(coords[0]);
					return latLngs;
				} else { // else we are given a polygon, get the middle coordinate
					let centreCoord = getAverageCoord(coords);
					latLngs = this.toLatLngs(new Point(centreCoord.x, centreCoord.y, this.mapConfig.coordType));
					return latLngs;
				}

			} else if (coords.length > 1) { // else we are just given a coord array [x, y]
				latLngs = this.toLatLngs(new Point(coords[0], coords[1], this.mapConfig.coordType));
				return latLngs;
			}
		}
	}

	/*================================================
						 Layers
	================================================*/

	toggleGrid(toggle, cellBounds, cellResources) {

		// set grid info
		let mapState = this.getMapState();
		mapState.showGrid = toggle;
		this.updateMapState(mapState);
		cellResources = (cellResources != null) ? (cellResources == "None") ? null : cellResources : cellResources;
		if ((cellBounds != null || cellResources != null) && this.isGridShown()) { removeGrid(); }

		// if cellResource is a string, then get cellResource array data and call ourselves again
		if (cellResources != null && !Array.isArray(cellResources)) {
			function loadCellResources(array) {
				if (self.isGridShown()) {
					self.toggleGrid(self.isGridShown(), cellBounds, array);
				}
			}
			this.getCellResourceData(cellResources, loadCellResources);
		}

		if (toggle) { // if draw grid == true
			function drawGrid(_, params) {

				// set up canvas layer
				let ctx = params.canvas.getContext('2d');
				ctx.clearRect(0, 0, params.size.x, params.size.y); //clear canvas
				// params.canvas.width = params.canvas.width; //clear canvas

				// set up canvas bounds
				let bounds = RC.getMaxBounds();
				let [minX, maxX, minY, maxY] = [map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthWest())).x, map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthEast())).x, map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthEast())).y, map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getSouthEast())).y];
				let [gridWidth, gridHeight] = [maxX - minX, maxY - minY]

				// get zoom info
				let world = self.getCurrentWorld();
				let currentZoom = self.getCurrentZoom();
				let maxZoomLevel = world.maxZoomLevel - 0.03;

				// work out normalised grid cell sizes
				let cellSize = (self.mapConfig.cellSize != null) ? self.mapConfig.cellSize : Math.round(self.mapConfig.tileSize * Math.pow(2, Math.round(world.maxZoomLevel)) / ((world.maxX - world.minX) / world.cellSize));
				let nGridSize = cellSize / Math.pow(2, Math.round(maxZoomLevel) - currentZoom) / gridHeight;

				// work out how many rows and columns there should be
				let nRows = world.getWorldDimensions().width / cellSize;
				let nCols = world.getWorldDimensions().height / cellSize;

				// draw grid
				for (let i = 0; i <= nRows; i++) {
					for (let j = 0; j <= nCols; j++) {

						// get normalised coordinates
						let nX = i * nGridSize;
						let nY = j * nGridSize;
						let isVisible = ((toPx(nX).x >= 0 || (toPx(nX).x < 0 && toPx(nX + nGridSize).x >= 0))) && (toPx(nY).y >= 0 || (toPx(nY).y < 0 && toPx(nY + nGridSize).y >= 0)) && toPx(nX).x <= window.innerWidth && toPx(nY).y <= window.innerHeight;

						// draw grid lines
						if (cellBounds && i == j) {
							ctx.beginPath();
							// rows
							ctx.moveTo(toPx(0).x, toPx(nY).y);
							ctx.lineTo(toPx(1).x, toPx(nY).y);
							// columns
							ctx.moveTo(toPx(nX).x, toPx(0).y);
							ctx.lineTo(toPx(nX).x, toPx(1).y);
							ctx.strokeStyle = ctx.strokeStyle = self.mapConfig.gridLineColour;
							ctx.lineWidth = self.mapConfig.gridLineWidth;
							ctx.stroke();
						}

						if (isVisible) {

							if (cellResources != null && Array.isArray(cellResources)) {
								let row = (i < cellResources.length) ? cellResources[i] : [];
								let col = (j < row.length) ? cellResources[i][j] : 0;

								if (col != 0) {
									if (col > 0 && col <= 2) {
										fillCell(self.mapConfig.cellResourceColours[0]);
									} else if (col > 2 && col <= 5) {
										fillCell(self.mapConfig.cellResourceColours[1]);
									} else if (col > 5 && col <= 10) {
										fillCell(self.mapConfig.cellResourceColours[2]);
									} else if (col > 10 && col <= 20) {
										fillCell(self.mapConfig.cellResourceColours[3]);
									} else if (col > 20 && col <= 50) {
										fillCell(self.mapConfig.cellResourceColours[4]);
									} else if (col > 50) {
										fillCell(self.mapConfig.cellResourceColours[5]);
									}
								}
							}

							if (cellBounds && currentZoom > self.mapConfig.gridShowLabelZoom) {

								let gridStartX = world.gridStart[0];
								let gridStartY = world.gridStart[1];
								let colNum = i + gridStartX;
								let rowNum = (-j) + gridStartY;

								if (rowNum % 5 == 0 || colNum % 5 == 0) {

									// draw background behind cell labels
									fillCell(self.mapConfig.gridLabelCellBgColour);

									if (rowNum % 5 == 0 && colNum % 5 == 0) {
										ctx.fillStyle = self.mapConfig.gridLabelColour;
										ctx.font = "bold 13px Arial";
										ctx.fillText([colNum, rowNum].join(', '), toPx(nX).x, toPx(nY + nGridSize).y);
									}
								}
							}
						}

						// fill grid cell function
						function fillCell(style) {
							ctx.fillStyle = style;
							ctx.beginPath();
							ctx.moveTo(toPx(nX).x, toPx(nY).y);
							ctx.lineTo(toPx(nX + nGridSize).x, toPx(nY).y);
							ctx.lineTo(toPx(nX + nGridSize).x, toPx(nY + nGridSize).y);
							ctx.lineTo(toPx(nX).x, toPx(nY + nGridSize).y);
							ctx.closePath();
							ctx.fill();
						}
					}
				}

				// normalised values to canvas pixels function
				function toPx(nX, nY) {
					nY = (nY != null) ? nY : nX;
					if (nY > 4 || nY < -4) { nY = nY / gridHeight; }
					if (nX > 4 || nX < -4) { nX = nX / gridWidth; }
					return new Point(minX + (nX * gridWidth), minY + (nY * gridHeight))
				}
			};
			L.canvasOverlay().params({bounds: RC.getMaxBounds(), className : "cellGrid", zoomAnimation: true}).drawing(drawGrid).addTo(map);
		} else { removeGrid(); }

		function removeGrid() {
			//remove the cell grid
			map.eachLayer((layer) => {
				if (layer.options.className == "cellGrid") {
					layer.remove();
				}
			});
		}
	}

	isGridShown() {
		return this.getMapState().showGrid;
	}

	getCellResourceData(resourceID, callback) {

		if (resourceID != null || resourceID != "") {

			var queryParams = {};
			queryParams.action = "get_cellresource";
			queryParams.db = this.mapConfig.database;
			queryParams.worldid = this.getCurrentWorldID();
			queryParams.editorid = resourceID;

			getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {
				if (!error && data != null) {

					// y flip
					let array = data.resources[0].data;
					for (let i in array) {
						array[i] = array[i].reverse();
					}
					callback(array);
				}
			});
		}
	}

	setTileLayerTo(layer) {

		if (layer != null) {
			let layerIndex;
			if (isNaN(layer)){
				layerIndex = this.getLayerIndexFromName(layer);
			} else {
				layerIndex = layer;
			}

			if (layerIndex > -1 && layerIndex < this.getCurrentWorld().layers.length) {
				let mapState = this.getMapState();
				if (mapState.layerIndex != layerIndex) {
					mapState.layerIndex = layerIndex;
					this.setMapState(mapState, true);
				}
			} else {
				print.warn("TileLayer index was out of bounds.")
			}

		} else {
			print.error("Provided TileLayer was invalid.")
		}
	}

	setMapLock(mapLock) {
		// set map lock state
		print(mapLock);
		if (mapLock) {
			this.mapLock = mapLock;

			if (self.mapLock == "full") {
				map.dragging.disable();
				//map.options = {smoothWheelZoom : false};
			}
		} else {
			this.mapLock = null;
			map.dragging.enable();
		}

		// and callback back to UI
		if (this.mapCallbacks != null) {
			this.mapCallbacks.onMapLockChanged(this.mapLock);
		}
	}

	getCurrentTileLayerIndex() {
		return parseInt(this.getMapState().layerIndex);
	}

	getNextTileLayerIndex() {
		return (this.getCurrentTileLayerIndex() +1 == this.getCurrentWorld().layers.length) ? 0 : this.getCurrentTileLayerIndex() + 1;
	}

	getNextTileLayerName() {
		return this.getCurrentWorld().layers[this.getNextTileLayerIndex()].name;
	}

	getCurrentTileLayerName() {
		return this.getCurrentWorld().layers[this.getCurrentTileLayerIndex()].name;
	}

	// https://maps.uesp.net/esomap/tamriel/zoom11/tamriel-0-2.jpg
	getMapTileImageURL(world, layerIndex, root) {

		if (isNaN(layerIndex)) {
			layerIndex = this.getLayerIndexFromName(layerIndex);
		}

		let zoom = (root) ? "/zoom0/" : "/zoom{z}/";
		let xy = (root) ? "-0-0.jpg" : "-{x}-{y}.jpg";
		return this.mapConfig.tileURL + world.name + "/leaflet/" + world.layers[layerIndex].name + zoom + world.name + xy;
	}

	/*================================================
						Locations
	================================================*/

	getLocations(world) {

		print("Getting locations...");

		// check if we've been sent a world ID
		if (world != null && !isNaN(world)){
			if (this.isWorldValid(world)) {
				world = this.getWorldFromID(world);
			}
		}

		// make sure we're being given a valid world state
		if (world == null || world.id == null || world.id < 0 ) {
			print(world)
			return;
		}

		// generate api query
		var queryParams = {};
		queryParams.action = "get_locs";
		queryParams.world  = world.id;
		queryParams.db = this.mapConfig.database;

		// make api query
		getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {
			if (!error && data != null) {
				print("Got " + data.locationCount + " locations!");
				let locations = data.locations
				let parsedLocations = {};

				for (let key in locations) {
					let location = locations[key];

					if (location.id != null) {
						parsedLocations[location.id] = new Location(location, world);
					}
				}

				// update world
				self.mapWorlds[world.id].locations = parsedLocations;

				// make sure we're in the right world before overwriting all locations
				if (self.getCurrentWorldID() == world.id) {
					self.updateMapState();
					self.redrawLocations(parsedLocations);
				}
			} else {
				print.warn("There was an error getting locations for this world.");
			}
		});

	}

	getLocation(locationID, onLoadFunction) {

		locationID = Math.abs(locationID);
		let hasSearchedLocal = false;
		let callback = function(location) {
			onLoadFunction.call(null, location);
		}

		print("Getting info for locationID: "+ locationID);

		// iterate through local world list to see if locationID exists in them
		Object.values(this.mapWorlds).forEach(world => {
			if (world.locations) {
				Object.values(this.mapWorlds).forEach(world => {
					if (world.locations) {
						Object.values(world.locations).forEach(location => {
							if (location.id == locationID) {
								callback(location);
								hasSearchedLocal = true;
							}
						});
					}
				});
			}
		});

		// if no local copies of that locationID exist, search the online db
		if (!hasSearchedLocal) {
			let queryParams = {};
			queryParams.action = "get_loc";
			queryParams.locid  = locationID;
			queryParams.db = this.mapConfig.database;

			getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

				print(data);

				if (!error && data != null && data.locations[0] != null) {
					print("Got location info!");
					let world = self.getWorldFromID(data.locations[0].worldId);
					print(data.locations[0]);
					let location = new Location(data.locations[0], world)
					callback(location);
				} else {
					print("LocationID " + locationID + " was invalid.");
					callback(null);
				}
			});
		}

	}

	clearLocations() {
		if (this.markerLayer != null) {
			this.markerLayer.off('resize move zoom');
			this.markerLayer.clearLayers();
			this.markerLayer.remove();
		}

		map.eachLayer((layer) => {
			if (!layer._tiles && layer.options.className != "cellGrid" ) { //remove anything that is not a tile or cell grid
				layer.off('resize move zoom');
				layer.remove();
			}
		});
	}

	redrawMarkers(marker){

		let isVisible = marker.isVisible();
		let wasVisible = marker.getWasVisible();

		// add/remove from DOM on marker visibility change
		if (isVisible != wasVisible) {
			if (isVisible) {

				if (this.markerLayer.hasLayer(marker)) {
					marker.addTo(map);
					if (marker.location.hasLabel() && !(marker.location.hasIcon() && marker._path)) {
						marker.bindTooltip(marker.location.name, this.getLocationLabel(marker.location));
					}
				}

			} else {
				marker.remove();
			}

			marker.setWasVisible(isVisible);
		}

	}

	getLocTypeByName(locTypeName) {

		locTypeName = locTypeName.trim().toLowerCase() + "";

		if (this.mapConfig != null && this.mapConfig.icons != null && locTypeName != "") {
			for (let locType in this.mapConfig.icons) {
				if (locTypeName === this.mapConfig.icons[locType].toLowerCase()) {
					return locType;
				}
			}
		} else {
			return null;
		}
	}


	redrawLocation(location, isEditing) {

		print(location);

		// remove existing marker(s)
		let markers = this.getMarkersFromLocation(location);
		markers.forEach(function(marker) { marker.remove() });

		// create new markers
		markers = this.getMarkers(location, isEditing);
		markers.forEach(function(marker) { marker.addTo(map) });

		if (isEditing) { this.edit(markers) }
	}

	redrawLocations(locations) {

		print(locations);
		// delete any existing location layers
		this.clearLocations();

		// set up location layer for each zoom level
		print("Setting up location markers...")
		let locationMarkers = [];

		// check if current map has any locations
		if (Object.keys(locations).length > 0) {

			print("Loading locations...");

			// iterate through each location in the list
			Object.values(locations).forEach(location => {

				if (location.isVisible) {
					// get marker/polygon/icon for this location
					let markers = this.getMarkers(location);

					if (markers.length > 1) {
						print (markers);
					}

					// add markers to map layer
					markers.forEach(marker => { locationMarkers.push(marker) });
				}
			});
		}

		this.markerLayer = new L.layerGroup(locationMarkers);

		// add markers to map
		print("Adding location markers to map...")
		this.markerLayer.addTo(map);

		// callback to show map fully loaded
		if (this.mapCallbacks != null) {
			this.mapCallbacks.onMapLoaded(true);
			// fix screen flash bug when editing worlds
			this.mapRoot.style.animation = "none";
		}

	}

	// create marker(s) for location
	getMarkers(location, isEditing) {

		// make generic fallback marker
		let polygonIcon = null;
		let coords = location.coords;
		let marker = new L.marker(this.toLatLngs(coords[0]), {riseOnHover: true},);
		L.Marker.prototype.options.icon = L.icon({ iconUrl: IMAGES_DIR + "transparent.png" });

		// create specific marker type
		if (location.isPolygon()) { // is location polygonal? (polyline or polygon)

			// get coordinates of location
			coords = [];
			for (let i = 0; i < location.coords.length; i++) {
				coords.push(this.toLatLngs(location.coords[i]));
			}

			let options = {
				noClip: true,
				smoothFactor: 2,
				fillColor: location.style.fillColour,
				color: location.style.strokeColour,
				opacity: location.style.strokeOpacity,
				fillOpacity: location.style.fillOpacity,
				weight: location.style.lineWidth,
			}

			if (location.locType == LOCTYPES.AREA) {
				marker = new L.polygon(coords, options);

				if (location.hasIcon()) {
					marker.setIsIconPolygon(true);
					polygonIcon = this.makeMarker(location, marker.getCentre(), isEditing);
				}
			}

			if (location.locType == LOCTYPES.PATH) {
				marker = new L.polyline(coords, options);
			}

		} else { // if no, then it must be a single point (icon, label)

			if (location.hasIcon()) {
				marker = this.makeMarker(location, this.toLatLngs(coords[0]), isEditing);
			}

		}

		// bind stuff to markers
		let markers = [marker, polygonIcon].filter((i) => i !== null);
		markers.forEach(marker => {
			// bind location to marker
			marker.setLocation(location);

			// add label to marker if applicable
			if (location.hasLabel() && !marker.isIconPolygon()) {
				marker.bindTooltip(location.name, this.getLocationLabel(location));
			}

			// bind marker events
			marker.once('add', function() {

				const EVENTS_STRING = "resize moveend zoomend";

				// don't show any markers that are not currently visible
				if (!marker.isVisible()) {
					marker.off(EVENTS_STRING);
					marker.remove();
				}

				map.on(EVENTS_STRING, function() {
					if (marker.getLocation().worldID == self.getCurrentWorldID()) {
						self.redrawMarkers(marker);
					}
				});

				// on marker deselected
				marker.on("mouseout", function () {
					self.clearTooltips();
					let isPolygon = marker.location.isPolygon() && marker._path;

					if (isPolygon){
						this.setStyle({
							fillColor: location.style.fillColour,
							color: location.style.strokeColour,
							opacity: location.style.strokeOpacity,
							fillOpacity: location.style.fillOpacity,
							weight: location.style.lineWidth,
						});
					}
				});

				// on marker hovered over
				marker.on('mouseover', function () {

					let isPolygon = marker.location.isPolygon() && marker._path;
					let latLngs = marker.getCentre();

					L.tooltip(latLngs, {content: location.getTooltipContent(), sticky: true, className : "location-tooltip",}).addTo(map);

					if (isPolygon){
						this.setStyle({
							fillColor: location.style.hover.fillColour,
							color: location.style.hover.strokeColour,
							opacity: location.style.hover.strokeOpacity,
							fillOpacity: location.style.hover.fillOpacity,
							weight: location.style.hover.lineWidth,
						});
					}
				});

				// on marker clicked
				marker.on('click', function (event) {
					if(!self.mapLock) {
						let shift = event.originalEvent.shiftKey; // edit
						let ctrl = event.originalEvent.ctrlKey; // popup
						self.onMarkerClicked(this, shift, ctrl);
					}
				});
			});

		});

		return markers;
	}

	makeMarker(location, coords, isEditing) {
		let anchor = [this.mapConfig.iconSize / 2, this.mapConfig.iconSize / 2];
		let iconURL = this.mapConfig.iconPath + location.icon + ".png";

		let locationIcon = L.icon({
			iconUrl: iconURL,
			iconAnchor: anchor,
			iconSize: [this.mapConfig.iconSize, this.mapConfig.iconSize],
		});

		let marker = L.marker(coords, {icon: locationIcon, riseOnHover: true, className: `${isEditing ? "editing" : ""}`});
		marker.setEditingEffect(isEditing);

		return marker;
	}

	getLocationLabel(location) {

		let offset = [0, 0];
		const [X_OFFSET, Y_OFFSET] = [this.getMapConfig().labelOffset, this.getMapConfig().labelOffset / 2];

		// set label offset based on direction
		switch (location.labelDirection) {
			case "top":
				offset = [0, -Y_OFFSET];
				break;
			case "bottom":
				offset = [0, Y_OFFSET];
				break;
			case "left":
				offset = [-X_OFFSET, 0];
				break;
			case "right":
				offset = [X_OFFSET, 0];
				break;
			case "auto":
				offset = [Y_OFFSET, 0];
				break;
		}
		return {
			className : "location-label",
			permanent: true,
			direction: location.labelDirection,
			interactive: true,
			offset: offset,
			riseOnHover: true,
		}
	}


	/*================================================
						Map Events
	================================================*/

	bindMapEvents() {

		map.on('resize moveend zoomend', function() {
			self.updateMapState();
			self.clearTooltips();
		});

		map.on("contextmenu", function(e){
			if (self.getMapState().world.parentID != null && self.getMapState().world.parentID != -1 ) {
				if (!self.mapLock) {
					let parentID = self.getMapState().world.parentID;
					self.goto(parentID);
				} else {
					M.toast({html: "Map is locked while editing!"});
				}
			}
		})

		map.on("contextmenu", function (event) {
			print(event);
			let target = event.originalEvent.explicitOriginalTarget;

			print(target);
			if (target != self.mapRoot && target.classList != null && !target.classList.contains("leaflet-interactive")) {

				target.oncontextmenu = null;
			} else {

			}
		});
		map.on("zoom", function() {

			if (!self.mapLock && self.mapLock != "full") {
				if (self.mapCallbacks != null) {
					self.mapCallbacks.onZoom(map.getZoom());
				}
			} else {
				//self.reset(true, 50);
			}
		})

		map.on("dblclick", function(event){
			map.panTo(event.latlng, {animate: true});
		})

		map.on("mousemove", function(event) {
			let target = event.originalEvent.explicitOriginalTarget;
			if (target != self.mapRoot && target.classList != null && !target.classList.contains("leaflet-interactive")) {
				map.dragging.disable();
			} else {
				map.dragging.enable();
			}
		});

	}

	onMarkerClicked(marker, shift, ctrl) {

		print(marker.location);
		let canJumpTo = marker.location != null && marker.location.isClickable() && !this.mapLock;

		if (canJumpTo && !shift && !ctrl) { // is location a link to a worldspace/location

			let location = marker.location;
			if (location != null) {
				if (location.destinationID > 0) { // is destinationID a worldID
					this.goto(location.destinationID);
				} else { // it is a location ID
					print(location.destinationID)
					function onGetLocation(location) {
						self.goto(-location.id);
					}
					this.getLocation(location.destinationID, onGetLocation);
				}
			}
		} else {
			if (!this.mapLock) {
				if (shift) { // if shift pressed, and can edit, show edit menu
					this.openPopup(marker, this.canEdit());
				}
			}
		}

		// if normally clicked or pressing ctrl, show popup
		if (!shift || ctrl ) {

			if (canJumpTo && !ctrl){
				// do nothing
			} else {
				this.openPopup(marker);
			}

		}

	}

	openPopup(marker, isEdit) {
		let latlng;

		try {
			latlng = marker.getCenter();
		} catch (e) {
			latlng = marker.getLatLng();
		}

		if (!isEdit){
			print("making popup");
			print(marker);
			print(marker.element);
			L.popup(latlng, {content: marker.location.getPopupContent() }).openOn(map);
		} else {
			this.edit(marker.location);
		}
	}

	setZoomTo(zoom) {
		map.setZoom(zoom, {animate: true})
	}

	// clear tooltips
	clearTooltips(){
		map.eachLayer((layer) => {
			if (layer.options.className == "location-tooltip") { // clear any tooltip
				layer.remove();
			}
		});

	}


	centreOnLocation(location) {

		// get marker object from location
		let marker = this.getMarkers(location)[0];

		// get bounds of the marker
		let bounds;
		if (marker instanceof L.Marker) {
			bounds = L.latLngBounds([marker.getLatLng()]);
		} else {
			bounds = marker.getBounds();
		}
		var boundsWithPadding = this.getBoundsWithPadding(bounds, 0.2);

		// centre around the bounds of the marker
		if (!(this.getZoomFromBounds(boundsWithPadding) < location.displayLevel)) {
			map.flyToBounds(boundsWithPadding);
		} else {
			this.goto(location);
		}

	}

	getZoomFromBounds(bounds) {
		return map.getBoundsZoom(bounds, false);
	}

	getBoundsWithPadding(bounds, nPadding) {

		let southWest = bounds._southWest;
		let northEast = bounds._northEast;

		southWest.lng = southWest.lng * (1 - nPadding);
		southWest.lat = southWest.lat * (1 - nPadding);
		northEast.lng = northEast.lng * (1 + nPadding);
		northEast.lat = northEast.lat * (1 + nPadding);

		return new L.LatLngBounds(southWest, northEast);
	}

	/*================================================
						  General
	================================================*/

	// reset map
	reset(currentWorldOnly, customPadding) {
		if (!this.hasMultipleWorlds() || currentWorldOnly) {
			if (customPadding) {
				map.fitBounds(RC.getMaxBoundsWithPadding(customPadding), {animate: true});
			} else {
				map.fitBounds(RC.getMaxBounds(), {animate: true});
			}
		} else {
			this.goto(this.mapConfig.defaultWorldID);
		}
	}

	getMapBounds() {
		return RC.getMaxBounds();
	}

	getMaxBoundsZoom() {
		return map.getBoundsZoom(this.getMapBounds());
	}

	/*================================================
						Editing
	================================================*/

	getMarkersFromLocation(location) {
		let markers = []; //sometimes locations can have multiple markers
		map.eachLayer((layer) => {
			if (layer.location != null) {
				if (layer.location.id == location.id) {
					layer.element = layer._icon || layer._path;
					markers.push(layer);
				}
			}
		});
		return markers;
	}

	edit(object) {
		let location;
		let markers;

		if (object instanceof Location) {
			location = object;
			markers = this.getMarkersFromLocation(location);
		} else if (object?.length > 0) {
			markers = object;
		}

		// tell rest of the app we're editing this object
		if (location || object instanceof World) {
			this.mapCallbacks?.edit(object);
		}

		// add editing effect to marker(s)
		markers[0].setEditing(true);
		if (markers) { markers.forEach((marker) => { marker.setEditingEffect(true)}) }

	}

	// get if editing is enabled on this map
	canEdit() {
		return this.mapConfig.editingEnabled;
	}

	checkEditingPermissions() {

		let queryParams = {};
		let self = this;
		queryParams.action = "get_perm";
		queryParams.db = this.mapConfig.database;

		if (this.mapCallbacks != null) {
			this.mapCallbacks.setLoading("Getting permissions");
		}

		getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

			let canEdit = false;

			if (!error && data != null) {
				canEdit = data.canEdit;
			} else {
				print.warn("There was an error getting permissions.")
			}

			self.mapConfig.editingEnabled = ((canEdit || isDebug) && (!self.isEmbedded() && !isMobile()));
			if (self.mapCallbacks != null) {
				self.mapCallbacks.onPermissionsLoaded(self.mapConfig.editingEnabled);
			}
		});

	}

	isEmbedded() {
		return window.self !== window.top;
	}

	/*================================================
						  Utility
	================================================*/

	/** Get current map config object.
	 * @returns {Object} mapConfig - Object that controls the configuration of the map.
	 */
	getMapConfig() {
		return this.mapConfig;
	}

	getCurrentZoom() {
		return (map != null) ? map.getZoom() : 0;
	}

	getMaxZoom() {
		return (this.getCurrentWorld() != null) ? this.getCurrentWorld().maxZoomLevel : 5;
	}

	getMinZoom() {
		return (this.getCurrentWorld() != null) ? this.getCurrentWorld().minZoomLevel : 0;
	}

	/** Get wiki link for the current map world.
	 * @returns {String} URL on the wiki for the current map world.
	 */
	getArticleLink() {

		if (!(this.currentWorldID in this.mapWorlds)) {
			return "";
		}

		let wikiPage = this.mapWorlds[this.currentWorldID].wikiPage;
		if (wikiPage == null || wikiPage == '') wikiPage = this.mapWorlds[this.currentWorldID].displayName;

		let namespace = '';
		if (this.mapConfig.wikiNamespace != null && this.mapConfig.wikiNamespace != '') namespace = this.mapConfig.wikiNamespace + ':';

		wikiPage = encodeURIComponent(wikiPage);

		return this.mapConfig.wikiURL + namespace + wikiPage;
	}

	getLayerIndexFromName(layerName, layersObj) {
		let layers = (layersObj != null) ? layersObj : this.getCurrentWorld().layers;
		for (let [key] of Object.entries(layers)) {
			if (layers[key].name == layerName) {
				return parseInt(key);
			}
		}
		return 0;
	}

	getMapObject() {
		return map;
	}

	hasMultipleURLParams() {
		return (Array.from(getURLParams().values())).length >= 2;
	}
}

/*================================================
				Leaflet Extensions
================================================*/

L.Layer.include({

	// properties
	location: null,
	element: null,
	editing: false,
	wasVisible: null,
	isIconPoly: null,

	// getters
	getLocation: function() { return this.location },
	getCentre: function(latLngs) { return this.getLatLng?.() ?? L.latLngBounds((latLngs && Array.isArray(latLngs)) ? latLngs : this.getCoordinates()).getCenter() },
	getElement() { return this.element = this?._icon ?? this?._path },
	getTooltip() { return document.getElementById(this.getElement()?.getAttribute('aria-describedby')) },
	getWasVisible() { return this.wasVisible },
	isIconPolygon() { return this.isIconPoly },
	isEditing() { return this.getElement()?.classList?.contains("editing") || this.editing },

	// setters
	setLocation(location) { this.location = location },
	setWasVisible(wasVisible) { this.wasVisible = wasVisible },
	setIsIconPolygon(isIcon) {this.isIconPoly = isIcon },

    // get layer latlngs as array
    getCoordinates() {
		if (this.getLatLng) {
			return [structuredClone(this.getLatLng())];
		} else if (this.getLatLngs) {
			let latLngs = structuredClone(this.getLatLngs());
			return (latLngs.length > 1) ? latLngs : latLngs[0];
		}
	},

	// get layer latlngs as well as estimated centre point as an array
	getCoordinatesAndCentre() {
		let latlngs = this.getCoordinates();
		if (this.getLatLngs) {latlngs.push(this.getCentre(latlngs))}
		return latlngs;
	},

	// get marker is visible
	isVisible() {
		if (this.isEditing()) return true;
		if (map.getZoom() < this.location.displayLevel) return false;
		if (mapBounds != map.getBounds()) { mapBounds = map.getBounds() }
		return mapBounds.intersects(L.latLngBounds(this.getCoordinatesAndCentre()));
	},

	setEditingEffect(doEffect) {
		if (doEffect) {
			// add editing effect to marker
			this.getElement()?.classList?.add("editing");
			setTimeout(() => {this.getTooltip()?.classList?.add("editing")}, 15);
			this.editing = doEffect;
		}
	},

	setEditing(editing) {
		this.editing = editing;

		if (editing) {

			this.setEditingEffect(editing);

			this.pm.enable({
				allowEditing: true,
				snapDistance: 10,
				draggable: true,
			});

			this.on('pm:markerdragend pm:vertexremoved pm:edit', (e) => {
				if (e.shape == "Marker") {
					let coords = gamemap.toCoords(e.layer.getLatLng());
					updateMarkerCoords([coords]);
				}

				if ((e.shape == "Polygon" || e.shape == "Line") && e.type == "pm:markerdragend" || e.type == "pm:vertexremoved") {
					let [latLngs, coords] = [e.layer.getCoordinates(), []];
					latLngs.forEach((latLng) => { coords.push(gamemap.toCoords(latLng)) });
					updateMarkerCoords(coords);
				}
			});
		} else {
			this.off("pm:markerdragend pm:vertexremoved pm:edit");
		}

	}
});


// uesp.gamemap.Map.prototype.onAddLocationStart = function()
// {
// 	if (!this.canEdit()) return false;
// 	if (this.currentEditMode != '') return false;

// 	this.addEditClickWall();
// 	this.currentEditMode = 'addlocation';
// 	this.displayEditNotice("Click on the map to add a location...", '', 'Cancel');

// 	return true;
// }

// uesp.gamemap.Map.prototype.onAddPathStart = function()
// {
// 	if (!this.canEdit()) return false;
// 	if (this.currentEditMode != '') return false;

// 	this.addEditClickWall();
// 	this.currentEditMode = 'addpath';
// 	this.displayEditNotice("Click on the map to add points to the path. Click 'Finish' when done...", 'Finish', 'Cancel');

// 	this.currentEditLocation = new uesp.gamemap.Location(this);
// 	this.currentEditLocation.locType = Constants.LOCTYPE_PATH;
// 	this.currentEditLocation.id = this.createNewLocationId();
// 	this.currentEditLocation.worldID = this.currentWorldID;
// 	this.currentEditLocation.name = 'New Path';
// 	this.currentEditLocation.displayLevel = this.zoomLevel - 1;
// 	this.currentEditLocation.visible = true;
// 	this.currentEditLocation.useEditPopup = true;
// 	this.currentEditLocation.displayData.labelPos = 0;
// 	this.currentEditLocation.displayData.points = [];
// 	this.currentEditLocation.displayData.hover = { };
// 	this.currentEditLocation.displayData.hover.fillStyle = "rgba(255,255,255,0.25)";
// 	this.currentEditLocation.displayData.hover.strokeStyle = "rgba(0,0,0,1)";
// 	this.currentEditLocation.displayData.hover.lineWidth = 2;
// 	this.currentEditLocation.displayData.fillStyle = "rgba(255,255,255,0.05)";
// 	this.currentEditLocation.displayData.strokeStyle = "rgba(0,0,0,0.5)";
// 	this.currentEditLocation.displayData.lineWidth = 1;
// 	this.currentEditLocation.iconType = 0;
// 	this.currentEditLocation.isFirstEdit = true;

// 	this.locations[this.currentEditLocation.id] = this.currentEditLocation;
// 	return true;
// }


// uesp.gamemap.Map.prototype.onAddAreaStart = function()
// {
// 	if (!this.canEdit()) return false;

// 	this.onAddPathStart();

// 	this.currentEditLocation.locType = Constants.LOCTYPE_AREA;
// 	this.currentEditMode = 'addarea';

// 	this.displayEditNotice("Click on the map to add points to the area. Click 'Finish' when done...", 'Finish', 'Cancel');
// }

// uesp.gamemap.Map.prototype.createNewLocationId = function ()
// {
// 	NewId = this.nextNewLocationId;
// 	this.nextNewLocationId -= 1;
// 	return NewId;
// }

// uesp.gamemap.Map.prototype.createNewLocation = function (gamePos)
// {
// 	if (!this.canEdit()) return null;

// 	var location = new uesp.gamemap.Location(this);

// 	location.id = this.createNewLocationId();
// 	location.worldID = this.currentWorldID;
// 	location.name = 'New Location';
// 	location.x = Math.round(gamePos.x);
// 	location.y = Math.round(gamePos.y);
// 	location.locType = Constants.LOCTYPE_POINT;
// 	location.displayLevel = this.zoomLevel - 1;
// 	location.visible = true;
// 	location.useEditPopup = true;
// 	location.isFirstEdit = true;
// 	location.displayData = {};
// 	location.displayData.points = [];
// 	location.displayData.labelPos = 0;

// 	location.displayData.labelPos = 6;
// 	location.iconType = 1;

// 	this.locations[location.id] = location;

// 	this.displayLocation(location);
// 	location.showPopup();

// 	return location;
// }


// uesp.gamemap.Map.prototype.onAddLocationClick = function (event)
// {
// 	this.removeEditClickWall();
// 	this.hideEditNotice();
// 	this.currentEditMode = '';

// 	if (!this.canEdit()) return false;

// 	gamePos = this.convertWindowPixelToGamePos(event.pageX, event.pageY);
// 	//uesp.printDebug(uesp.print_LEVEL_INFO, "onAddLocationClick()", gamePos);

// 	this.createNewLocation(gamePos);
// 	this.redrawCanvas(true);

// 	return true;
// }


// uesp.gamemap.Map.prototype.onReceiveCenterOnLocationData = function (data)
// {
// 	uesp.printDebug(uesp.print_LEVEL_INFO, "Received centeron location data");
// 	uesp.printDebug(uesp.print_LEVEL_INFO, data);

// 	if (data.isError === true || data.locations == null || data.locations.length === 0)
// 	{
// 		if (data.worlds == null || data.worlds.length === 0)
// 		{
// 			this.changeWorld(this.mapConfig.homeworldID);
// 			this.centerOnError = true;
// 		}
// 		else
// 		{
// 			this.mergeWorldData(data.worlds);
// 			this.changeWorld(data.worlds[0].id);
// 			this.centerOnError = true;
// 		}

// 		return false;
// 	}

// 	this.mergeLocationData(data.locations, true);
// 	var worldID = 0;

// 	if (data.worlds == null || data.worlds.length === 0)
// 	{
// 		worldID = data.locations[0].worldID;
// 	}
// 	else
// 	{
// 		this.mergeWorldData(data.worlds);
// 		worldID = data.worlds[0].id
// 	}

// 	if (this.mapWorlds[worldID] == null)
// 	{
// 		this.changeWorld(this.mapConfig.homeworldID);
// 		this.centerOnError = true;
// 		return true;
// 	}

// 	var mapState = new uesp.gamemap.MapState();
// 	mapState.worldID = worldID;
// 	mapState.zoomLevel = this.mapWorlds[worldID].maxZoom;
// 	mapState.gamePos.x = data.locations[0].x + data.locations[0].width/2;
// 	mapState.gamePos.y = data.locations[0].y - data.locations[0].height/2;

// 	this.showPopupOnLoadLocationId = data.locations[0].id;

// 	this.changeWorld(data.worlds[0].id, mapState);

// 	return true;
// }

// uesp.gamemap.Location.prototype.setPopupEditNotice = function (Msg, MsgType)
// {
// 	if (this.popupElement == null) return;

// 	$status = $('#' + this.popupId + ' .gmMapEditPopupStatus');
// 	if ($status == null) return;

// 	$status.html(Msg);
// 	$status.removeClass('gmMapEditPopupStatusOk');
// 	$status.removeClass('gmMapEditPopupStatusNote');
// 	$status.removeClass('gmMapEditPopupStatusWarning');
// 	$status.removeClass('gmMapEditPopupStatusError');

// 	this.displayEditNotice('Edit path/area nodes by clicking and dragging.<br/>Hit \'Finish\' on the right when done.<br />Ctrl+Click deletes a point. Shift+Click adds a point.', 'Finish', 'Cancel');
// 	if (MsgType == null || MsgType === 'ok')
// 		$status.addClass('gmMapEditPopupStatusOk');
// 	else if (MsgType === 'note')
// 		$status.addClass('gmMapEditPopupStatusNote');
// 	else if (MsgType === 'warning')
// 		$status.addClass('gmMapEditPopupStatusWarning');
// 	else if (MsgType === 'error')
// 		$status.addClass('gmMapEditPopupStatusError');
// }