/**
 * @name gamemap.js
 * @author Dave Humphrey <dave@uesp.net> (21st Jan 2014)
 * @summary The main source code for the interactive gamemap.
 */

// import leaflet
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// import plugins
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
			gamemap.id = "gamemap"
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
		onlyUpdateTiles = (onlyUpdateTiles != null) ? onlyUpdateTiles : false;

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
			map.fitBounds(RC.getMaxBounds(), {animate: false})
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
		newMapState.coords = (this.mapConfig.coordType == COORD_TYPES.NORMALISED) ? [x, y] : [Math.floor(x), Math.floor(y)];
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
			if (place > 0) { // is destination a worldID?
				gotoWorld(place);
			} else { // it is a locationID
				let locationID = Math.abs(place);
				print("going to location");
				this.getLocation(locationID, onGetLocation);
				function onGetLocation(location) {
					print(location);
					self.goto(location);
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
	 * @param {Object} latLng - the leaflet latLng coordinate object
	 */
	toCoords(latLng, coordType) {

		var coords;
		coordType = (coordType != null) ? coordType : (latLng instanceof Point) ? latLng.coordType : this.mapConfig.coordType;

		// convert latlng to XY coords;
		if (latLng.lat != null) {
			coords = RC.project(latLng);
		}

		if (coordType != COORD_TYPES.XY) {
			if (coordType == COORD_TYPES.NORMALISED) {
				if (coords.x > 1.5 || coords.y > 1.5) { // make sure to only convert non-normalised coordinates
					// divide xy coords by height to get normalised coords (0.xxx , 0.yyy)
					coords.x = (coords.x / this.mapImage.width).toFixed(3);
					coords.y = (coords.y / this.mapImage.height).toFixed(3);
				}
			} else if (coordType == COORD_TYPES.WORLDSPACE) {
				// get current map world pixel position values
				let world = this.getCurrentWorld();
				let nX = coords.x / world.totalWidth;
				let nY = 1 - (coords.y / world.totalHeight);

				// reproject pixel values to worldspace
				coords.x = Math.trunc(world.minX + (world.maxX - world.minX) * nX);
				coords.y = Math.trunc(world.minY + (world.maxY - world.minY) * nY);
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

		if (coords instanceof Point && !Array.isArray(coords)) {

			switch (coords.coordType) {
				default:
				case COORD_TYPES.XY || null:
					latLngs = RC.unproject([coords.x , coords.y]);
					return latLngs;
				case COORD_TYPES.NORMALISED:
					let x = (coords.x * this.mapImage.width);
					let y = (coords.y * this.mapImage.height);

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
				self.updateMapState();
				self.redrawLocations(parsedLocations);
			} else {
				print.warn("There was an error getting locations for this world.");
			}
		});

	}

	getLocation(locationID, onLoadFunction) {
		if (locationID > 0) {
			let queryParams = {};
			queryParams.action = "get_loc";
			queryParams.locid  = locationID;
			queryParams.db = this.mapConfig.database;

			getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

				print("Getting info for locationID: "+ locationID);

				print(data);

				if (!error && data != null && data.locations[0] != null) {
					print("Got location info!");
					print(data);
					if (!(onLoadFunction == null) ) {
						let world = self.getWorldFromID(data.locations[0].worldId);
						print(data.locations[0]);
						let location = new Location(data.locations[0], world)
						onLoadFunction.call(null, location);
					}
				} else {
					print("LocationID " + locationID + " was invalid.");
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
			if (layer._tiles == null && layer.options.className != "cellGrid" ) { //remove anything that is not a tile
				layer.off('resize move zoom');
				layer.remove();
			}
		});
	}

	redrawMarkers(marker){

		let latlngs = [];

		if (marker instanceof L.Marker) {
			latlngs = [marker.getLatLng()];
		} else {
			latlngs = marker.getLatLngs()[0];
			// latlngs = array.push(this.toLatLngs(getAverageCoord(array)));
			// todo: do averagecoord here
		}

		let isInsideViewport;

		for (let i = 0; i < latlngs.length; i++ ) {

			if (isInsideViewport != true) {
				isInsideViewport = (map.getBounds().contains(latlngs[i]));
			}
		}

		let isVisible = isInsideViewport && marker.displayLevel <= map.getZoom();
		let wasVisible = marker._wasVisible;

		// add/remove from DOM on change
		if (isVisible != wasVisible) {
			if (isVisible) {

				if (this.markerLayer.hasLayer(marker)) {
					marker.addTo(map);
					if (marker.location.hasLabel() && !(marker.location.hasIcon() && marker._path != null)) {
						marker.bindTooltip(marker.location.name, this.getLocationLabel(marker.location));
					}
				}

			} else {
				//print("should be getting removed");
				marker.remove();
			}

			marker._wasVisible = isVisible;

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

					// add marker to relevant map layer
					if (markers != null) {

						markers.forEach(marker => {
							// bind event listeners to marker
							locationMarkers.push(marker);
							this.bindMarkerEvents(marker, location)

							// add label to marker if applicable
							if (location.hasLabel() && !(location.hasIcon() && marker._path != null)) {
								marker.bindTooltip(location.name, this.getLocationLabel(location));
							}
						});
					}
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
		}

	}

	// create marker(s) for location
	getMarkers(location){

		let markers = [];
		let polygonIcon = null;
		let coords = location.coords;

		// make a generic fallback marker
		let marker = new L.marker(this.toLatLngs(coords[0]));
		L.Marker.prototype.options.icon = L.icon({
			iconUrl: IMAGES_DIR + "transparent.png",
		});

		// create specific marker type
		if (location.isPolygon()) { // is location polygonal? (polyline or polygon)

			// get coordinates of location
			coords = [];
			for (let i = 0; i < location.coords.length; i++) {
				coords.push(this.toLatLngs(location.coords[i]));
			}

			let options = {
				noClip: true,
				renderer: L.svg({ padding: 5 }),
				smoothFactor: 2,
				fillColor: location.style.fillColour,
				color: location.style.strokeColour,
				opacity: location.style.strokeOpacity,
				fillOpacity: location.style.fillOpacity,
				weight: location.style.lineWidth,
			}

			if (location.locType == LOCTYPES.AREA) {
				marker = new L.polygon(coords, options);

				if (location.hasIcon()){
					marker.addTo(map);
					polygonIcon = this.makeMarker(location, marker.getCenter());
					marker.remove();
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

		if (polygonIcon != null){
			markers = [marker, polygonIcon];
		} else {
			markers = [marker];
		}

		return markers;
	}

	makeMarker(location, coords) {
		let anchor = [location.iconSize/2, location.iconSize/2];
		let iconURL = this.mapConfig.iconPath + location.icon + ".png";

		let locationIcon = L.icon({
			iconUrl: iconURL,
			iconAnchor: anchor,
		});

		let marker = L.marker(coords, {icon: locationIcon});

		return marker;
	}

	getLocationLabel(location) {

		let offset = [0, 0];
		const OFFSET_AMOUNT = 5;

		// set label offset based on direction
		switch (location.labelDirection) {
			case "top":
				offset = [0, -OFFSET_AMOUNT];
				break;
			case "bottom":
				offset = [0, OFFSET_AMOUNT];
				break;
			case "left":
				offset = [-OFFSET_AMOUNT, 0];
				break;
			case "right":
				offset = [OFFSET_AMOUNT, 0];
				break;
			case "auto":
				offset = [OFFSET_AMOUNT, 0];
				break;
		}
		return {
			className : "location-label",
			permanent: true,
			direction: location.labelDirection,
			offset: offset,
		}
	}


	/*================================================
						  Events
	================================================*/

	bindMapEvents() {

		map.on('resize moveend zoomend', function() {
			self.updateMapState();
			self.clearTooltips();
		});

		map.on("contextmenu", function(e){
			if (self.getMapState().world.parentID != null && self.getMapState().world.parentID != -1 ) {
				let parentID = self.getMapState().world.parentID;
				self.goto(parentID);
			}
		})

		map.on("zoom", function() {

			if (self.mapCallbacks != null) {
				self.mapCallbacks.onZoom(map.getZoom());
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

		map.on("contextmenu", function (event) {
			print(event);
			let target = event.originalEvent.explicitOriginalTarget;

			print(target);
			if (target != self.mapRoot && target.classList != null && !target.classList.contains("leaflet-interactive")) {

				target.oncontextmenu = null;
				//preventDefault(event);
			} else {

			}
		});

	}

	onMarkerClicked(marker, shift, ctrl) {

		print(marker.location);

		let isJumpTo = marker.location != null && marker.location.isClickable();

		if (isJumpTo && !shift && !ctrl) { // is location a link to a worldspace/location

			let location = marker.location;
			if (location != null){
				if (location.destinationID < 0) { // is location destination a worldID
					this.goto(Math.abs(location.destinationID));
				} else { // it is a location ID
					function onGetLocation(location) {
						self.goto(location.worldID);
					}
					this.getLocation(location.destinationID, onGetLocation);
				}
			}
		} else {
			if (shift) { // if shift pressed, and can edit, show edit menu
				this.openPopup(marker, this.canEdit());
			}
		}

		// if normally clicked or pressing ctrl, show popup
		if (!shift || ctrl ) {

			if (isJumpTo && !ctrl){
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
			L.popup(latlng, {content: marker.location.getPopupContent() }).openOn(map);
		} else {
			M.toast({html: "TODO: Editing not done yet."});
		}
	}

	bindMarkerEvents(marker, location) {

		// on add to map
		marker.once('add', function () {

			marker.location = location;

			if (location.worldID == self.getCurrentWorldID()){
				this.displayLevel = location.displayLevel;

				map.on('resize moveend zoomend', function(){
					self.redrawMarkers(marker);
				});

			}

			if (location.displayLevel > map.getZoom()) {
				if (location.locType != LOCTYPES.PATH) {
					marker.remove();
				}
			}

		});

		// on marker deselected
		marker.on("mouseout", function () {
			self.clearTooltips();
			let isPolygon = marker.location.isPolygon() && marker._path != null;

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

			let isPolygon = marker.location.isPolygon() && marker._path != null;
			let latLngs = (isPolygon ) ? marker.getCenter() : marker.getLatLng();


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
			let shift = event.originalEvent.shiftKey; // edit
			let ctrl = event.originalEvent.ctrlKey; // popup
			self.onMarkerClicked(this, shift, ctrl);
		});

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

	/*================================================
						  General
	================================================*/

	// reset map
	reset(currentWorldOnly) {
		if (!this.hasMultipleWorlds() || currentWorldOnly) {
			map.fitBounds(RC.getMaxBounds(), {animate: true});
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
		for (let [key, value] of Object.entries(layers)) {
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

// uesp.gamemap.Map.prototype.hasLocation = function(locId)
// {
// 	return locId in this.locations;
// }

// uesp.gamemap.Map.prototype.onFinishEditMode = function(event)
// {
// 	if (this.currentEditMode == '') return true;

// 	this.removeEditClickWall();
// 	this.hideEditNotice();

// 	if (this.currentEditMode == 'addpath')
// 	{
// 		this.onFinishedAddPath();
// 	}
// 	else if (this.currentEditMode == 'addarea')
// 	{
// 		this.onFinishedAddArea();
// 	}
// 	else if (this.currentEditMode == 'edithandles')
// 	{
// 		this.onFinishedEditHandles();
// 	}
// 	else if (this.currentEditMode == 'draglocation')
// 	{
// 		this.onFinishedEditDragLocation();
// 	}

// 	this.currentEditMode = '';

// 	this.redrawCanvas(true);

// 	return true;
// }


// uesp.gamemap.Map.prototype.onAddLocationStart = function()
// {
// 	if (!this.canEdit()) return false;
// 	if (this.currentEditMode != '') return false;

// 	this.addEditClickWall();
// 	this.currentEditMode = 'addlocation';
// 	this.displayEditNotice("Click on the map to add a location...", '', 'Cancel');

// 	return true;
// }


// uesp.gamemap.Map.prototype.onFinishedAddPath = function()
// {
// 	this.displayLocation(this.currentEditLocation);
// 	this.currentEditLocation.showPopup();

// 	this.currentEditLocation = null;
// 	return true;
// }


// uesp.gamemap.Map.prototype.onFinishedAddArea = function()
// {
// 	this.onFinishedAddPath();
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


// uesp.gamemap.Map.prototype.onAddPathClick = function (event)
// {
// 	if (!this.canEdit()) return false;
// 	if (this.currentEditLocation == null) return false;

// 	gamePos = this.convertWindowPixelToGamePos(event.pageX, event.pageY);

// 	this.currentEditLocation.displayData.points.push(gamePos.x);
// 	this.currentEditLocation.displayData.points.push(gamePos.y);

// 	xMin = this.currentEditLocation.displayData.points[0];
// 	yMin = this.currentEditLocation.displayData.points[1];
// 	xMax = this.currentEditLocation.displayData.points[0];
// 	yMax = this.currentEditLocation.displayData.points[1];
// 	numPoints = this.currentEditLocation.displayData.points.length;

// 	for (i = 0; i < numPoints; i += 2)
// 	{
// 		x = this.currentEditLocation.displayData.points[i];
// 		y = this.currentEditLocation.displayData.points[i+1];

// 		if (x < xMin) xMin = x;
// 		if (y < yMin) yMin = y;
// 		if (x > xMax) xMax = x;
// 		if (y > yMax) yMax = y;
// 	}

// 		//TODO: Proper handling of inverse coordinate systems
// 	this.currentEditLocation.x = xMin;
// 	this.currentEditLocation.y = yMax;

// 	this.currentEditLocation.width  = xMax - xMin;
// 	this.currentEditLocation.height = yMax - yMin;

// 	this.displayLocation(this.currentEditLocation);
// 	this.redrawCanvas(true);

// 	return true;
// }


// uesp.gamemap.Map.prototype.onAddAreaClick = function (event)
// {
// 	this.onAddPathClick(event);
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



// uesp.gamemap.Map.prototype.retrieveCenterOnLocation = function(world, locationName)
// {
// 	var self = this;

// 	var queryParams = {};
// 	queryParams.action = "get_centeron";
// 	if (world != null) queryParams.world  = world;
// 	queryParams.centeron = locationName;
// 	queryParams.db = this.mapConfig.dbPrefix;
// 	if (this.isHiddenLocsShown()) queryParams.showhidden = 1;

// 	//if (!this.hasWorld(this.worldID)) queryParams.incworld = 1;
// 	//if (queryParams.world <= 0) return uesp.printError("Unknown worldID " + this.currentWorldID + "!");

// 	if (this.mapConfig.isOffline)
// 	{
// 		setTimeout(	function() { ugmLoadOfflineCenterOnLocation(self, queryParams); }, 10);
// 	}
// 	else
// 	{
// 		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) { self.onReceiveCenterOnLocationData(data); });
// 	}

// }

// uesp.gamemap.Map.prototype.onEditDragLocationStart = function (location)
// {
// 	this.currentEditMode = 'draglocation';
// 	this.currentEditLocation = location;
// 	this.displayEditNotice('Click to move location to a new position.<br/>Hit \'Finish\' on the right when done.', 'Finish', 'Cancel');
// 	this.currentEditPathPoints = uesp.cloneObject(location.displayData.points);

// 	this.addEditClickWall();

// 	this.displayLocation(this.currentEditLocation);
// 	this.redrawCanvas(true);
// }


// uesp.gamemap.Map.prototype.onFinishedEditDragLocation = function (location)
// {
// 	this.removeEditClickWall();

// 	this.displayLocation(this.currentEditLocation);

// 	this.currentEditLocation.showPopup();
// 	this.currentEditLocation.updateFormPosition();
// 	this.currentEditLocation.updateOffset();
// 	this.currentEditLocation.updatePopupOffset();


// 	this.currentEditLocation = null;
// 	return true;
// }


// uesp.gamemap.Map.prototype.onEditPathHandlesStart = function (location)
// {
// 	this.currentEditMode = 'edithandles';
// 	this.currentEditLocation = location;
// 	this.displayEditNotice('Edit path/area nodes by clicking and dragging.<br/>Hit \'Finish\' on the right when done.<br />Ctrl+Click deletes a point. Shift+Click adds a point.', 'Finish', 'Cancel');
// 	this.currentEditPathPoints = uesp.cloneObject(location.displayData.points);

// 	this.currentEditLocation.updateFormPosition();
// 	this.addEditClickWall('default');

// 	if (this.currentEditLocation.pathElement)
// 	{
// 		this.currentEditLocation.pathElement.css('z-index', '150');
// 	}

// 	this.displayLocation(this.currentEditLocation);
// 	this.redrawCanvas();
// }


// uesp.gamemap.Map.prototype.onFinishedEditHandles = function()
// {
// 	this.removeEditClickWall();

// 	if (this.currentEditLocation.pathElement)
// 	{
// 		this.currentEditLocation.pathElement.css('z-index', '');
// 	}

// 	this.currentEditLocation.editPathHandles = false;
// 	this.displayLocation(this.currentEditLocation);

// 	this.currentEditLocation.showPopup();
// 	this.currentEditLocation.updateFormPosition();
// 	this.currentEditLocation.updateOffset();
// 	this.currentEditLocation.updatePopupOffset();

// 	this.currentEditLocation = null;

// 	this.redrawCanvas();

// 	return true;
// }


// uesp.gamemap.Map.prototype.onEditWorld = function()
// {
// 	if (!this.canEdit()) return false;
// 	if (this.currentEditMode != '') return false;

// 	this.addEditClickWall('default');
// 	this.setEditClickWallBackground('rgba(0,0,0,0.5)');
// 	this.currentEditMode = 'editworld';

// 	this.currentEditWorld = this.mapWorlds[this.currentWorldID];
// 	this.showWorldEditForm();

// 	return true;
// }


// uesp.gamemap.Map.prototype.showWorldEditForm = function()
// {
// 	if (this.currentEditWorld == null) return false;


// 	var worldEditForm =	"<form onsubmit='return false;'>" +
// 						"<div class='gmMapEditPopupTitle'>Editing World</div>" +
// 						"<div class='gmMapPopupClose'><img src='images/cancelicon.png' width='12' height='12' /></div><br />" +
// 						"<div class='gmMapEditPopupLabel'>Name</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='name' value=\"{name}\" size='24' maxlength='100' readonly /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Enabled</div>" +
// 							"<input type='checkbox' class='gmMapEditPopupInput' name='enabled' value='1' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Parent World ID</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='parentId' value='{parentId}' size='8'  maxlength='10' /> &nbsp; &nbsp; use a worldID<br />" +
// 						"<div class='gmMapEditPopupLabel'>Display Name</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name=\"displayName\" value=\"{displayName}\" size='24'  maxlength='100' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Wiki Page</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name=\"wikiPage\" value=\"{wikiPage}\" size='24'  maxlength='100' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Description</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name=\"description\" value=\"{description}\" size='24'  maxlength='500' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Missing Tile</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name=\"missingMapTile\" value=\"{missingMapTile}\" size='24'  maxlength='100' readonly /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Zoom Min/Max</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='minZoom' value='{minZoom}' size='8'  maxlength='10' /> &nbsp; " +
// 							"<input type='text' class='gmMapEditPopupInput' name='maxZoom' value='{maxZoom}' size='8'  maxlength='10' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Zoom Offset</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='zoomOffset' value='{zoomOffset}' size='8'  maxlength='10' /> " +
// 							"<div class='gmMapEditPopupCurrentZoom'>Current Zoom = </div> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Game Pos -- Left</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='posLeft' value='{posLeft}' size='8'  maxlength='10' /> &nbsp; " +
// 							"&nbsp;&nbsp; Right <input type='text' class='gmMapEditPopupInput' name='posRight' value='{posRight}' size='8'  maxlength='10' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Top</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='posTop' value='{posTop}' size='8'  maxlength='10' /> &nbsp; " +
// 							"Bottom <input type='text' class='gmMapEditPopupInput' name='posBottom' value='{posBottom}' size='8'  maxlength='10' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>worldID</div>" +
// 							"<div class='gmMapEditPopupInput'>{id}</div> &nbsp; " +
// 							" &nbsp;  &nbsp; Revision<div class='gmMapEditPopupInput'>{revisionId}</div> &nbsp; <br />" +
// 						"<div class='gmMapEditPopupStatus'></div>" +
// 						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonSave' value='Save' />" +
// 						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonClose' value='Cancel' />" +
// 						"</form>";

// 	if (this.worldEditPopup == null)
// 	{
// 		this.worldEditPopup = $('<div />')
// 				.attr('id', 'gmMapWorldEdit')
// 				.appendTo(this.mapContainer);
// 	}

// 	popupHtml = uesp.template(worldEditForm, this.currentEditWorld);
// 	this.worldEditPopup.html(popupHtml);

// 	this.worldEditPopup.find('input[name=enabled]').prop('checked', this.currentEditWorld.enabled);
// 	this.worldEditPopup.find('.gmMapEditPopupCurrentZoom').text('Current Zoom = ' + this.zoomLevel);

// 	var self = this;

// 	this.worldEditPopup.find('input[name=name]').focus();

// 	this.worldEditPopup.find('.gmMapPopupClose').bind("touchstart click", function(event) {
// 		self.onCloseWorldEditPopup(event);
// 		return false;
// 	});

// 	this.worldEditPopup.find('.gmMapEditPopupButtonClose').bind("touchstart click", function(event) {
// 		self.onCloseWorldEditPopup(event);
// 		return false;
// 	});

// 	this.worldEditPopup.find('.gmMapEditPopupButtonSave').bind("touchstart click", function(event) {
// 		self.onSaveWorldEditPopup(event);
// 		return false;
// 	});

// 	this.worldEditPopup.show();
// }


// uesp.gamemap.Map.prototype.setWorldPopupEditNotice = function (Msg, MsgType)
// {
// 	if (this.worldEditPopup == null) return;

// 	$status =this.worldEditPopup.find('.gmMapEditPopupStatus');
// 	if ($status == null) return;

// 	$status.html(Msg);
// 	$status.removeClass('gmMapEditPopupStatusOk');
// 	$status.removeClass('gmMapEditPopupStatusNote');
// 	$status.removeClass('gmMapEditPopupStatusWarning');
// 	$status.removeClass('gmMapEditPopupStatusError');

// 	if (MsgType == null || MsgType === 'ok')
// 		$status.addClass('gmMapEditPopupStatusOk');
// 	else if (MsgType === 'note')
// 		$status.addClass('gmMapEditPopupStatusNote');
// 	else if (MsgType === 'warning')
// 		$status.addClass('gmMapEditPopupStatusWarning');
// 	else if (MsgType === 'error')
// 		$status.addClass('gmMapEditPopupStatusError');
// }


// uesp.gamemap.Map.prototype.doWorldSaveQuery = function(world)
// {
// 	var self = this;

// 	queryParams = world.createSaveQuery();
// 	queryParams.db = this.mapConfig.dbPrefix;

// 	if (this.mapConfig.isOffline)
// 	{
// 		// Do nothing
// 	}
// 	else
// 	{
// 		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {
// 			self.onSavedWorld(data);
// 		});
// 	}

// 	return true;
// }


// uesp.gamemap.Map.prototype.onSavedWorld = function (data)
// {
// 	uesp.printDebug(uesp.print_LEVEL_WARNING, "Received onSavedWorld data");
// 	uesp.printDebug(uesp.print_LEVEL_WARNING, data);

// 	if (!(data.isError == null) || data.success === false)
// 	{
// 		this.setWorldPopupEditNotice('Error saving world data!', 'error');
// 		this.enableWorldPopupEditButtons(true);
// 		return false;
// 	}

// 	if (data.newRevisionId != null) this.currentEditWorld.revisionId = data.newRevisionId;

// 	this.setWorldPopupEditNotice('Successfully saved location!');
// 	this.enableWorldPopupEditButtons(true);

// 	this.hideWorldEditForm();
// 	this.removeEditClickWall();
// 	this.currentEditMode = '';
// 	this.currentEditWorld = null;

// 	return true;
// }


// uesp.gamemap.Map.prototype.onRecentChanges = function (element)
// {
// 	this.isShowingRecentChanges = !this.isShowingRecentChanges;

// 	if (this.isShowingRecentChanges)
// 	{
// 		$(element).addClass('gmToggleButtonDown');
// 		this.recentChangesRoot.width('340px');
// 		this.mapContainer.css('right', '350px');

// 		this.updateRecentChanges();
// 	}
// 	else
// 	{
// 		$(element).removeClass('gmToggleButtonDown');
// 		this.recentChangesRoot.width('0px');
// 		this.mapContainer.css('right', '0px');
// 	}
// 	return false;
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

// 	if (MsgType == null || MsgType === 'ok')
// 		$status.addClass('gmMapEditPopupStatusOk');
// 	else if (MsgType === 'note')
// 		$status.addClass('gmMapEditPopupStatusNote');
// 	else if (MsgType === 'warning')
// 		$status.addClass('gmMapEditPopupStatusWarning');
// 	else if (MsgType === 'error')
// 		$status.addClass('gmMapEditPopupStatusError');
// }