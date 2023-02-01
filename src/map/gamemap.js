/**
 * @name gamemap.js
 * @author Dave Humphrey <dave@uesp.net> (21st Jan 2014)
 * @summary The main source code for the interactive gamemap.
 */

// import commons
import * as Utils from "../common/utils.js";
import * as Constants from "../common/constants.js";

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
		if (mapRoot != null && mapConfig != null && mapCallbacks != null) {

			// load in map config
			this.mapConfig = mapConfig;

			// set up map callbacks
			this.mapCallbacks = mapCallbacks;

			// set up the root map element
			this.mapRoot = mapRoot;
			self = this;

			// set up css
			if (this.mapConfig.hasCustomFavIcon) { Utils.changeFavIcon(mapConfig.imagesPath + "favicon.ico"); }
			if (this.mapConfig.bgColour) { mapRoot.style.backgroundColor = mapConfig.bgColour; }
			if (this.mapConfig.hasCustomCSS) { let cssPath = mapConfig.assetsPath + "css/" + mapConfig.database + "-styles.css"; print("Loading custom map css: " + cssPath); Utils.injectCSS(cssPath);}

			// set the default map world info
			this.mapWorlds = {};
			this.gridEnabled = false;

			// check user editing permission
			this.checkPermissions();

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
	 * @param {Object} mapConfig - Object that controls the default/imported settings of the map.
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

		map = L.map(this.mapRoot.id, mapOptions);

		let mapState = new MapState();
		mapState.zoomLevel = mapConfig.defaultZoomLevel;
		mapState.world = this.getWorldFromID(mapConfig.defaultWorldID || 0);
		mapState.coords = [mapConfig.defaultXPos, mapConfig.defaultYPos];

		if (this.hasCenterOnURLParam()) { // check if URL has "centeron" param
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

	/** Set map to saved map state (use to load from URL or from saved state).
	 * @param {Object} mapState - Object that controls the state and view of the map.
	 * @param {Boolean} onlyTiles - Flag to only update map tiles. Default: false (overwrites everything).
	 */
	setMapState(mapState, onlyTiles) {

		print("Setting map state!");
		onlyTiles = (onlyTiles != null) ? onlyTiles : false;

		// remove previous tiles
		if (tileLayer != null) {
			tileLayer.remove();
			if (!onlyTiles) {
				this.clearLocations();
			}
		}

		if (mapState.world == null) {
			throw new Error("Map was provided an invalid/null world!");
		}

		// set full image width & height
		let mapImageDimens = this.getMapImageDimensions(mapState.world);
		this.mapImage = {
			width : mapImageDimens.width,  // original width of image
			height: mapImageDimens.height, // original height of image
		}

		mapState.world.totalWidth = this.mapImage.width;
		mapState.world.totalHeight = this.mapImage.height;

		// calculate raster coords
		RC = new RasterCoords(map, this.mapImage);

		// default tilelayer options
		let tileOptions = {
			noWrap: true,
			bounds: RC.getMaxBounds(),
			errorTileUrl: mapState.world.missingMapTilePath,
			minZoom: mapState.world.minZoomLevel,
			maxZoom: mapState.world.maxZoomLevel,
			edgeBufferTiles: 2,
		}

		// set map tile layer
		if (Utils.isFirefox()){ // use HTML-based rendering on firefox
			tileLayer = L.tileLayer(this.getMapTileImageURL(mapState.world, this.mapConfig.tileLayers[mapState.tileLayer]), tileOptions);
		} else { // use canvas based tile rendering on everything else
			tileLayer = L.tileLayer.canvas(this.getMapTileImageURL(mapState.world, this.mapConfig.tileLayers[mapState.tileLayer]), tileOptions);
		}
		tileLayer.addTo(map);

		// set map view
		map.setView(this.toLatLng(mapState.coords), mapState.zoomLevel, {animate: true});

		// update world
		this.currentWorldID = mapState.world.id;
		if (this.mapCallbacks != null) {
			this.mapCallbacks.onWorldChanged(this.mapWorlds[this.currentWorldID])
		}

		if (!onlyTiles) {
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
		this.toggleCellGrid(mapState.showGrid);
	}

	/** Get current map state object.
	 * @returns {Object} mapState - Object that controls the state and view of the map.
	 */
	getMapState() {
		return this.currentMapState;
	}

	/** Get current map config object.
	 * @returns {Object} mapConfig - Object that controls the configuration of the map.
	 */
	getMapConfig() {
		return this.mapConfig;
	}

	/** Gets map state object from URL params (XY coords, world etc).
	 * @returns {Object} mapState - Object that controls the state and view of the map.
	 */
	getMapStateFromURL() {

		// initialise mapstate
		let mapState = new MapState();

		if (Utils.getURLParams().has("zoom")){
			mapState.zoomLevel = Utils.getURLParams().get("zoom");
		} else {
			mapState.zoomLevel = this.mapConfig.defaultZoomLevel;
		}

		if (Utils.getURLParams().has("world")){
			mapState.world = this.getWorldFromID(Utils.getURLParams().get("world"));
			if (mapState.world == "undefined") {
				mapState.world = this.getWorldFromID(this.mapConfig.defaultWorldID);
			}
		} else {
			mapState.world = this.getWorldFromID(this.mapConfig.defaultWorldID);
		}

		if (Utils.getURLParams().has("x") && Utils.getURLParams().has("y")) {
			mapState.coords = [Utils.getURLParams().get("x"), Utils.getURLParams().get("y")];
		} else {
			mapState.coords = [this.mapConfig.defaultXPos, this.mapConfig.defaultYPos];
		}

		if (Utils.getURLParams().has("grid")) {
			mapState.showGrid = Utils.getURLParams().get("grid");
		} else {
			mapState.showGrid = false;
		}

		if (Utils.getURLParams().has("cellresource")) {
			mapState.cellResource = Utils.getURLParams().get("cellresource");
		}

		if (Utils.getURLParams().has("layer")) {
			let tileLayer = Utils.getURLParams().get("layer");
			mapState.tileLayer = (!isNaN(tileLayer)) ? tileLayer : (this.mapConfig.tileLayers.indexOf(tileLayer) > -1) ? this.mapConfig.tileLayers.indexOf(tileLayer) : 0;
		} else {
			mapState.tileLayer = 0;
		}

		return mapState;
	}

	hasMultipleMapLayers() {
		return this.mapConfig.tileLayers.length > 1;
	}

	updateMapState(mapState) {

		let newMapState;

		if (mapState == null) {
			newMapState = this.getMapState();
		} else {
			newMapState = mapState;
		}

		// update map state
		newMapState.coords = [Number(this.toXY(map.getCenter()).x).toFixed(3), Number(this.toXY(map.getCenter()).y).toFixed(3)];
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
			mapLink += 'world=' + newMapState.world.id;
			mapLink += '&';
		}
		if (this.hasMultipleMapLayers()) {
			mapLink += 'layer=' + this.mapConfig.tileLayers[newMapState.tileLayer];
			mapLink += '&';
		}
		mapLink += 'x=' + newMapState.coords[0];
		mapLink += '&y=' + newMapState.coords[1];
		mapLink += '&zoom=' + newMapState.zoomLevel;

		if (newMapState.showGrid) {
			mapLink += '&grid=' + newMapState.showGrid;
		}

		// update url with new state
		window.history.replaceState(newMapState, document.title, mapLink);
	}

	/*================================================
						  Worlds
	================================================*/

	/** Gets the current world ID (0 by default).
	 * @returns {int} worldID - ID that represents a world in the database.
	 */
	getCurrentWorldID() {
		return (this.currentWorldID != null) ? this.currentWorldID : getCurrentWorld().id;
	}

	getCurrentWorld() {
		return ( !Utils.isNull(this.getMapState()) && !Utils.isNull(this.getMapState().world) != null) ? self.getMapState().world : this.getWorldFromID( (this.currentWorldID != null) ? this.currentWorldID : this.mapConfig.defaultWorldID);
	}

	/** Gets the world object associated to a given worldID.
	 * @param {int} worldID - ID that represents a world in the database.
	 * @returns {Object} world - A world object that contains map info for the gamemap.
	 */
	getWorldFromID(worldID) {
		return this.mapWorlds[worldID];
	}

	getWorldNameFromID(worldID) {
		if (this.getWorldFromID(worldID) != null) return this.getWorldFromID(worldID).name; else return null;
	}

	getWorldDisplayNameFromID(worldID) {

		if (this.getWorldFromID(worldID) == null) {
			return null;
		} else {
			return this.getWorldFromID(worldID).displayName || null;
		}

	}

	getWorldFromName(worldName){
		return this.mapWorlds[mapWorldNameIndex[worldName]];
	}

	getWorldFromDisplayName(worldDisplayName){
		return this.mapWorlds[mapWorldDisplayNameIndex[worldDisplayName]];
	}

	/** Download and parse world data for this game's mapConfig.
	 * @see initialiseMap()
	 */
	getWorlds(mapConfig) {
		let queryParams = {};
		queryParams.action = "get_worlds";
		queryParams.db = mapConfig.database;

		if (this.isHiddenLocsShown()) {
			queryParams.showhidden = 1;
		}

		if (self.mapCallbacks != null) {
			self.mapCallbacks.setLoading("Loading world");
		}

		Utils.getJSON(Constants.GAME_DATA_SCRIPT + Utils.queryify(queryParams), function(error, data) {
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
				//throw new Error("Could not retrieve world data.");
			}
		});

	}

	/** Simple function that does stuffblah blah fill this in later
	 * @returns {Boolean} - A boolean whether or not the current mapConfig contains multiple worlds.
	 */
	hasMultipleWorlds() {
		return Object.keys(this.mapWorlds).length > 1;
	}

	hasWorld(worldID) {
		return worldID in this.mapWorlds;
	}

	isWorldValid(worldID) {
		return (worldID != null && worldID >= 0 && this.hasWorld(worldID));
	}

	gotoWorld(destID, coords, zoom) {

		zoom = (zoom != null) ? zoom : this.mapConfig.defaultZoomLevel;
		coords = (coords != null) ? coords : [this.mapConfig.defaultXPos, this.mapConfig.defaultYPos];

		if (destID > 0) { // is this destination a world?
			let worldID = destID;
			print(worldID);
			if (this.isWorldValid(worldID)) {

				let mapState = new MapState();
				mapState.zoomLevel = zoom;
				mapState.coords = coords;

				// if we are in the same world, just pan to the provided location (or pan to default)
				if (worldID == this.getCurrentWorldID()) {
					map.setView(this.toLatLng(coords), zoom);
				} else { // else load up the new world
					print("Going to world... " + worldID);
					print(this.getWorldFromID(worldID));
					if (this.mapCallbacks != null) {
						this.mapCallbacks.setLoading(true);
					}
					this.clearLocations();
					mapState.world = this.getWorldFromID(worldID);
					this.setMapState(mapState);
				}

			} else {
				throw new Error('Gamemap attempted to navigate to invalid world ID: ' + worldID);
			}
		} else { // this must be a location, centre on that location

			let locationID = Math.abs(destID); // get positive locationID from input

			function onGetLocation(location) {
				print(location);
				self.gotoWorld(location.worldID, location.coords, self.getWorldFromID(location.worldID).maxZoomLevel)
			}

			this.getLocation(locationID, onGetLocation);

			print("going to location");
		}
	}

	// convenience method to jump to destination
	gotoDest(destID) {
		this.gotoWorld(destID);
	}

	centreOn(locationID, openPopup) {


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
		if (this.isHiddenLocsShown()) { queryParams.showhidden = 1; }

		// make api query
		Utils.getJSON(Constants.GAME_DATA_SCRIPT + Utils.queryify(queryParams), function(error, data) {
			if (!error && data != null) {
				print("Got " + data.locationCount + " locations!");
				let locations = data.locations
				let parsedLocations = {};

				for (let key in locations) {
					let location = locations[key];

					if (location.id != null) {
						parsedLocations[location.id] = new Location(self.mapConfig, location, world);
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
			print(this.mapConfig.database)
			if (this.isHiddenLocsShown()) { queryParams.showhidden = 1; }

			Utils.getJSON(Constants.GAME_DATA_SCRIPT + Utils.queryify(queryParams), function(error, data) {

				print("Getting info for locationID: "+ locationID);

				if (!error && data != null && data.locations[0] != null) {
					print("Got location info!");
					print(data);
					if (!(onLoadFunction == null) ) {
						let world = self.getWorldFromID(data.locations[0].worldId);
						print(data.locations[0]);
						let location = new Location(self.mapConfig, data.locations[0], world)
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
			if (layer._tiles == null) { //remove anything that is not a tile
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

		// get coordinates of location
		let coords = [];
		for (let i = 0; i < location.coords.length; i++) {
			coords.push(this.toLatLng(location.coords[i]));
		}

		// make a generic fallback marker
		let marker = new L.marker(coords[0]);
		L.Marker.prototype.options.icon = L.icon({
			iconUrl: this.mapConfig.iconPath + "transparent.png",
		});

		// create specific marker type
		if (location.isPolygon()) { // is location polygonal? (polyline or polygon)

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

			if (location.locType == Constants.LOCTYPES.AREA) {
				marker = new L.polygon(coords, options);

				if (location.hasIcon()){
					marker.addTo(map);
					polygonIcon = this.makeMarker(location, marker.getCenter());
					marker.remove();
				}
			}

			if (location.locType == Constants.LOCTYPES.PATH) {
				marker = new L.polyline(coords, options);
			}


		} else { // if no, then it must be a single point (icon, label)

			if (location.hasIcon()) {
				marker = this.makeMarker(location, coords[0]);
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
		let iconURL = this.mapConfig.iconPath + "/" + location.icon + ".png";
		iconURL = iconURL.replace("//", "/"); // bypass bug doubling forward slashes for some reason

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
		}
		return {
			className : "location-label",
			permanent: true,
			direction: location.labelDirection,
			offset: offset,
		}
	}

	/*================================================
						  Utility
	================================================*/

	/**
	 * Gets width and height of the full map image.
	 * @param world -
	 * @returns mapImageDimens - The width/height of the map image as an object
	 * @example print(getMapImageDimensions().width);
	 */
	getMapImageDimensions(world) {

		let dimens = {};
		let width = null;
		let height = null;

		// check if this world has a number of tiles set
		if (world.numTilesX != null && world.numTilesY != null) {
			width = (world.numTilesX * this.mapConfig.tileSize) * Math.pow(2, 0);
			height = (world.numTilesY * this.mapConfig.tileSize) * Math.pow(2, 0);
		} else {
			throw new Error("No map tile dimensions were provided!");
		}

		dimens.width = width;
		dimens.height = height;

		return dimens;
	}

	/**
	 * Convert leaflet XY pixel coordinates to creation kit game worldspace ones.
	 * @param {Point} coord - the XY coordinate pair to be converted
	 */
	gameToPixelCoords(coord) {

		if (coord == null || coord.x == null) {
			throw new Error("Tried to convert an invalid/null coord object.");
		}

		let world = this.getCurrentWorld();

		// get the current worldspace values in normalised form
		let nX = coord.x / world.maxX;
		let nY = 1 - (coord.y / world.maxY);

		// project normalised worldspace values to pixel values
		coord.x = Math.trunc(nX * world.totalWidth);
		coord.y = Math.trunc(nY * world.totalHeight);
		return coord;
	}


	/**
	 * Convert leaflet XY pixel coordinates to creation kit game worldspace ones.
	 * @param {Point} coord - the XY coordinate pair to be converted
	 */
	pixelToGameCoords(coord) {

		if (coord == null || coord.x == null) {
			throw new Error("Tried to convert an invalid/null coord object.");
		}

		// get current map world pixel position values
		let world = this.getCurrentWorld();
		let nX = coord.x / world.totalWidth;
		let nY = 1 - (coord.y / world.totalHeight);

		// reproject pixel values to worldspace
		coord.x = Math.trunc(world.minX + (world.maxX - world.minX) * nX);
		coord.y = Math.trunc(world.minY + (world.maxY - world.minY) * nY);
		return coord;
	}

	toCoords(coords) {

	}

	/**
	 * Convert leaflet LatLngs to XY / normalised coordinates.
	 * @param {Object} latLng - the leaflet coordinate object
	 */
	toXY(latLng, debug) {

		var coords;

		// are we given a debug flag to always output the leaflet XY coords?
		if (debug) {
			return RC.project(latLng);
		}

		// are we being given a latLng object from leaflet?
		if (latLng.lat != null) {
			coords = RC.project(latLng);
		}

		// are we being given a point (coord) object instead?
		if (latLng.x != null) {
			coords = latLng;
		}

		// is the current map using a normalised coordinate scheme?
		if (this.mapConfig.coordType == Constants.COORD_TYPES.NORMALISED) {

			if (coords.x > 1.5 || coords.y > 1.5) { // make sure to only convert non-normalised coordinates
				// divide xy coords by height to get normalised coords (0.xxx , 0.yyy)
				coords.x = (coords.x / this.mapImage.width).toFixed(3);
				coords.y = (coords.y / this.mapImage.height).toFixed(3);
			}

		}

		if (this.mapConfig.coordType == Constants.COORD_TYPES.WORLDSPACE) {
			coords = this.pixelToGameCoords(coords);
		}

		// return point object for coords
		return coords;
	}

	/**
	 * Convert XY coordinates to leaflet's  LatLongs.
	 * @param {Object} coords - the XY coordinate object
	 */
	toLatLng(coords) {

		let latLng;

		// are we being given a coord object?
		if (coords.x != null) {


			// are we using a normalised coordinate scheme?
			if (this.mapConfig.coordType == Constants.COORD_TYPES.NORMALISED) {

				// multiply the normalised coords by the map image dimensions
				// to get the XY coordinates

				let x = (coords.x * this.mapImage.width);
				let y = (coords.y * this.mapImage.height);
				let point = new Point(x, y);

				latLng = RC.unproject(point);
			} else {
				latLng = RC.unproject(coords);
			}
		}

		// are we being given an array of coords?
		if (coords[0] != null) {

			if (coords[0].x != null) { // are we given an array of coord objects?

				if (coords.length == 1) { // are we given a single coord object? (marker, point)
					return this.toLatLng(coords[0]);
				} else { // else we are given a polygon, calculate the middle coordinate

					let xs = [];
					let ys = [];

					for (let i in coords) {
						xs.push(coords[i].x);
						ys.push(coords[i].y);
					}

					let finalX = 0;
					let finalY = 0;

					for (let i in xs) {
						finalX = finalX + parseFloat(xs[i]);
						finalY = finalY + parseFloat(ys[i]);
					}

					return this.toLatLng(new Point(finalX / xs.length, finalY / ys.length));
				}

			} else if (coords.length > 1) { // else we are just given an array of coords

				let tempCoords = coords;

				// are we using a normalised coordinate scheme?
				if (this.mapConfig.coordType == Constants.COORD_TYPES.NORMALISED) {

					// multiply the normalised coords by the map image dimensions
					// to get the XY coordinates
					tempCoords[0] = (tempCoords[0] * this.mapImage.width);
					tempCoords[1] = (tempCoords[1] * this.mapImage.height);

					latLng = RC.unproject(tempCoords);
				} else if (this.mapConfig.coordType == Constants.COORD_TYPES.WORLDSPACE) {
					print("coords");
					print(coords);
					print(this.gameToPixelCoords(new Point(coords[0], coords[1])));
					latLng = RC.unproject(this.gameToPixelCoords(new Point(coords[0], coords[1])));
				}
			}

		}
		return latLng;
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
				self.gotoWorld(parentID);
			}
		})

		map.on("zoom", function(e) {
			if (self.mapCallbacks != null) {
				self.mapCallbacks.onZoom(map.getZoom());
			}
		})

		map.on("dblclick", function(event){
			map.panTo(event.latlng, {animate: true});
		})

	}

	onMarkerClicked(marker, shift, ctrl) {

		print(marker.location);

		let isJumpTo = marker.location != null && marker.location.isClickable();

		if (isJumpTo && !shift && !ctrl) { // is location a link to a worldspace/location

			let location = marker.location;
			if (location != null){
				if (location.destinationID < 0) { // is location destination a worldID
					this.gotoWorld(Math.abs(location.destinationID));
				} else { // it is a location ID
					function onGetLocation(location) {
						self.gotoWorld(location.worldID);
					}
					this.getLocation(location.destinationID, onGetLocation);
				}
			}
		} else {
			if (shift) { // if shift pressed, and can edit, show edit menu
				this.openPopup(marker, this.isMapEditingEnabled());
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
			M.toast({text: "TODO: Location editing not done yet."});
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
				if (location.locType != Constants.LOCTYPES.PATH) {
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

	setTileLayerTo(layer) {

		if (layer != null) {
			let layerIndex;
			if (isNaN(layer)){
				if (this.mapConfig.tileLayers.indexOf(layer) > -1 ) {
					layerIndex = this.mapConfig.tileLayers.indexOf(layer);
				}
			} else {
				layerIndex = layer;
			}

			if (layerIndex > -1 && layerIndex < this.mapConfig.tileLayers.length) {
				let mapState = this.getMapState();
				if (mapState.tileLayer != layerIndex) {
					mapState.tileLayer = layerIndex;
					this.setMapState(mapState, true);
				}
			} else {
				print.warn("TileLayer index was out of bounds.")
			}

		} else {
			print.error("Provided TileLayer was invalid.")
		}
	}

	isGridEnabled() {
		return this.gridEnabled;
	}

	// placeholder
	isResourceGridEnabled() {
		return false;
	}

	toggleCellGrid(toggle) {

		this.gridEnabled = toggle;

		if (toggle) {

			L.canvasOverlay()
				.params({bounds: RC.getMaxBounds(), className : "cellGrid", zoomAnimation: true})
				.drawing(drawingOnCanvas)
				.addTo(map);

			function drawingOnCanvas(layer, params) {

				// set up layer
				let ctx = params.canvas.getContext('2d');
				ctx.clearRect(0, 0, params.size.x, params.size.y);

				// set up bounds
				let bounds = RC.getMaxBounds();
				let minX = map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthWest())).x;
				let maxX = map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthEast())).x;
				let minY = map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthEast())).y;
				let maxY = map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getSouthEast())).y;

				let gridWidth = maxX - minX;
				let gridHeight = maxY - minY;
				print("Grid width: "+gridWidth+"px");
				print("Grid height: "+gridHeight+"px");

				function toPix(nX, nY) {
					nY = (nY != null) ? nY : nX;
					if (nY > 4 || nY < -4) { nY = nY / gridHeight; }
					if (nX > 4 || nX < -4) { nX = nX / gridWidth; }
					return new Point(minX + (nX * gridWidth), minY + (nY * gridHeight))
				}

				// work out zoom %
				let maxZoomLevel = self.getMapState().world.maxZoomLevel - 0.03;
				let currentZoom = self.getCurrentZoom();
				let nZoom = currentZoom / maxZoomLevel;
				print("nZoom is ... " +nZoom.toFixed(3));

				// work out grid gap size
				let gridSize = ((self.mapConfig.cellSize * nZoom) / gridWidth) * gridWidth;
				print("Grid offset (gap) is: "+ gridSize.toFixed(3) +"px");

				// work out how many rows and columns there should be
				let nRows = self.getMapImageDimensions(self.getCurrentWorld()).width / self.mapConfig.cellSize;
				let nCols = self.getMapImageDimensions(self.getCurrentWorld()).height / self.mapConfig.cellSize;
				print (nRows);
				print (nCols);

				// draw the outline of the grid
				ctx.beginPath();
				ctx.rect(minX, minY, gridWidth, gridHeight);
				ctx.strokeStyle = self.mapConfig.gridLineColour;
				ctx.lineWidth = self.mapConfig.gridLineWidth;
				ctx.stroke();

				// do rows
				ctx.moveTo(toPix(0).x, toPix(0).y);

				let nOffset = 0;
				for (let i = 0; i <= nRows; i++) {
					let offset = gridHeight / nRows;
					// draw a line
					ctx.beginPath();
					ctx.moveTo(toPix(nOffset).x, toPix(0).y);
					ctx.lineTo(toPix(nOffset).x, toPix(1).y);
					ctx.stroke();
					nOffset += offset / gridHeight;
				}

				nOffset = 0;
				for (let i = 0; i <= nCols; i++) {
					let offset = gridWidth / nCols;
					// draw a line
					ctx.beginPath();
					ctx.moveTo(toPix(0).x, toPix(nOffset).y);
					ctx.lineTo(toPix(1).x, toPix(nOffset).y);
					ctx.stroke();
					nOffset += offset / gridWidth;
				}

				// do cell labels
				let nYOffset = 0;
				let nXOffset = 0;
				if (currentZoom > self.mapConfig.gridShowLabelZoom) {
					for (let i = 0; i <= nCols; i++) {
						for (let j = 0; j <= nRows; j++) {

							// COLS = X
							// ROWS = Y
							let gridStartX = self.mapConfig.gridStart[0];
							let gridStartY = self.mapConfig.gridStart[1];
							let colNum = j + gridStartX;
							let rowNum = (-i) + gridStartY;

							if (rowNum % 5 == 0 && colNum % 5 == 0) {
								ctx.fillStyle = self.mapConfig.gridLabelColour;
								ctx.font = "bold 13px Arial";
								ctx.fillText([colNum, rowNum].join(', '), toPix(nXOffset).x, toPix(nYOffset + ((gridHeight / nRows) / gridHeight)).y);
							}

							nXOffset += (gridWidth / nCols) / gridWidth;
						}
						nXOffset = 0;
						nYOffset += (gridHeight / nRows) / gridHeight;
					}
				}
			};

		} else {
			//remove the cell grid
			map.eachLayer((layer) => {
				if (layer.options.className == "cellGrid") {
					layer.remove();
				}
			});
		}
	}

	isHiddenLocsShown() {
		if (Utils.getURLParams().get("showhidden") === "true") {
			return true;
		} else {
			return false;
		}

	}

	hasCenterOnURLParam(){
		return Utils.getURLParams().get("centeron") != null && Utils.getURLParams().get("centeron") !== '';
	}

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

	getMapObject() {
		return map;
	}

	hasMultipleURLParams() {
		return (Array.from(Utils.getURLParams().values())).length >= 2;
	}

	/*================================================
						Editing
	================================================*/

	// get if editing is enabled on this map
	isMapEditingEnabled() {
		return this.mapConfig.editingEnabled;
	}

	getCurrentTileLayerIndex() {
		return this.getMapState().tileLayer;
	}

	getNextTileLayerIndex() {
		return (this.getCurrentTileLayerIndex() +1) == (this.mapConfig.tileLayers.length) ? 0 : this.getCurrentTileLayerIndex() + 1;
	}

	getNextTileLayerName() {
		return this.mapConfig.tileLayers[this.getNextTileLayerIndex()];
	}

	getCurrentTileLayerName() {
		return this.mapConfig.tileLayers[this.getCurrentTileLayerIndex()];
	}

	// check if user has editing permissions
	checkPermissions() {

		let queryParams = {};
		let self = this;
		queryParams.action = "get_perm";
		queryParams.db = this.mapConfig.database;

		if (this.mapCallbacks != null) {
			this.mapCallbacks.setLoading("Getting permissions");
		}

		Utils.getJSON(Constants.GAME_DATA_SCRIPT + Utils.queryify(queryParams), function(error, data) {

			let canEdit = false;

			if (!error && data != null) {
				canEdit = data.canEdit;
			} else {
				print.warn("There was an error getting permissions.")
			}

			self.mapConfig.editingEnabled = canEdit;
			if (self.mapCallbacks != null) {
				self.mapCallbacks.onPermissionsLoaded(canEdit);
			}
		});

	}

	// tileX, tileY, zoom, world
	// https://maps.uesp.net/esomap/tamriel/zoom11/tamriel-0-2.jpg
	getMapTileImageURL(world, layerName, root) {
		let zoom = (root) ? "/zoom0/" : "/zoom{z}/";
		let xy = (root) ? "-0-0.jpg" : "-{x}-{y}.jpg";
		return this.mapConfig.tileURL + world.name + "/leaflet/" + layerName + zoom + world.name + xy;
	}

	getCurrentZoom() {
		return (map != null) ? map.getZoom() : 0;
	}

	getMaxZoom() {
		return (this.getCurrentWorld() != null) ? this.getCurrentWorld().maxZoomLevel : 5;
	}

}






// convertTileToGamePos(tileX, tileY) {

// 	let maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);
// 	let gameX = 0;
// 	let gameY = 0;

// 	gameX = Math.round(tileX / maxTiles * (this.mapConfig.maxX - this.mapConfig.minX) + this.mapConfig.minX);
// 	gameY = Math.round(tileY / maxTiles * (this.mapConfig.maxY - this.mapConfig.minY) + this.mapConfig.minY);

// 	return new Position(gameX, gameY);
// }

// uesp.gamemap.Map.prototype.convertGameToPixelSize = function(width, height)
// {
// 	let pixelW = 0;
// 	let pixelH = 0;
// 	let maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);

// 	pixelW = Math.round(width  * maxTiles / Math.abs(this.mapConfig.gamePosX2 - this.mapConfig.gamePosX1) * this.mapConfig.tileSize);
// 	pixelH = Math.round(height * maxTiles / Math.abs(this.mapConfig.gamePosY2 - this.mapConfig.gamePosY1) * this.mapConfig.tileSize);

// 	return new uesp.gamemap.Position(pixelW, pixelH);
// }


// uesp.gamemap.Map.prototype.convertPixelToGamePos = function(pixelX, pixelY)
// {
// 	mapOffset = this.mapRoot.offset();

// 	if (this.USE_CANVAS_DRAW)
// 	{
// 		tileX = (pixelX - this.mapTransformX) / this.mapConfig.tileSize + this.startTileX;
// 		tileY = (pixelY - this.mapTransformY) / this.mapConfig.tileSize + this.startTileY;
// 	}
// 	else
// 	{
// 		tileX = (pixelX - mapOffset.left) / this.mapConfig.tileSize + this.startTileX;
// 		tileY = (pixelY - mapOffset.top)  / this.mapConfig.tileSize + this.startTileY;
// 	}

// 	return this.convertTileToGamePos(tileX, tileY);
// }


// uesp.gamemap.Map.prototype.convertWindowPixelToGamePos = function(pixelX, pixelY)
// {
// 	mapOffset = this.mapRoot.offset();

// 	if (this.USE_CANVAS_DRAW)
// 	{
// 		tileX = (pixelX - this.mapTransformX - mapOffset.left) / this.mapConfig.tileSize + this.startTileX;
// 		tileY = (pixelY - this.mapTransformY - mapOffset.top) / this.mapConfig.tileSize + this.startTileY;
// 	}
// 	else
// 	{
// 		tileX = (pixelX - mapOffset.left) / this.mapConfig.tileSize + this.startTileX;
// 		tileY = (pixelY - mapOffset.top)  / this.mapConfig.tileSize + this.startTileY;
// 	}

// 	return this.convertTileToGamePos(tileX, tileY);
// }

// uesp.gamemap.Map.prototype.displayLocation = function (location)
// {
// 	if (location.worldID != this.currentWorldID) return;
// 	if (!location.visible && !this.isHiddenLocsShown()) return;

// 	location.computeOffset();
// 	location.update();
// }


// uesp.gamemap.Map.prototype.hasLocation = function(locId)
// {
// 	return locId in this.locations;
// }



// uesp.gamemap.Map.prototype.isGamePosInBounds = function(gamePos)
// {
// 	if (uesp.gamemap.isNullorUndefined(gamePos.x) || uesp.gamemap.isNullorUndefined(gamePos.y)) return false;

// 	if (this.mapConfig.gamePosX1 < this.mapConfig.gamePosX2)
// 	{
// 		if (gamePos.x < this.mapConfig.gamePosX1 || gamePos.x > this.mapConfig.gamePosX2) return false;
// 	}
// 	else
// 	{
// 		if (gamePos.x > this.mapConfig.gamePosX1 || gamePos.x < this.mapConfig.gamePosX2) return false;
// 	}

// 	if (this.mapConfig.gamePosY1 < this.mapConfig.gamePosY2)
// 	{
// 		if (gamePos.y < this.mapConfig.gamePosY1 || gamePos.y > this.mapConfig.gamePosY2) return false;
// 	}
// 	else
// 	{
// 		if (gamePos.y > this.mapConfig.gamePosY1 || gamePos.y < this.mapConfig.gamePosY2) return false;
// 	}

// 	return true;
// }



// uesp.gamemap.Map.prototype.onJumpToDestinationLoad = function (eventData)
// {
// 	if (eventData.destId == null) return;
// 	this.jumpToDestination(eventData.destId, eventData.openPopup, eventData.useEditPopup);
// }





// findLocationAt(pageX, pageY) {
// 	// Look for icons first
// 	for (let key in this.locations) {
// 		var location = this.locations[key];

// 		if (location.locType >= Constants.LOCTYPE_PATH) continue;
// 		if (location.worldID != this.currentWorldID) continue;
// 		if (!location.visible && !this.isHiddenLocsShown()) continue;
// 		if (location.displayLevel > this.zoomLevel || (this.isHiddenLocsShown() && this.zoomLevel == this.mapConfig.maxZoomLevel)) continue;

// 		const rect = this.mapCanvas.getBoundingClientRect();
// 		const x = pageX - rect.left;
// 		const y = pageY - rect.top;

// 		if (location.isMouseHoverCanvas(x, y)) return location;
// 	}

// 	// Check paths/areas next
// 	for (let key in this.locations) {
// 		var location = this.locations[key];

// 		if (location.locType < Constants.LOCTYPE_PATH) continue;
// 		if (location.worldID != this.currentWorldID) continue;
// 		if (!location.visible && !this.isHiddenLocsShown()) continue;
// 		if (location.displayLevel > this.zoomLevel || (this.isHiddenLocsShown() && this.zoomLevel == this.mapConfig.maxZoomLevel)) continue;

// 		const rect = this.mapCanvas.getBoundingClientRect();
// 		const x = pageX - rect.left;
// 		const y = pageY - rect.top;

// 		if (location.isMouseHoverCanvas(x, y)) return location;
// 	}

// 	return null;
// }

// uesp.gamemap.Map.prototype.jumpToDestination = function (destId, openPopup, useEditPopup)
// {
// 	if (destId == null || destId == 0) return;

// 	if (destId < 0)
// 	{
// 		return this.jumpToWorld(-destId);
// 	}

// 	if (!this.hasLocation(destId))
// 	{
// 		uesp.printDebug(uesp.print_LEVEL_ERROR, "Don't have data for destination location #" + destId + "!");
// 		this.retrieveLocation(destId, this.onJumpToDestinationLoad, { destId: destId, openPopup:openPopup, useEditPoup:useEditPopup });
// 		return;
// 	}

// 	var newState = new uesp.gamemap.MapState;
// 	var destLoc  = this.locations[destId];

// 	newState.worldID = destLoc.worldID;
// 	newState.gamePos.x = destLoc.x;
// 	newState.gamePos.y = destLoc.y;

// 	newState.zoomLevel = this.zoomLevel;
// 	if (newState.zoomLevel < destLoc.displayLevel) newState.zoomLevel = destLoc.displayLevel;


// 	if (openPopup === true || (this.openPopupOnJump && (destLoc.displayData.labelPos != 0 || destLoc.iconType != 0)))
// 	{
// 		if (useEditPopup === true) destLoc.useEditPopup = true;
// 		destLoc.showPopup();
// 	}
// }


// uesp.gamemap.Map.prototype.createEditNoticeDiv = function()
// {
// 	this.editNoticeDiv = $('<div />').attr('id', 'gmMapEditNotice')
// 								.attr('class', '')
// 								.appendTo(this.mapContainer);
// }


// uesp.gamemap.Map.prototype.displayEditNotice = function(Notice, FinishButton, CancelButton)
// {
// 	var self = this;

// 	if (!this.editNoticeDiv) this.createEditNoticeDiv();

// 	if (CancelButton != null && CancelButton.length > 0)
// 	{
// 		Notice += "<button id='gmMapEditNoticeCancel'>" + CancelButton + "</button>";
// 	}

// 	if (FinishButton != null && FinishButton.length > 0)
// 	{
// 		Notice += "<button id='gmMapEditNoticeFinish'>" + FinishButton + "</button>";
// 	}

// 	this.editNoticeDiv.html(Notice);
// 	this.editNoticeDiv.show();

// 	$('#gmMapEditNoticeCancel').bind("touchstart click", function(event) {
// 		self.onCancelEditMode(event);
// 		return false;
// 	});

// 	$('#gmMapEditNoticeFinish').bind("touchstart click", function(event) {
// 		self.onFinishEditMode(event);
// 		return false;
// 	});
// }


// uesp.gamemap.Map.prototype.hideEditNotice = function()
// {
// 	if (this.editNoticeDiv)
// 	{
// 		this.editNoticeDiv.hide();
// 		this.editNoticeDiv.html('');
// 	}
// }


// uesp.gamemap.Map.prototype.onCancelEditMode = function(event)
// {
// 	if (this.currentEditMode == '') return true;

// 	this.removeEditClickWall();
// 	this.hideEditNotice();

// 	if (this.currentEditMode == 'edithandles')
// 	{
// 		this.currentEditLocation.editPathHandles = false;

// 		if (this.currentEditLocation.pathElement)
// 		{
// 			this.currentEditLocation.pathElement.css('z-index', '');
// 		}

// 		this.currentEditLocation.displayData.points = this.currentEditPathPoints;
// 		this.currentEditLocation.computePathSize();
// 		this.currentEditLocation.updateFormPosition();
// 		this.currentEditLocation.computeOffset();
// 		this.currentEditLocation.updatePath();

// 		this.currentEditLocation.showPopup();
// 	}
// 	else if (this.currentEditMode == 'draglocation')
// 	{
// 		this.currentEditLocation.displayData.points = this.currentEditPathPoints;
// 		this.currentEditLocation.computePathSize();
// 		this.currentEditLocation.updateFormPosition();
// 		this.currentEditLocation.computeOffset();

// 		this.currentEditLocation.update();
// 		this.currentEditLocation.showPopup();
// 	}
// 	else if (this.currentEditMode == 'editworld')
// 	{
// 		this.hideWorldEditForm();
// 	}
// 	else if (this.currentEditMode == 'addpath' || this.currentEditMode == 'addarea')
// 	{
// 		delete this.locations[this.currentEditLocation.id];
// 		this.currentEditLocation.removeElements();
// 	}

// 	this.currentEditLocation = null;
// 	this.currentEditPathPoints = null;
// 	this.currentEditMode = '';
// 	this.currentEditWorld = null;

// 	this.redrawCanvas(true);

// 	return true;
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


// uesp.gamemap.Map.prototype.onDragLocationClick = function(event)
// {
// 	event.preventDefault();
// 	if (this.currentEditLocation == null) return false;

// 	gamePos = this.convertWindowPixelToGamePos(event.pageX, event.pageY);
// 	this.currentEditLocation.x = gamePos.x;
// 	this.currentEditLocation.y = gamePos.y;
// 	this.currentEditLocation.displayData.points[0] = gamePos.x;
// 	this.currentEditLocation.displayData.points[1] = gamePos.y;

// 	this.currentEditLocation.computeOffset();
// 	this.currentEditLocation.update();

// 	this.redrawCanvas(true);

// 	return true;
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

// uesp.gamemap.Map.prototype.redrawLocationPaths = function()
// {
// 	for (key in this.locations)
// 	{
// 		if (this.locations[key].locType >= Constants.LOCTYPE_PATH) this.locations[key].updatePathSize();
// 	}
// }

// uesp.gamemap.Map.prototype.updateLocationId = function(oldId, newId)
// {
// 	if (oldId in this.locations)
// 	{
// 		var location = this.locations[oldId];
// 		delete this.locations[oldId];
// 		location.id = newId;
// 		this.locations[newId] = location;
// 	}
// }


// uesp.gamemap.Map.prototype.addEditClickWall = function(cursor)
// {

// 	if (this.editClickWall == null)
// 	{
// 		this.editClickWall = $('<div />')
// 				.attr('id', 'gmMapRootClickWall')
// 				.appendTo(this.mapContainer);

// 		this.editClickWall.bind("touchstart click", { self: this }, this.onClick);
// 		this.editClickWall.mousemove({ self: this }, this.onMouseMove);
// 		this.editClickWall.mouseup({ self: this }, this.onMouseUp);
// 		this.editClickWall.mousedown({ self: this }, this.onMouseDown);
// 	}

// 	if (cursor == null)
// 		this.editClickWall.css('cursor', '');
// 	else
// 		this.editClickWall.css('cursor', cursor);

// 	this.editClickWall.css('z-index', 101);
// 	this.editClickWall.show();
// }


// uesp.gamemap.Map.prototype.removeEditClickWall = function()
// {
// 	if (this.editClickWall == null) return;

// 	this.editClickWall.css('cursor', '');
// 	this.editClickWall.css('background', '');
// 	this.editClickWall.css('z-index', 0);
// 	this.editClickWall.hide();
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


// uesp.gamemap.Map.prototype.enableWorldPopupEditButtons = function (enable)
// {
// 	if (this.worldEditPopup == null) return;
// 	this.worldEditPopup.find('input[type="button"]').attr('disabled', enable ? null : 'disabled');
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


// uesp.gamemap.Map.prototype.onCloseWorldEditPopup = function(event)
// {
// 	this.hideWorldEditForm();
// 	this.removeEditClickWall();
// 	this.currentEditMode = '';
// 	this.currentEditWorld = null;
// 	return true;
// }


// uesp.gamemap.Map.prototype.onSaveWorldEditPopup = function(event)
// {
// 	if (!this.canEdit()) return false;
// 	if (this.worldEditPopup == null) return false;

// 	this.setWorldPopupEditNotice('Saving world...');
// 	this.enableWorldPopupEditButtons(false);

// 	this.getWorldFormData();

// 	//this.update();

// 	this.doWorldSaveQuery(this.currentEditWorld);

// 	return true;
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


// uesp.gamemap.Map.prototype.getWorldFormData = function()
// {
// 	if (!this.canEdit()) return false;

// 	form = this.worldEditPopup.find('form');
// 	if (form == null) return false;

// 	formValues = uesp.getFormData(form)

// 	formValues.parentId = parseInt(formValues.parentId);
// 	formValues.minZoom = parseInt(formValues.minZoom);
// 	formValues.maxZoom = parseInt(formValues.maxZoom);
// 	formValues.zoomOffset = parseInt(formValues.zoomOffset);
// 	formValues.posLeft = parseInt(formValues.posLeft);
// 	formValues.posRight = parseInt(formValues.posRight);
// 	formValues.posTop = parseInt(formValues.posTop);
// 	formValues.posLeft = parseInt(formValues.posLeft);

// 	if (formValues.enabled == null)
// 		formValues.enabled = false;
// 	else
// 		formValues.enabled = parseInt(formValues.enabled) != 0;

// 	uesp.gamemap.mergeObjects(this.currentEditWorld, formValues);

// 	this.currentEditWorld.updateOptions();
// 	return true;
// }

// uesp.gamemap.Map.prototype.createHelpBlockElement = function()
// {
// 	var self = this;

// 	if (this.mapConfig.isOffline)
// 	{
// 		this.helpBlockElement = $(".gmHelpBlock");

// 		self.helpBlockElement.find('.gmHelpCloseButton').bind("touchstart click", function(event) {
// 			self.hideHelpBlock();
// 			return false;
// 		});

// 		$(document).mousedown(function(e){
// 			var container = self.helpBlockElement;

// 			if (!container.is(e.target) && container.has(e.target).length === 0)
// 			{
// 				self.hideHelpBlock();
// 			}
// 		});

// 		return;
// 	}

// 	this.helpBlockElement = $('<div />')
// 				.addClass('gmHelpBlock')
// 				.html("Loading...")
// 				.appendTo(this.mapContainer);

// 	$.get( this.mapConfig.helpTemplate, function( data ) {
// 		self.helpBlockContents = data;
// 		uesp.printDebug(uesp.print_LEVEL_WARNING, 'Received help block contents!', data);
// 		$('.gmHelpBlock').html(data);

// 		self.helpBlockElement.find('.gmHelpCloseButton').bind("touchstart click", function(event) {
// 			self.hideHelpBlock();
// 			return false;
// 		});

// 		$(document).mousedown(function(e){
// 			var container = self.helpBlockElement;

// 			if (!container.is(e.target) && container.has(e.target).length === 0)
// 			{
// 				self.hideHelpBlock();
// 			}
// 		});
// 	});

// }


// uesp.gamemap.Map.prototype.showHelpBlock = function()
// {
// 	if (this.currentEditMode != '') return false;

// 	this.addEditClickWall('default');
// 	this.setEditClickWallBackground('rgba(0,0,0,0.5)');
// 	this.currentEditMode = 'showhelpblock';

// 	if (this.helpBlockElement == null) this.createHelpBlockElement();
// 	this.helpBlockElement.show();
// }



// uesp.gamemap.Map.prototype.showMapKey = function()
// {
// 	if (this.currentEditMode != '') return false;

// 	this.addEditClickWall('default');
// 	this.setEditClickWallBackground('rgba(0,0,0,0.5)');
// 	this.currentEditMode = 'showmapkey';

// 	if (this.mapKeyElement == null) this.createMapKey();
// 	this.mapKeyElement.show();
// }


// uesp.gamemap.Map.prototype.createMapKey = function()
// {
// 	var self = this;
// 	var MapKeyContent = "<div class='gmMapKeyTitle'>Map Key</div>" +
// 						"<button class='gmMapKeyCloseButton'>Close</button>" +
// 						this.createMapKeyContent() +
// 						"";

// 	this.mapKeyElement = $('<div />')
// 			.addClass('gmMapKey')
// 			.html(MapKeyContent)
// 			.appendTo(this.mapContainer);

// 	this.mapKeyElement.find('.gmMapKeyCloseButton').bind("touchstart click", function(event) {
// 		self.hideMapKey();
// 		return false;
// 	});

// 	$(document).mousedown(function(e){
// 		var container = self.mapKeyElement;

// 		if (!container.is(e.target) && container.has(e.target).length === 0)
// 		{
// 			self.hideMapKey();
// 		}
// 	});

// }


// uesp.gamemap.Map.prototype.createMapKeyContent = function()
// {
// 	if (this.mapConfig.iconTypeMap == null) return 'No Map Icons Available';

// 	var reverseIconTypeMap = { };
// 	var sortedIconTypeArray = [ ];

// 	for (key in this.mapConfig.iconTypeMap)
// 	{
// 		var keyValue = this.mapConfig.iconTypeMap[key];

// 			// Only permit unique icon names to display
// 			// TODO: Check for different icon images?
// 		if (reverseIconTypeMap[keyValue] == null) sortedIconTypeArray.push(keyValue);

// 		reverseIconTypeMap[keyValue] = key;
// 	}

// 	sortedIconTypeArray.sort();

// 	var output = "<div class='gmMapKeyContainer'><div class='gmMapKeyColumn'>";
// 	var numColumns = this.mapKeyNumColumns;
// 	var itemsPerColumn = sortedIconTypeArray.length / numColumns;
// 	var itemCount = 0;

// 	for (key in sortedIconTypeArray)
// 	{
// 		iconTypeLabel = sortedIconTypeArray[key];
// 		iconType = reverseIconTypeMap[iconTypeLabel];

// 		output += "<div class='gmMapKeyItem'>";
// 		output += "<div class='gmMapKeyImageImage'><img src='" + this.mapConfig.iconPath + iconType + ".png' /></div>";
// 		output += "<div class='gmMapKeyItemLabel'>"+ iconTypeLabel + "</div>";
// 		output += "</div><br />";

// 		++itemCount;

// 		if (itemCount > itemsPerColumn)
// 		{
// 			output += "</div><div class='gmMapKeyColumn'>";
// 			itemCount = 0;
// 		}
// 	}

// 	output += "</div></div>"
// 	return output;
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


// uesp.gamemap.Map.prototype.updateRecentChanges = function ()
// {
// 	var self = this;

// 	var queryParams = {};
// 	queryParams.action = "get_rc";
// 	queryParams.db = this.mapConfig.dbPrefix;

// 	if (this.mapConfig.isOffline)
// 	{
// 		// Do nothing
// 	}
// 	else
// 	{
// 		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {
// 			self.onReceiveRecentChanges(data);
// 		});
// 	}
// }


// uesp.gamemap.Map.prototype.onReceiveRecentChanges = function (data)
// {

// 	if (data == null || data.recentChanges == null)
// 	{
// 		this.clearRecentChanges();
// 		return false;
// 	}

// 	var output = "";

// 	for (key in data.recentChanges)
// 	{
// 		recentChange = data.recentChanges[key];

// 		let imageURL = this.mapConfig.iconPath + recentChange.iconType + ".png";

// 		output += "<div class='gmMapRCItem' onclick='g_GameMap.jumpToDestination(" + recentChange.locationId + ", true, true);'>";
// 		output += "<img src='" + imageURL + "' class='gmMapRCItemIcon' />";
// 		output += "<div class='gmMapRCItemName'>" + recentChange.locationName  + "</div>";
// 		output += " <div class='gmMapRCItemSmall'>(" + recentChange.worldDisplayName + ") -- " + recentChange.editTimestamp + "</div>";
// 		output += "</div>";
// 	}

// 	this.recentChangesRoot.html(output);

// 	return true;
// }