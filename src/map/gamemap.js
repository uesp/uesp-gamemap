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
import World from "./world.js";
import MapState from "./mapstate.js";
import Location from "./location.js";
import Point from "./point.js";

/*================================================
					Locals
================================================*/

let self; // Local "this" instance of Gamemap
let map; // Leaflet map instance
let tileLayer; // Current tile layer
let gridLayer;
let RC; // RasterCoords instance, for converting leaflet latlngs to XY pixel coords and back

/*================================================
				  Constructor
================================================*/
export default class Gamemap {
	/**
	 * Interactive map viewer class.
	 * @param {String} mapRoot - The root gamemap element in which the map is displayed
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

			// set the default map info
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

		// fix background colour transition delay
		self.mapRoot.style.transition = "background-color ease 100ms";

		// create inital mapState object
		let mapState = new MapState();

		// check if URL has data params
		if (this.hasURLParams()) mapState = this.getMapStateFromURL();

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
		return this.mapState;
	}

	/** Override mapState to provided map state (use to load from URL or from saved state).
	 * @param {Object} mapState - Object that controls the state and view of the map.
	 * @param {Boolean} onlyUpdateTiles - Flag to only update map tiles. Default: false (replaces everything).
	 */
	async setMapState(mapState, onlyUpdateTiles) {

		print("Setting map state!");
		print(mapState);
		onlyUpdateTiles = onlyUpdateTiles ?? false;

		// remove previous tiles
		if (tileLayer != null) {
			tileLayer.remove();
			if (!onlyUpdateTiles) this.clearLocations();
		}

		// if we have centreon in the url, wait until we get centreon data
		if (getURLParams().has("centeron")) {
			print("pending centeron")
			try {
				let location = await this.getLocation(getURLParams().get("centeron"), (getURLParams().has("world") ? this.getWorld(getURLParams().get("world")) : null));
				mapState.world = this.getWorldFromID(location.worldID);
				mapState.zoom = mapState.world.maxZoomLevel;
				mapState.pendingJump = location;
				mapState.coords = location.getCentre();
				mapState.legacy = null;
			} catch (error){
				mapState.pendingJump = null;
				print(error);
			}
		}

		// update world
		mapState.world = (mapState.world) ? mapState.world : this.getWorldByID(MAPCONFIG.defaultWorldID);
		this.currentWorldID = mapState.world.id;

		// calculate raster coords
		RC = new RasterCoords(map, mapState.world.getWorldDimensions());

		// set map view
		map.setMaxBounds(null);
		if (mapState.legacy) {
			mapState.zoom = mapState.zoom - mapState.world.zoomOffset;
			if (MAPCONFIG.coordType == COORD_TYPES.PSEUDO_NORMALISED) {

				// get normalised value of x and y in range
				let x = (mapState.coords.x - mapState.world.minX) / mapState.world.maxRangeX;
				let y = Math.abs((mapState.coords.y - mapState.world.maxY) / mapState.world.maxRangeY); // flip y around

				// transform coords to better fit power of two numbers of tiles
				x = (x * nextPowerOfTwo(mapState.world.dbNumTilesX) / mapState.world.dbNumTilesX).toFixed(3);
				y = (y * nextPowerOfTwo(mapState.world.dbNumTilesY) / mapState.world.dbNumTilesY).toFixed(3);

				mapState.coords = new Point(x, y, MAPCONFIG.coordType);
			}
			mapState.legacy = false; // conversion completed
		}
		mapState.coords = (mapState.coords) ? mapState.coords : this.toCoords(RC.getMaxBounds().getCenter());
		mapState.zoom = (mapState.zoom) ? mapState.zoom : map.getBoundsZoom(RC.getMaxBounds());

		if (!mapState.coords || !mapState.zoom) {
			map.fitBounds(RC.getMaxBounds(), {animate: false});
		} else {
			map.setView(this.toLatLngs(mapState.coords), mapState.zoom, {animate: false});
		}
		map.setMaxBounds(RC.getMaxBounds(130));

		// if received a world edit pending jump, begin editing
		if (mapState.pendingJump instanceof World && mapState.pendingJump.editing) {
			this.edit(mapState.pendingJump);
			mapState.pendingJump = null;
		}

		// update map state
		this.updateMapState(mapState);

		// set up map tiles
		let tileOptions = {
			noWrap: true,
			bounds: RC.getMaxBounds(),
			errorTileUrl: IMAGES_DIR + "outofrange.png",
			minZoom: mapState.world.minZoomLevel,
			maxZoom: mapState.world.maxZoomLevel,
			edgeBufferTiles: 2,
		}
		tileLayer = (isFirefox()) ? L.tileLayer(this.getMapTileImageURL(mapState.world, mapState.layerIndex), tileOptions) : tileLayer = L.tileLayer.canvas(this.getMapTileImageURL(mapState.world, mapState.layerIndex), tileOptions);
		tileLayer.addTo(map);

		// set background colour
		if (mapState.world.layers[mapState.layerIndex].bg_color) { this.mapRoot.style.backgroundColor = mapState.world.layers[mapState.layerIndex].bg_color; }

		if (!onlyUpdateTiles) {
			// get/set locations
			if (mapState.world.locations == null) {
				// get locations for this map
				this.getLocations(mapState.world.id);
			} else {
				//draw locations from cache
				this.drawLocations(mapState.world.locations);
			}
		}

		//set grid if available
		this.toggleGrid(mapState?.gridData);
	}

