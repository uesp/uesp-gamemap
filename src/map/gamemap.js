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

let self; // Local "this" instance of Gamemap
let map; // Leaflet map instance
let mapBounds; // Current map bounds in LatLngs
let tileLayer; // Current tile layer
let RC; // RasterCoords instance, for converting leaflet latlngs to XY pixel coords and back

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
			this.mapWorlds = new Map();
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
		if(mapState.coords == null || mapState.zoomLevel == null) {
			// reset map to fill world bounds
			map.fitBounds(RC.getMaxBounds(), {animate: false});
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

		// update map state
		mapState = mapState ?? this.getMapState();
		let x = Number(this.toCoords(map.getCenter()).x, this.mapConfig.coordType).toFixed(3);
		let y = Number(this.toCoords(map.getCenter()).y, this.mapConfig.coordType).toFixed(3);
		mapState.coords = (this.mapConfig.coordType == COORD_TYPES.NORMALISED || this.mapConfig.coordType == COORD_TYPES.PSEUDO_NORMALISED) ? [x, y] : [Math.floor(x), Math.floor(y)];
		mapState.zoomLevel = parseFloat(map.getZoom().toFixed(3));
		mapState.world = this.getWorldFromID(this.currentWorldID);
		this.currentMapState = mapState;

		// update url
		let mapLink;
		if (!location.href.includes("localhost")) { // use server schema if hosted, else use query params
			mapLink = (window.location.href.includes("/"+this.mapConfig.database+"/")) ? "?" : (this.mapConfig.database+"/?");
		} else {
			mapLink = "?game=" + this.mapConfig.database + "&";
		}

		// world related
		if (this.hasMultipleWorlds()){
			mapLink += 'world=' + mapState.world.name;
			mapLink += '&';
		}
		if (mapState.world.hasMultipleLayers()) {
			mapLink += 'layer=' + mapState.world.layers[mapState.layerIndex].name;
			mapLink += '&';
		}
		mapLink += 'x=' + mapState.coords[0];
		mapLink += '&y=' + mapState.coords[1];
		mapLink += '&zoom=' + mapState.zoomLevel;
		if (mapState.showGrid) {
			mapLink += '&grid=' + mapState.showGrid;
		}

		// callback
		self.mapCallbacks?.onMapStateChanged(mapState);

		// update url with new state
		window.history.replaceState(mapState, document.title, mapLink);
  		window.dispatchEvent(new PopStateEvent('popstate'));
	}

	/*================================================
						  Worlds
	================================================*/

	/** Get world data for this game's mapConfig. If no mapConfig param provided, returns current list of worlds
	 * @see initialiseMap()
	 */
	getWorlds(mapConfig) {

		if (mapConfig) {

			let queryParams = {};
			queryParams.action = "get_worlds";
			queryParams.db = mapConfig.database;
			self.mapCallbacks?.setLoading("Loading world(s)");

			if (this.mapWorlds.size === 0) {
				getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

					if (!error && data?.worlds) {
						let worlds = data.worlds;

						// parse worlds
						worlds.forEach(world => {
							if (world.id > mapConfig.minWorldID && world.id < mapConfig.maxWorldID && world.name) {
								self.mapWorlds.set(world.id, new World(world, mapConfig));
							}
						});

						// initialise map
						print(`Loaded ${worlds.length} worlds!`);
						print(worlds);
						self.initialiseMap(mapConfig);

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
	 * @param {String} worldID - Either a worldID or a world object
	 * @returns {Boolean} Whether or not the provided world is valid or not
	 */
	isWorldValid(worldID) {
		return (worldID && worldID >= 0 && this.mapWorlds.has(worldID));
	}

	/** Get the current world object
	 * @returns {Object} world - An object that represents the current map world.
	 */
	getCurrentWorld() {
		return this.getMapState()?.world ?? this.getWorldFromID(this.currentWorldID ?? this.mapConfig.defaultWorldID);
	}

	/** Gets the current world ID (0 by default).
	 * @returns {int} worldID - ID that represents a world in the database.
	 */
	getCurrentWorldID() {
		return this.currentWorldID ?? getCurrentWorld()?.id;
	}

	/** Gets the world object associated to a given worldID.
	 * @param {int} worldID - ID that represents a world in the database.
	 * @returns {Object} world - A world object that contains map info for the gamemap.
	 */
	getWorldFromID(worldID) {
		return this.mapWorlds.get(worldID);
	}

	/** Get internal world name from a given worldID
	 * @param {Object} world - An object that represents the current map world.
	 * @returns {String} worldName - The internal name of the world.
	 */
	getWorldNameFromID(worldID) {
		return this.getWorldFromID(worldID)?.name;
	}

	/** Get world display name from a given worldID
	 * @param {Int} worldID - A world ID.
	 * @returns {String} displayName - The user facing display name of the world.
	 */
	getWorldDisplayNameFromID(worldID) {
		return this.getWorldFromID(worldID)?.displayName;
	}

	/** Get world object from internal world name
	 * @param {String} worldName - An internal worldName as a string.
	 * @returns {Object} world - A world object.
	 */
	getWorldFromName(worldName){
		return [...this.mapWorlds.values()].find(prop => prop.name == worldName);
	}

	/** Get world object from user facing display name
	 * @param {String} worldDisplayName - A world's display name.
	 * @returns {Object} world - A world object.
	 */
	getWorldFromDisplayName(worldDisplayName){
		return [...this.mapWorlds.values()].find(prop => prop.displayName == worldDisplayName);
	}

	/** Simple function that returns whether the current gamemap has multiple worlds.
	 * @returns {Boolean} - A boolean whether or not the current gamemap contains multiple worlds.
	 */
	hasMultipleWorlds() {
		return this.mapWorlds.size > 1;
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
		this.mapCallbacks?.setLoading(true);
		place = (place) ? (isString(place)) ? parseInt(place) : place : this.getCurrentWorldID();
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
						self.mapCallbacks?.setLoading(false);
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
					self.mapCallbacks?.setLoading(false);
				} else { // else load up the new world
					self.clearLocations();
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

		if (latLngs.lat != null) {
			// project latlng to XY coords;
			coords = RC.project(latLngs);
		} else if (Array.isArray(latLngs)) {
			coords = [];
			latLngs.forEach((latLng) => {
				coords.push(this.toCoords(latLng, this.mapConfig.coordType));
			});
			return coords;
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

				// work out normalised grid cell sizes
				let cellSize = (self.mapConfig.cellSize != null) ? self.mapConfig.cellSize : Math.round(self.mapConfig.tileSize * Math.pow(2, Math.round(world.maxZoomLevel)) / ((world.maxX - world.minX) / world.cellSize));
				let nGridSize = cellSize / Math.pow(2, Math.round(world.maxZoomLevel) - currentZoom) / gridHeight;

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
		if (mapLock && mapLock == MAPLOCK.FULL)  {
			map.dragging.disable();
			//map.options = {smoothWheelZoom : false};
		} else {
			map.dragging.enable();
		}

		// callback back to UI
		this.mapLock = mapLock;
		this.mapCallbacks?.onMapLockChanged(this.mapLock);
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
		return `${this.mapConfig.tileURL + world.name}/leaflet/${world.layers[layerIndex].name + zoom + world.name + xy}`;
	}

	/*================================================
						Locations
	================================================*/


	addNewLocation(locType) {

		print("adding location..");

		let isMarker = locType == LOCTYPES.MARKER;
		let showTooltip = isMarker;
		this.setMapLock(isMarker ? MAPLOCK.PARTIAL_NEW_MARKER : locType == LOCTYPES.AREA ? MAPLOCK.PARTIAL_NEW_POLYGON : MAPLOCK.PARTIAL_NEW_LINE );
		let shape = (isMarker ? "Marker" : locType == LOCTYPES.AREA ? "Polygon" : "Line");
		let altText = isMarker ? "new_marker" : "";

		map.pm.enableDraw(shape, {
            markerStyle: {
				icon: this.getIcon(1),
				alt: altText,
			},
            continueDrawing: false,
			tooltips: showTooltip,
        });

		if (isMarker) { // hacky stuff to add label to geoman's marker object
			// get our marker
			let marker = document.querySelectorAll(`[alt="${altText}"]`)[0];
			if (marker) {
				marker.removeAttribute("alt") // remove alt attribute
				marker.classList.add("editing");
				print(marker);

				// get tooltip
				let tooltip = document.getElementById(marker.getAttribute('aria-describedby'));
				tooltip.classList.add("location-label", "new-marker-label", "editing");
				tooltip.innerText = "New Marker";
			}
		}

	}

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
			return;
		}

		// generate api query
		var queryParams = {};
		queryParams.action = "get_locs";
		queryParams.world  = world.id;
		queryParams.db = this.mapConfig.database;

		// make api query
		getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {
			if (!error && data?.locations) {
				let locations = data.locations;
				let locationMap = new Map();

				print(`Got ${data.locationCount} locations!`);
				print(locations);

				locations.forEach(location => {
					if (location.id && location.visible == 1 && !location.description.includes("teleport dest")) {
						locationMap.set(location.id, new Location(location, world));
					}
				});

				// update world
				self.mapWorlds.get(world.id).locations = locationMap;

				// make sure we're in the right world before overwriting all locations
				if (self.getCurrentWorldID() == world.id) {
					self.updateMapState();
					self.redrawLocations(locationMap);
				}
			} else {
				print.warn("There was an error getting locations for this world!");
			}
		});

	}

	getLocation(locationID, onLoadFunction) {

		locationID = Math.abs(locationID);
		let hasSearchedLocal = false;
		let callback = function(location) {
			onLoadFunction.call(null, location);
		}

		print(`Getting info for locationID: ${locationID}`);

		// iterate through local world list to see if locationID exists in them
		this.mapWorlds?.forEach(world => {
			if (world?.locations?.has(locationID)) {
				hasSearchedLocal = true;
				callback(world.locations.get(locationID));
			}
		});

		// if no local copies of that locationID exist, search the online db
		if (!hasSearchedLocal) {
			let queryParams = {};
			queryParams.action = "get_loc";
			queryParams.locid = locationID;
			queryParams.db = this.mapConfig.database;

			getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

				print(data);

				if (!error && data?.locations[0] != null) {
					print("Got location info!");
					let world = self.getWorldFromID(data?.locations[0]?.worldId);
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
		map.eachLayer((layer) => {
			if (!layer._tiles && layer.options.className != "cellGrid" ) { //remove anything that is not a tile or cell grid
				layer.off('resize move zoom');
				layer.remove();
			}
		});
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

	// delete location from the map
	deleteLocation(location) {

		// remove existing marker(s)
		let markers = this.getMarkersFromLocation(location);
		markers.forEach(function(marker) { marker.remove() });

		// delete location from data as well
		let locations = this.getCurrentWorld().locations;
		delete locations[location.id];
	}

	// update location on the map
	updateLocation(location) {

		// remove existing marker(s)
		let markers = this.getMarkersFromLocation(location);
		markers.forEach(function(marker) { marker.remove() });

		// update location data
		this.getCurrentWorld().locations.set(location.id, location);

		// create new markers
		markers = this.getMarkers(location);
		markers.forEach(function(marker) { marker.addTo(map) });

		// enable edit mode on marker if needed
		if (location.editing) {
			markers[0].edit();
			markers.forEach(function(marker) { marker.setEditingEffect(true) });
		}

	}

	redrawLocations(locations) {

		// delete any existing location layers
		this.clearLocations();

		// set up location layer for each zoom level
		print("Loading initial locations...");

		// check if current map has any locations
		if (locations.size > 0) {

			// iterate through each location in the list
			print("Adding location markers to map...")
			locations.forEach(location => {

				if (location.isVisible()) {
					// add markers to the map
					this.getMarkers(location).forEach(marker => { marker.addTo(map) });
					location.setWasVisible(true);
				}
			});
		}

		// callback to show map fully loaded
		this.mapCallbacks?.onMapLoaded(true);
		this.mapRoot.style.animation = "none";

	}

	// create marker(s) for location
	getMarkers(location) {

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
				fillColor: location.fillColour,
				color: location.strokeColour,
				fillOpacity: null,
				weight: location.strokeWidth,
			}

			if (location.locType == LOCTYPES.AREA) {
				marker = new L.polygon(coords, options);

				if (location.hasIcon()) {
					marker.setIsIconPolygon(true);
					polygonIcon = this.makeMarker(location, marker.getCentre());
				}
			}

			if (location.locType == LOCTYPES.PATH) {
				marker = new L.polyline(coords, options);
			}

		} else { // if no, then it must be a single point (icon, label)

			if (location.hasIcon()) {
				marker = this.makeMarker(location, this.toLatLngs(coords[0]));
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

				// on marker deselected
				marker.on("mouseout", function () {
					self.clearTooltips();
					let isPolygon = marker.location.isPolygon() && marker._path;

					if (isPolygon){
						this.setStyle({
							fillColor: location.fillColour,
							color: location.strokeColour,
							weight: location.strokeWidth,
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
							fillColor: location.fillColourHover,
							color: location.strokeColourHover,
							weight: location.strokeWidthHover,
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

	getIcon(iconNumber) {
		let anchor = [this.mapConfig.iconSize / 2, this.mapConfig.iconSize / 2];
		let iconURL = this.mapConfig.iconPath + iconNumber + ".png";

		let locationIcon = L.icon({
			iconUrl: iconURL,
			iconAnchor: anchor,
			iconSize: [this.mapConfig.iconSize, this.mapConfig.iconSize],
		});

		return locationIcon;
	}

	makeMarker(location, coords) {
		return L.marker(coords, {icon: this.getIcon(location.icon), riseOnHover: true});
	}

	getLocationLabel(location) {

		let offset = [0, 0];
		const [X_OFFSET, Y_OFFSET] = [this.getMapConfig().labelOffset, this.getMapConfig().labelOffset / 2];

		// set label offset based on direction
		switch (LABEL_POSITIONS[location.labelPos]) {
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
			direction: LABEL_POSITIONS[location.labelPos],
			interactive: true,
			offset: offset,
			riseOnHover: true,
		}
	}


	/*================================================
						Map Events
	================================================*/

	bindMapEvents() {


		map.on("pm:create", ({ shape, layer }) => {
			print(shape);
			print(layer);
			let isMarker = shape == "Marker";
			layer.remove();
			print(isMarker);
			let location = new Location({
				locType:  (isMarker) ? LOCTYPES.MARKER : (shape == "Polygon") ? LOCTYPES.AREA : LOCTYPES.LINE,
				coords: self.toCoords(layer.getCoordinates()),
			});
			print(location);
			this.edit(location);
		});

		map.on('resize moveend zoomend', function() {

			self.getCurrentWorld()?.locations?.forEach(location => {

				let isVisible = location.isVisible();
				let wasVisible = location.getWasVisible();

				// add/remove from DOM on marker visibility change
				if (isVisible != wasVisible) {
					if (isVisible) {

						let markers = self.getMarkers(location);
						markers.forEach(function(marker) {
							marker.addTo(map);
							if (marker.location.hasLabel() && !(marker.location.hasIcon() && marker._path)) {
								marker.bindTooltip(marker.location.name, self.getLocationLabel(marker.location));
							}
						});

					} else {
						self.getMarkersFromLocation(location).forEach(m => m.remove());
					}

					location.setWasVisible(isVisible);
				}

			});

			self.updateMapState();
			self.clearTooltips();
		});

		map.on("contextmenu", function(event){
			if (self.getMapState().world.parentID != null && self.getMapState().world.parentID != -1 ) {
				if (!self.mapLock) {
					let parentID = self.getMapState().world.parentID;
					self.goto(parentID);
				}
			}
			print(event);
			let target = event.originalEvent.explicitOriginalTarget;
			print(target);
			if (target != self.mapRoot && target.classList != null && !target.classList.contains("leaflet-interactive")) {
				target.oncontextmenu = null;
			}
		})

		map.on("zoom", function() {

			if (!self.mapLock && self.mapLock != "full") {
				self.mapCallbacks?.onZoom(map.getZoom());
			} else {
				//self.reset(true, 50);
			}
		})

		map.on("dblclick", function(event) {
			let target = event.originalEvent?.target ?? event?.originalEvent?.explicitOriginalTarget;
			if (target.classList.contains("leaflet-interactive")) {
				map.panTo(event.latlng, {animate: true});
			}
			print(target);
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

	getCurrentViewBounds() {

		let northWest = this.toCoords(this.getCurrentMapBounds().getNorthWest());
		let southEast = this.toCoords(this.getCurrentMapBounds().getSouthEast());

		let bounds = {};
		bounds.minX = northWest.x;
		bounds.maxX = southEast.x;
		bounds.minY = (this.mapConfig.coordType == COORD_TYPES.WORLDSPACE) ? southEast.y : northWest.y;
		bounds.maxY = (this.mapConfig.coordType == COORD_TYPES.WORLDSPACE) ? northWest.y : southEast.y;

		return bounds;

	}

	getMapBounds() {
		return RC.getMaxBounds();
	}

	getCurrentMapBounds() {
		return mapBounds = map.getBounds();
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
		// tell the editor we're editing this object
		this.mapCallbacks?.edit(object);
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
		this.mapCallbacks?.setLoading("Getting permissions");

		getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

			let canEdit = false;

			if (!error && data != null) {
				canEdit = data.canEdit;
			} else {
				print.warn("There was an error getting permissions.")
			}

			self.mapConfig.editingEnabled = ((canEdit || isDebug) && (!self.isEmbedded() && !isMobile()));
			self.mapCallbacks?.onPermissionsLoaded(self.mapConfig.editingEnabled);
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

		if (!(this.mapWorlds.has(this.currentWorldID))) {
			return "";
		}

		let wikiPage = this.mapWorlds.get(this.currentWorldID).wikiPage;
		if (wikiPage == null || wikiPage == '') wikiPage = this.mapWorlds.get(this.currentWorldID).displayName;

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
	isIconPoly: null,

	// getters
	getLocation: function() { return this.location },
	getCentre: function(latLngs) { return this.getLatLng?.() ?? L.latLngBounds((latLngs && Array.isArray(latLngs)) ? latLngs : this.getCoordinates()).getCenter() },
	getElement() { return this.element = this?._icon ?? this?._path },
	getTooltip() { return document.getElementById(this.getElement()?.getAttribute('aria-describedby')) },
	isIconPolygon() { return this.isIconPoly },
	isEditing() { return this.getElement()?.classList?.contains("editing") || this.editing },

	// setters
	setLocation(location) { this.location = location },
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

	setEditingEffect(doEffect) {
		if (doEffect) {
			// add editing effect to marker
			this.getElement()?.classList?.add("editing");
			setTimeout(() => {this.getTooltip()?.classList?.add("editing")}, 15);
			this.editing = doEffect;
		}
	},

	edit() {
		this.editing = true;
		this.pm.enable({ allowEditing: true, snapDistance: self.mapConfig.markerSnapDistance, draggable: true });
		this.on('pm:markerdragend pm:vertexremoved pm:edit', (e) => {
			if ((e.shape == "Marker") || ((e.shape == "Polygon" || e.shape == "Line") && (e.type == "pm:markerdragend" || e.type == "pm:vertexremoved"))) {
				updateMarkerCoords(self.toCoords(e.layer.getCoordinates()));
			}
		});
	}
});

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