	/** Gets map state object from URL params (XY coords, world etc).
	 * @returns {Object} mapState - Object that controls the state and view of the map.
	 */
	getMapStateFromURL() {

		// initialise mapstate
		let mapState = new MapState();
		mapState.legacy = getURLParams().has("legacy");

		if (getURLParams().has("world")) {
			mapState.world = this.getWorld(getURLParams().get("world"));
		} else {
			mapState.world = this.getWorldFromID(this.mapConfig.defaultWorldID);
		}

		if (getURLParams().has("zoom")) {
			mapState.zoom = Number(getURLParams().get("zoom"));
		} else {
			mapState.zoom = this.mapConfig.defaultZoomLevel;
		}

		if (getURLParams().has("x") && getURLParams().has("y") || getURLParams().has("locx") && getURLParams().has("locy")) {
			let x = Number(getURLParams().get("x") ?? getURLParams().get("locx"));
			let y = Number(getURLParams().get("y") ?? getURLParams().get("locy"));
			mapState.coords = new Point(x, y, MAPCONFIG.coordType);
		}

		if (getURLParams().has("grid")) {
			mapState.gridData = JSON.parse(decodeURIComponent(getURLParams().get("grid")));
		} else {
			mapState.gridData = null;
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
		let x = Number(this.toCoords(map.getCenter()).x, MAPCONFIG.coordType).toFixed(3);
		let y = Number(this.toCoords(map.getCenter()).y, MAPCONFIG.coordType).toFixed(3);
		mapState.coords = (MAPCONFIG.coordType == COORD_TYPES.NORMALISED || MAPCONFIG.coordType == COORD_TYPES.PSEUDO_NORMALISED) ? [x, y] : [Math.floor(x), Math.floor(y)];
		mapState.zoom = parseFloat(map.getZoom().toFixed(3));
		mapState.world = this.getWorldFromID(this.currentWorldID);
		this.mapState = mapState;

		// update url
		let mapLink;
		if (!location.href.includes("localhost")) { // use server schema if hosted
			mapLink = (window.location.href.includes("/"+MAPCONFIG.database+"/")) ? "?" : (MAPCONFIG.database+"/?");
		} else {
			mapLink = "?";
		}

		// world related
		if (this.hasMultipleWorlds()){
			mapLink += `world=${mapState.world.name}&`;
		}
		if (mapState.world.hasMultipleLayers()) {
			mapLink += `layer=${mapState.world.layers[mapState.layerIndex]?.name}&`;
		}
		mapLink += `x=${mapState.coords[0]}`;
		mapLink += `&y=${mapState.coords[1]}`;
		mapLink += `&zoom=${mapState.zoom}`;
		if (mapState?.gridData) {
			mapLink += `&grid=${encodeURIComponent(JSON.stringify(mapState.gridData))}`;
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

			if (this.mapWorlds.size == 0) {
				getJSON(GAME_DATA_SCRIPT + queryify(queryParams)).then(data => {
					let worlds = data.worlds;

					// parse worlds
					worlds.forEach(world => {
						if (world.id > mapConfig.minWorldID && world.id < mapConfig.maxWorldID && world.name) {
							self.mapWorlds.set(world.id, new World(world));
						}
					});

					// initialise map
					print(`Loaded ${worlds.length} worlds!`);
					print(worlds);
					self.initialiseMap(mapConfig);
				}).catch((error) => {throw new Error(`Could not retrieve world data: ${error}`)});
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
		return this.getWorldFromID(this.currentWorldID) ?? this.getMapState()?.world ?? getWorldFromID(this.mapConfig.defaultWorldID);
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
	getWorldByID(worldID) { return this.getWorldFromID(worldID) }
	getWorldFromID(worldID) {
		return this.mapWorlds.get(Number(worldID));
	}

	/** Get internal world name from a given worldID
	 * @param {Object} world - An object that represents the current map world.
	 * @returns {String} worldName - The internal name of the world.
	 */
	getWorldNameByID(worldID) { return this.getWorldFromID(worldID) }
	getWorldNameFromID(worldID) {
		return this.getWorldFromID(worldID)?.name;
	}

	/** Get world display name from a given worldID
	 * @param {Int} worldID - A world ID.
	 * @returns {String} displayName - The user facing display name of the world.
	 */
	getWorldDisplayNameByID(worldID) { return this.getWorldDisplayNameFromID(worldID) }
	getWorldDisplayNameFromID(worldID) {
		return this.getWorldFromID(worldID)?.displayName;
	}

	/** Get world object from internal world name
	 * @param {String} worldName - An internal worldName as a string.
	 * @returns {Object} world - A world object.
	 */
	getWorldByName(worldName) { return this.getWorldFromName(worldName) }
	getWorldFromName(worldName){
		return [...this.mapWorlds.values()].find(prop => prop.name == worldName);
	}

	/** Get world object from user facing display name
	 * @param {String} worldDisplayName - A world's display name.
	 * @returns {Object} world - A world object.
	 */
	getWorldByDisplayName(worldDisplayName) { return this.getWorldFromDisplayName(worldDisplayName) }
	getWorldFromDisplayName(worldDisplayName){
		return [...this.mapWorlds.values()].find(prop => prop.displayName == worldDisplayName);
	}

	/** Simple function that returns whether the current gamemap has multiple worlds.
	 * @returns {Boolean} - A boolean whether or not the current gamemap contains multiple worlds.
	 */
	hasMultipleWorlds() { return this.mapWorlds.size > 1 }

	// update world
	updateWorld(world) {
		// update world data
		this.getWorlds().set(world?.id, world);
		this.setMapState(this.getMapState(), true);
	}

	// delete world
	deleteWorld(world) {
		// delete selected world from cache
		this.getWorlds()?.delete(world.id);
		this.goto(world.parentID ?? MAPCONFIG.defaultWorldID);
		getWorldLists(); // update world lists
	}

	/*================================================
						Navigation
	================================================*/

	/** Convenience method to quickly "goto" a location, world, or certain coordinates.
	 * @param {Object} place - Either a world, a location, or ID of one of those two.
	 */
	goto(place) {
		// figure out what data we're being passed

		if (place == null) { return }

		let isNumerical = !isNaN(place);

		this.mapCallbacks?.setLoading(true);
		place = (place) ? (isString(place)) ? parseInt(place) : place : this.getCurrentWorldID();
		let isWorld = place instanceof World || place.numTilesX;
		let isID = !isNaN(place);
		let isLocation = place instanceof Location || place.coords;

		if (isWorld) {
			this.gotoWorld(place.id, coords);
		} else if (isLocation) {
			this.gotoLocation(place);
		} else if (isID) {
			if (place >= 0) { // is destination a worldID?
				this.gotoWorld(place);
			} else { // it is a locationID
				this.gotoLocation(place);
			}
		}

	}

	getWorld(identifier) {
		if (identifier == null) {
			return this.getCurrentWorld();
		} else {
			return isNaN(parseInt(identifier)) ? (identifier != "undefined" ? this.getWorldFromName(identifier) : this.getWorldFromID(this.mapConfig.defaultWorldID)) : this.getWorldFromID(identifier);
		}
	}

	gotoLocation(id) {
		print(`going to location: ${id}`);

		this.mapCallbacks?.setLoading(true);
		this.mapState.pendingJump = null;

		this.getLocation(id).then((location) => {
			if (location.worldID == self.getCurrentWorldID()) {
				map.setZoom(self.getCurrentZoom() - 0.0001, {animate: false}) // fix pan animation bug
				map.setView(self.toLatLngs(location.getCentre()), self.getCurrentWorld().maxZoomLevel, {animate: true});
				setTimeout(() => {
					if (id?.editing) {
						this.edit(location);
					} else {
						location.openPopup();
					}
				}, 1);
				this.mapCallbacks?.setLoading(false);
			} else {
				self.mapState.pendingJump = location;
				self.setMapState(new MapState({pendingJump: location}));
			}
		}).catch((error) => {
			print(error);
			self.mapCallbacks?.setLoading(false);
		});
	}

	gotoWorld(worldID, coords) {
		print(worldID);
		if (self.isWorldValid(worldID)) {
			// if we are in the same world, just pan to the provided location (or just reset map)
			if (worldID == self.getCurrentWorldID()) {
				if (coords) {
					map.setView(self.toLatLngs(coords), self.getCurrentWorld().maxZoomLevel);
				} else {
					self.reset(true);
				}
				self.mapCallbacks?.setLoading(false);
			} else { // else load up the new world
				self.clearLocations();
				let world = self.getWorldFromID(worldID);
				print(`Going to world... ${world.displayName} (${world.id});`);
				self.setMapState(new MapState({coords: coords, world: world, pendingJump: world?.editing ? world : null, layerIndex: 0}));
			}

		} else {
			this.mapCallbacks?.setLoading(false);
			throw new Error('Gamemap attempted to navigate to invalid world ID: ' + worldID);
		}
	}

	/**
	 * Convert leaflet LatLngs to human readable map coordinates coordinates.
	 * @param {Object} latLngs - the leaflet latLng coordinate object
	 * @param {Object} coordType - the coordinate system type to convert to
	 */
	getCoords(...args) { return this.toCoords(...args) }
	toCoords(latLngs, coordType) {

		latLngs = structuredClone(latLngs);
		coordType = (coordType != null) ? coordType : (latLngs instanceof Point) ? latLngs.coordType : this.mapConfig.coordType;

		if (latLngs.lat != null) {

			// project latlng to XY coords;
			let coords = RC.project(latLngs);

			if (coordType != COORD_TYPES.XY) {
				let worldDimensions = this.getCurrentWorld().getWorldDimensions();
				if (coordType == COORD_TYPES.NORMALISED || coordType == COORD_TYPES.PSEUDO_NORMALISED) {
					// divide xy coords by height to get normalised coords (0.xxx , 0.yyy)
					let x = (coords.x / worldDimensions.width).toFixed(3);
					let y = (coords.y / worldDimensions.height).toFixed(3);
					return new Point(x, y, COORD_TYPES.NORMALISED);

				} else if (coordType == COORD_TYPES.WORLDSPACE) {
					// get current map world pixel position values
					let nX = coords.x / worldDimensions.width;
					let nY = 1 - (coords.y / worldDimensions.height);

					// reproject pixel values to worldspace
					let x = Math.trunc(worldDimensions.minX + (worldDimensions.maxX - worldDimensions.minX) * nX);
					let y = Math.trunc(worldDimensions.minY + (worldDimensions.maxY - worldDimensions.minY) * nY);
					return new Point(x, y, COORD_TYPES.WORLDSPACE);
				}
			} else {
				return coords;
			}

		} else if (Array.isArray(latLngs)) {
			let coords = [];
			latLngs.forEach((latLng) => {coords.push(this.toCoords(latLng, this.mapConfig.coordType))});
			return coords;
		}
	}

	/**
	 * Convert XY/Normalised/Worldspace coordinates to leaflet's LatLongs.
	 * @param {Object} coords - the coordinate/point object
	 */
	getLatLngs(...args) { return this.toLatLngs(...args) }
	toLatLngs(coords) {

		coords = structuredClone(coords) // make distinct

		if ((coords instanceof Point || coords?.x) && !Array.isArray(coords)) {

			switch (coords.coordType) {
				default:
				case COORD_TYPES.XY:
					return RC.unproject([coords.x , coords.y]);
				case COORD_TYPES.NORMALISED:
					let x = (Number(coords.x) * this.getCurrentWorld().width);
					let y = (Number(coords.y) * this.getCurrentWorld().height);

					return RC.unproject([x , y]);
				case COORD_TYPES.PSEUDO_NORMALISED:
					coords.coordType = COORD_TYPES.NORMALISED;
					return this.toLatLngs(coords);
				case COORD_TYPES.WORLDSPACE:

					let xN = coords.x;
					let yN = coords.y;

					// get normalised value of x and y in range
					xN = (xN - this.getCurrentWorld().minX) / this.getCurrentWorld().maxRangeX;
					yN = Math.abs((yN - this.getCurrentWorld().maxY) / this.getCurrentWorld().maxRangeY); // flip y around

					return this.toLatLngs(new Point(xN, yN, COORD_TYPES.NORMALISED));
			}

		} else if (Array.isArray(coords)) {
			if (coords[0]?.x) { // are we given an array of coord objects?
				if (coords.length == 1) { // are we given a single coord object? (marker, point)
					return this.toLatLngs(coords[0]);
				}

			} else if (coords.length > 1) { // else we are just given a coord array [x, y]
				return this.toLatLngs(new Point(coords[0] == 0 ? 0.001 : coords[0], coords[1] == 0 ? 0.001 : coords[1], this.mapConfig.coordType));
			}
		}
	}

	/*================================================
						   Layers
	================================================*/

	toggleGrid(gridData) {

		// set grid info
		let cellResourceData = gridData?.cellResourceData ?? this.getMapState()?.cellResourceData;
		gridData = (gridData == null || Object.keys(gridData).length === 0) ? null : {
			gridShown: gridData.gridShown ?? gridData.gridshown,
			cellResource: gridData.cellResource ?? gridData.cellresource,
			cellResourceData: gridData.cellResourceData,
		}
		let cellResource = gridData?.cellResource && gridData?.cellResource != "none" ? gridData.cellResource : null;
		let gridShown = gridData?.gridShown;

		// update map state
		let mapState = this.getMapState();
		if (gridData) {
			let {cellResourceData: _, ...nGridData} = gridData; // remove cellResourceData from gridData to avoid big array in URL
			mapState.gridData = nGridData;
		} else {
			mapState.gridData = null;
		}
		mapState.cellResourceData = gridData ? cellResourceData : null;
		this.updateMapState(mapState);

		// download cell resource data if required
		if (cellResource && (!cellResourceData || cellResource != cellResourceData?.resource)) {
			this.mapCallbacks?.setLoading(true);
			this.getCellResourceData(cellResource).then(array => {
				this.mapCallbacks?.setLoading(false);
				if (mapState.isGridEnabled()) {
					gridData.cellResourceData = {resource: cellResource, data: array};
					self.toggleGrid(gridData);
				}
			}).catch(() => this.mapCallbacks?.setLoading(false));
		}

		// set up grid layer
		if (gridData) {
			gridLayer?.remove();
			gridLayer = L.canvasOverlay().params({bounds: RC.getMaxBounds(), className : "cellGrid", zoomAnimation: true}).drawing(drawGrid);
			gridLayer.addTo(map);
		} else if (!gridData && gridLayer) {
			gridLayer.remove();
			gridLayer = null;
		}

		// draw grid
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
					if (gridShown && i == j) {
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
						let cellResources = cellResourceData?.data;
						if (cellResources) {
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

						if (gridShown && currentZoom > self.mapConfig.gridShowLabelZoom) {

							let gridStartX = world.gridStart[0];
							let gridStartY = world.gridStart[1];
							let colNum = i + gridStartX;
							let rowNum = (-j) + gridStartY;

							if ( (rowNum % 5 == 0 || colNum % 5 == 0) && i != nRows && j != nCols) {

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

	}

	// async function to get cell resource data
	async getCellResourceData(resourceID) {
		if (resourceID != null || resourceID != "") {

			var queryParams = {};
			queryParams.action = "get_cellresource";
			queryParams.db = MAPCONFIG.database;
			queryParams.worldid = this.getCurrentWorldID();
			queryParams.editorid = resourceID;

			// get result and flip it
			let result = await getJSON(GAME_DATA_SCRIPT + queryify(queryParams));
			let array = result.resources[0].data;
			for (let i in array) {
				array[i] = array[i].reverse();
			}
			return array;
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
				print(mapState);
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
			map.smoothWheelZoom.disable();
			map.keyboard.disable();
			this.mapRoot.classList.add("locked"); // add locked css
		} else {
			map.dragging.enable();
			map.smoothWheelZoom.enable();
			map.keyboard.enable();
			this.mapRoot.classList.remove("locked"); // remove locked css
		}

		// callback back to UI
		this.mapLock = mapLock;
		this.mapCallbacks?.onMapLockChanged(this.mapLock);
	}

	getMapLock() {
		return this.mapLock;
	}

	getCurrentTileLayerIndex() {
		return parseInt(this.getMapState().layerIndex);
	}

	getNextTileLayerIndex() {
		return (this.getCurrentTileLayerIndex() +1 == this.getMapState().world?.layers?.length) ? 0 : this.getCurrentTileLayerIndex() + 1;
	}

	getNextTileLayerName() {
		return this.getMapState().world?.layers[this.getNextTileLayerIndex()]?.name;
	}

	getCurrentTileLayerName() {
		return this.getMapState().world?.layers[this.getCurrentTileLayerIndex()]?.name;
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

	addLocation(locType) {

		print("adding location..");

		let isMarker = locType == LOCTYPES.MARKER;
		let showTooltip = isMarker;
		this.setMapLock(isMarker ? MAPLOCK.PARTIAL_NEW_MARKER : locType == LOCTYPES.AREA ? MAPLOCK.PARTIAL_NEW_POLYGON : MAPLOCK.PARTIAL_NEW_LINE );
		let shape = (isMarker ? "Marker" : locType == LOCTYPES.AREA ? "Polygon" : "Line");
		let altText = isMarker ? "new_marker" : "";

		map.pm.enableDraw(shape, {
            markerStyle: {
				icon: this.getIcon(Math.min(...Array.from(MAPCONFIG.icons.keys()))),
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

		map.on("pm:create", ({ shape, layer }) => {
			print(shape);
			print(layer);
			let isMarker = shape == "Marker";
			layer.remove();
			print(isMarker);
			let location = new Location({
				locType:  (isMarker) ? LOCTYPES.MARKER : (shape == "Polygon") ? LOCTYPES.AREA : LOCTYPES.PATH,
				coords: self.toCoords(layer.getCoordinates()),
			}, this.getCurrentWorld());
			this.getCurrentWorld()?.locations?.set(location.id, location);
			this.edit(location);
		});

	}

	getLocations(world) {

		self.clearLocations();
		print("Getting locations...");

		// check if we've been sent a world ID
		if (world != null && !isNaN(world)){
			if (this.isWorldValid(world)) {
				world = this.getWorldFromID(world);
			}
		}

		// make sure we're being given a valid world state
		if (world == null || world.id == null || world.id < 0 ) { return }

		// generate api query
		var queryParams = {};
		queryParams.action = "get_locs";
		queryParams.world  = world.id;
		queryParams.db = MAPCONFIG.database;

		// make api query
		getJSON(GAME_DATA_SCRIPT + queryify(queryParams)).then(data => {
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
				self.drawLocations(locationMap);
			}

		}).catch(error => {throw new Error(`There was an error getting locations: ${error}`)});
	}

	// async function to get location from cache or from server
	async getLocation(identifier, world) {

		// reject if null
		if (identifier == null) { return Promise.reject("Location identifier was null") }
		this.mapCallbacks?.setLoading(true);

		// get location ID from identifier
		let isNumerical = !isNaN(identifier) || identifier instanceof Location;
		let isString = identifier instanceof String || typeof identifier === "string";
		let locationID = Math.abs(identifier?.id ?? identifier);
		let locationName = isString ? identifier?.toLowerCase() : null;
		let localLocation;

		print(`Getting info for location: ${identifier}`);

		// search cache for location first
		if (world) { // if world is specified, search that one
			localLocation = world.getLocation(identifier);
		} else { // otherwise search all worlds
			this.mapWorlds?.forEach(world => {
				localLocation = (world.hasLocation(identifier)) ? world.getLocation(identifier) : localLocation;
			});
		}

		if (localLocation) { // return local location if we found any
			print("found cached location");
			this.mapCallbacks?.setLoading(false);
			return Promise.resolve(localLocation);
		}

		if (localLocation == null) { // otherwise if no cached copies were found, search the db

			let query = {
				action: "get_centeron",
				db: MAPCONFIG.database,
				centeron: isNumerical ? locationID : locationName,
				world:  world?.id ?? null,
			}

			let response = await getJSON(GAME_DATA_SCRIPT + queryify(query));
			if (response && response.locations.length > 0) {
				print("Got location info!");
				let world = self.getWorldFromID(response?.locations[0]?.worldId);
				let location = new Location(response.locations[0], world);
				this.mapCallbacks?.setLoading(false);
				return Promise.resolve(location);
			} else {
				M.toast({html: "That location doesn't exist!"});
				this.mapCallbacks?.setLoading(false);
				return Promise.reject(`Location ${identifier} was invalid.`);
			}
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

		locTypeName = locTypeName?.trim()?.toLowerCase();

		if (MAPCONFIG.icons && locTypeName != "") {
			print(locTypeName);

			for (const [key, value] of MAPCONFIG.icons) {
				print(key, value);
				if (locTypeName == value?.toLowerCase()) {
					print("found it");
					return key;
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
		locations?.delete(location.id);
	}

	// update location on the map
	updateLocation(location) {

		// remove existing marker(s)
		let markers = this.getMarkersFromLocation(location);
		markers.forEach(function(marker) { marker.remove() });
		map.closePopup();

		// update location data
		this.getCurrentWorld().locations?.set(location?.id, location);

		// create new markers
		markers = this.getMarkers(location);
		markers.forEach(function(marker) { marker.addTo(map) });

		// enable edit mode on marker if needed
		if (location?.editing) {
			if (!location.revertID) {
				if (location.locType == LOCTYPES.MARKER) { // race condition if marker isnt actually added yet
					setTimeout(() => { markers[0].edit() }, 0);
				} else {
					markers[0].edit();
				}
			}
			markers.forEach(function(marker) { marker.setEditingEffect(true) });
		}

	}

	drawLocations(locations) {

		// delete any existing location layers
		this.clearLocations();

		// set up location layer for each zoom level
		print("Loading initial locations...");

		// check if current map has any locations
		if (locations.size > 0) {

			// iterate through each location in the list
			print("Adding location markers to map...")
			locations.forEach(location => {

				if (location?.isVisible()) {
					// add markers to the map
					this.getMarkers(location).forEach(marker => { marker.addTo(map) });
					location.setWasVisible(true);

					// centre to location if we have a pendingjump for it
					let jump = this.mapState?.pendingJump;
					if (jump instanceof Location && jump.id == location.id) {
						this.mapState.pendingJump = null;
						this.gotoLocation(jump);
					}
				}
			});
		}

		// callback to show map fully loaded
		this.mapCallbacks?.onMapLoaded(true);
		this.mapRoot.style.animation = "none";

	}

	// create marker(s) for location
	getMarkers(location) {

		// return early if missing required attributes
		if (location == null || location.coords == null) { return [] }

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
					polygonIcon = this.makeMarker(location, self.toLatLngs(location.getCentre()));
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

					let isPolygon = location.isPolygon() && marker._path;

					L.tooltip(self.toLatLngs(location.getCentre()), {content: location.getTooltipContent(), sticky: true, className : "location-tooltip",}).addTo(map);

					if (isPolygon){
						this.setStyle({
							fillColor: location.fillColourHover,
							color: location.strokeColourHover,
							weight: location.strokeWidthHover,
						});
					}
				});

				// on marker clicked
				marker.on('click', event => {
					let shift = event.originalEvent.shiftKey; // edit
					let ctrl = event.originalEvent.ctrlKey; // popup
					if (!self.mapLock || MAPLOCK.isPartialNoNew(self.mapLock)) {
						self.onMarkerClicked(this, shift, ctrl);
					}
				});

				marker.on('dblclick', () => {
					if ((!self.mapLock || MAPLOCK.isPartialNoNew(self.mapLock)) && !this.getLocation().isClickable()) {
						self.onMarkerClicked(this, true, false);
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



		map.on('resize moveend zoomend', function() {

			self.getCurrentWorld()?.locations?.forEach(location => {

				let isVisible = location?.isVisible() ?? false;
				let wasVisible = location?.getWasVisible() ?? false;

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

			self.clearTooltips();
			if (self.getMapState()) {
				if (self.getMapState().isGridEnabled()) self.toggleGrid(self.getMapState()?.gridData);
				self.updateMapState();
			}
		});

		map.on("contextmenu", function(event){
			if (self.getMapState().world.parentID != null && self.getMapState().world.parentID != -1 ) {
				if (!self.mapLock) {
					let parentID = self.getMapState().world.parentID;
					self.goto(parentID);
				}
			}
		})

		map.on("zoom", function() {
			if (!self.mapLock && self.mapLock != "full") {
				map.dragging.enable();
			}
		})

		map.on("mousemove mousedown", function(event) {
			let target = event.originalEvent?.target ?? event?.originalEvent?.explicitOriginalTarget ?? event?.sourceTarget?._container;
			if (self.mapLock == MAPLOCK.FULL || target != self.mapRoot && !target?.classList?.contains("leaflet-interactive")) {
				event?.originalEvent?.preventDefault();
				map.dragging.disable();
			} else {
				map.dragging.enable();
			}
		})

		map.on("dblclick", function(event) {
			let target = event.originalEvent?.target ?? event?.originalEvent?.explicitOriginalTarget;
			if (target?.className?.includes && target?.className?.includes("leaflet") && !self.mapLock) {
				map.panTo(event.latlng, {animate: true});
			}
		})
	}

	onMarkerClicked(marker, shift, ctrl) {

		print(marker.location);
		let canJumpTo = marker.getLocation()?.isClickable() && !this.mapLock;

		if (canJumpTo && !shift && !ctrl) { // is location a link to a worldspace/location
			let location = marker.getLocation();
			if (location != null) {
				this.mapCallbacks?.setLoading(true);
				if (location.destinationID > 0) { // is destinationID a worldID
					this.goto(location.destinationID);
				} else { // it is a location ID
					this.getLocation(location.destinationID).then(location => self.goto(location));
				}
			}
		} else if (shift && this.canEdit()) { // if shift pressed, and can edit, show edit menu
			this.edit(marker.location);
		} else if ((!shift || ctrl || !canJumpTo) && !marker.getLocation()?.editing) { // if normally clicked or pressing ctrl, show popup
			marker.openPopup();
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

	getZoomFromBounds(bounds) {
		return map.getBoundsZoom(bounds, false);
	}

	/*================================================
						  General
	================================================*/

	// reset map
	reset(currentWorldOnly, customPadding) {
		if (!this.hasMultipleWorlds() || currentWorldOnly) {
			if (customPadding) {
				map.fitBounds(RC.getMaxBounds(customPadding), {animate: true});
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
		return map.getBounds();
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
			if (layer?.location && layer.location?.id == location?.id) {
				markers.push(layer);
			}
		});
		return markers;
	}

	async edit(object) {

		if (!isNaN(object)) {
			object = (object > 0) ? this.getWorldByID(object) : await this.getLocation(object);
		}

		let isWorld = object instanceof World;
		let isLocation = object instanceof Location;

		if (isWorld && object.id != this.getCurrentWorldID() || isLocation && object.worldID != this.getCurrentWorldID()) {
			object.editing = true;
			self.mapState.pendingJump = object;
			self.setMapState(new MapState({pendingJump: object}));
		} else {
			this.mapCallbacks?.edit(object);
			map.closePopup();
		}
	}

	// get if editing is enabled on this map
	canEdit() {
		return MAPCONFIG.editingEnabled;
	}

	checkEditingPermissions() {

		let queryParams = {};
		let self = this;
		queryParams.action = "get_perm";
		queryParams.db = MAPCONFIG.database;
		this.mapCallbacks?.setLoading("Getting permissions");

		getJSON(GAME_DATA_SCRIPT + queryify(queryParams)).then(data => {
			let canEdit = data?.canEdit;
			MAPCONFIG.editingEnabled = ((canEdit || isDebug) && (!self.isEmbedded() && !isMobile()));
			MAPCONFIG.isAdmin = data.isAdmin;
			self.mapCallbacks?.onPermissionsLoaded(MAPCONFIG.editingEnabled);
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

	getZoom() { return this.getCurrentZoom() }
	getCurrentZoom() {
		return (map != null) ? map.getZoom() : 0;
	}

	getMaxZoom() {
		return (this.getCurrentWorld() != null) ? this.getCurrentWorld().maxZoomLevel : 5;
	}

	getMinZoom() {
		return (this.getCurrentWorld() != null) ? this.getCurrentWorld().minZoomLevel : 0;
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

	getMap() { return map }
	getMapObject() { return map }
	getElement() { return this.mapRoot }

	hasURLParams() {
		return (Array.from(getURLParams().values())).length >= 1;
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
	getCentre: function() { return gamemap.toLatLngs(this.getLocation().getCentre()) },
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
		this.pm.enable({ allowEditing: true, snapDistance: self.mapConfig.markerSnapDistance, draggable: true, preventMarkerRemoval: this.getCoordinates().length == 1});
		this.on("pm:drag", () => gamemap.clearTooltips());
		this.on('pm:markerdragend pm:vertexremoved pm:edit', (e) => {
			if ((e.shape == "Marker") || ((e.shape == "Polygon" || e.shape == "Line") && (e.type == "pm:markerdragend" || e.type == "pm:vertexremoved"))) {
				updateMarkerCoords(self.toCoords(e.layer.getCoordinates()));
			}
		});
	},

	// open marker popup
	openPopup() {
		print("making popup");
		print(this);
		L.popup(this.getCentre(), {content: this.getLocation().getPopupContent()}).openOn(map);
	},
});