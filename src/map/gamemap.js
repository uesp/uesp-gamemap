/**
 * @name gamemap.js
 * @author Dave Humphrey <dave@uesp.net> (21st Jan 2014)
 * @summary The main source code for the interactive gamemap.
 */

import * as Utils from "../common/utils.js";
import * as Constants from "../common/constants.js";
import World from "./world.js";
import MapState from "./mapstate.js";
import RasterCoords from "../lib/leaflet/rastercoords.js";

/*================================================
					Locals
================================================*/

var map; // Leaflet map instance
var self; // Local "this" instance of Gamemap
var RC; // RasterCoords instance, for converting leaflet latlongs to XY coords and back
var isLoaded = false; // Temp loaded state bool to prevent race conditions

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
	constructor(mapRootID, mapConfig, mapCallbacks) {
		if (mapRootID != null && mapConfig != null && mapCallbacks != null) {

			// load in map config
			this.mapConfig = mapConfig;
		
			// set up map callbacks
			this.mapCallbacks = mapCallbacks;
		
			// set up the root map element
			this.mapRoot = $('#' + mapRootID);
			this.rootMapID = mapRootID;
			if (this.mapRoot == null) {
				throw new Error('The gamemap container \'' + mapRootID + '\' could not be found or was invalid.');
			} 
			this.mapRoot = $('<div />').attr('id', 'gmMapRoot').appendTo(this.mapRoot);
			self = this;

			$("#"+mapRootID).css("background-color", mapConfig.bgColour);

			// set the default map info 	
			this.locations = {};
			this.mapWorlds = {};
			this.mapWorldNameIndex = {};
			this.mapWorldDisplayNameIndex = {};

			// set up state bools
			this.defaultShowHidden = false;
			this.openPopupOnJump = false;
			this.editingEnabled = false;
			
			// check user editing permission
			this.checkPermissions();

			// get world data for this mapConfig
			this.getWorlds(mapConfig);

			// initialise map
			if (isLoaded) {
				this.initialiseMap(mapConfig);
			}

		} else {
			throw new Error("The gamemap constructor was provided invalid/missing params.");
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
			zoomSnap: mapConfig.enableZoomSnap,
			zoomDelta: mapConfig.zoomStep,
			zoomControl: false, // hide leaflet zoom control (we have our own)
			doubleTouchDragZoom: Utils.isMobileDevice(), // enable double touch drag zoom on mobile only
			debounceMoveend: false,
        }

		map = L.map(this.rootMapID, mapOptions);
		this.setupInfobar(mapConfig);

		let mapState = new MapState();
		mapState.zoomLevel = mapConfig.defaultZoomLevel;
		mapState.worldID = mapConfig.defaultWorldID || 0;

		if (this.hasCenterOnURLParam()) { // check if URL has "centeron" param
			// find location and centre on it
		} else if (this.hasMultipleURLParams()) { // else check if has multiple url params 
			// load state from URL
			mapState = this.getMapStateFromURL();
		}

		// load map state
		this.setMapState(mapState);

		// create map events
		this.createEvents();
	}

	/** Simple function to create the infobar at the bottom right of the gamemap screen.
	 * @param {Object} mapConfig - Object that controls the default/imported settings of the map.
	 */
	setupInfobar(mapConfig) {
		map.attributionControl.setPrefix('<a href="//www.uesp.net/wiki/Main_Page" title="Go to UESP home"><b class="wikiTitle">UESP</b></a>');
		map.attributionControl.addAttribution('<a id="mapNameLink" onclick="resetMap()" href="javascript:void(0);" title="Reset the map view">'+ mapConfig.mapTitle +'</a>  |  <a id="mapFeedbackLink" href="'+ mapConfig.feedbackURL +'" title="Give feedback about this map">Send Feedback</a>' );
	}

	/*================================================
						  State 
	================================================*/

	/** Set map to saved map state (use to load from URL or from saved state).
	 * @param {Object} mapState - Object that controls the state and view of the map.
	 */
	setMapState(mapState) {

		// set full image width & height
		let mapImageDimens = this.getMapImageDimensions();
		this.mapImage = { 
			width : mapImageDimens.width,  // original width of image
			height: mapImageDimens.height, // original height of image
		}

		RC = new RasterCoords(map, this.mapImage)

		let tileOptions = {
			noWrap: true,
			bounds: RC.getMaxBounds(),
			maxNativeZoom: this.mapConfig.maxZoomLevel,
			errorTileUrl: this.mapConfig.missingMapTile,
			minZoom: this.mapConfig.minZoomLevel,
			maxZoom: this.mapConfig.maxZoomLevel,
			edgeBufferTiles: this.mapConfig.numEdgeBufferTiles,
		}
			
		L.tileLayer(this.getMapTileImageURL(this.mapWorlds[mapState.worldID], this.mapConfig), tileOptions).addTo(map);

		// set map view
		map.setView(this.toLatLng(mapState.coords), mapState.zoomLevel);
		this.setWorld(mapState.worldID);

		// remove map bounds to fix RC bug
		map.setMaxBounds(null);

		// finally, update map state
		this.currentMapState = mapState;
		this.updateMapLink(map);
		isLoaded = true;
	}

	/** Get current map state object.
	 * @returns {Object} mapState - Object that controls the state and view of the map.
	 */
	getMapState() {
		return this.currentMapState;
	}

	/** Gets map state object from URL params (XY coords, world etc).
	 * @returns {Object} mapState - Object that controls the state and view of the map.
	 */
	getMapStateFromURL() {

		let mapState = new MapState();

		if (Utils.getURLParams().has("zoom")){
			mapState.zoomLevel = Utils.getURLParams().get("zoom");
		}

		if (Utils.getURLParams().has("world")){
			mapState.worldID = Utils.getURLParams().get("world");
			if (mapState.worldID == "undefined") {
				mapState.worldID = this.mapConfig.defaultWorldID;
			}
		}

		if (Utils.getURLParams().has("x") && Utils.getURLParams().has("y")) {
			mapState.coords = [Utils.getURLParams().get("x"), Utils.getURLParams().get("y")];
		}

		if (Utils.getURLParams().has("grid")){
			mapState.showGrid = Utils.getURLParams().get("grid");
		}

		if (Utils.getURLParams().has("cellresource")){
			mapState.cellResource = Utils.getURLParams().get("cellresource");
		}

		return mapState;
	}

	/*================================================
						  Worlds 
	================================================*/

	/** Gets the current world ID (0 by default).
	 * @returns {int} worldID - ID that represents a world in the database.
	 */
	getCurrentWorldID() {
		return this.getMapState().worldID || this.mapConfig.defaultWorldID;
	}

	/** Gets the world object associated to a given worldID.
	 * @param {int} worldID - ID that represents a world in the database.
	 * @returns {Object} world - A world object that contains map info for the gamemap.
	 */
	getWorldFromID(worldID) {		
		return this.mapWorlds[worldID] || null; 
	}

	getWorldFromName(worldName){
		return this.mapWorlds[this.mapWorldNameIndex[worldName]];
	}

	/** Download and parse world data for this game's mapConfig.
	 * @see initialiseMap()
	 */
	getWorlds(mapConfig) {
		let queryParams = {};
		queryParams.action = "get_worlds";
		queryParams.db = mapConfig.database;
		loading("world");

		if (this.isHiddenLocsShown()) {
			queryParams.showhidden = 1;
		} 
	
		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {
			if (data.isError) {
				throw new Error("Could not retrieve world data.");
			} else {
				if (data.worlds == null) {
					throw new Error("World data was null.");
				}
			}
	
			for (var key in data.worlds) {
				let world = data.worlds[key];

				if (world.id > mapConfig.minWorldID && world.id < mapConfig.maxWorldID && world.name != null) {
					self.mapWorlds[world.id] = new World(world.name.toLowerCase(), mapConfig, world.id);
					self.mapWorlds[world.id].mergeMapConfig(mapConfig);
					self.mapWorldNameIndex[world.name.toLowerCase()] = world.id;
					if (world.displayName != null) self.mapWorldDisplayNameIndex[world.displayName] = world.id;
					self.mapWorlds[world.id] = Utils.mergeObjects(self.mapWorlds[world.id], world);
					self.mapWorldNameIndex[world.name] = world.id;
					self.mapWorldDisplayNameIndex[world.displayName] = world.id;
				}
			}
			if (self.mapCallbacks != null) {
				self.mapCallbacks.onWorldsLoaded(self.mapWorlds);

				// load map
				if (!isLoaded) {
					self.initialiseMap(mapConfig);
				}
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


	gotoWorld(worldID, coords) {

		// TODO: 

	}



	// takes both world and worldID
	setWorld(worldIdentifier) {
		let worldID = 0;

		if (isNaN(worldIdentifier)){ // is "worldIdentifier" a world object?
			worldID = this.getWorldFromID(worldIdentifier).worldID;
		} else {
			worldID = worldIdentifier;
		}

		if (worldID < 0 || !(worldID in this.mapWorlds)){
			throw new Error('Gamemap attempted to navigate to invalid world ID: ' + worldID);
		}  

		if (worldID in this.mapWorlds) {
			this.mapWorlds[worldID].mapState  = this.getMapState();
			this.mapWorlds[worldID].mapConfig = this.mapConfig;
		}

		// load layers and locations
		L.marker(this.toLatLng([0.5, 0.5])).addTo(map);

		var myIcon = L.divIcon({className: 'gmMapLoc', html: '<b>Hello! This is a long marker test</b>'});
		L.marker(this.toLatLng([0.5, 0.7]), {icon: myIcon}).addTo(map);

		var myIcon = L.divIcon({className: 'gmMapLoc', html: '<div class="gmMapLocIconDiv" style="z-index: 12;"><img class="gmMapLocIcon" src="assets/icons/eso/51.png" unselectable="on" style="user-select: none;"><span class="gmMapLocIconHelper"></span></div>'});
		L.marker(this.toLatLng([0.5, 0.6]), {icon: myIcon}).addTo(map);


		//this.clearLocationElements();
		// load new locations for this map

		this.currentWorldID = worldID;
		this.mapConfig = this.mapWorlds[this.currentWorldID].mapConfig;

		//callback to notify world changed
		if (this.mapCallbacks != null) {
			this.mapCallbacks.onWorldChanged(this.mapWorlds[this.currentWorldID])
		}
	
	}

	updateMapLink(map, mapState) {

		// TODO: refactor away from using map directly and use mapState

		let mapLink = "?"

		if (this.hasMultipleWorlds()){
			mapLink += 'world=' + this.getCurrentWorldID();
		}

		mapLink += '&x=' + this.toCoords(map.getCenter()).x;
		mapLink += '&y=' + this.toCoords(map.getCenter()).y;
		mapLink += '&zoom=' + parseFloat(map.getZoom().toFixed(3));

		if (window.history.replaceState) {
			//prevents browser from storing history with each change:
			window.history.replaceState(null, document.title, mapLink);
		}
	}

	// tileX, tileY, zoom, world
	getMapTileImageURL(world, mapConfig) {

		// http://mavvo.altervista.org/dofus/tiles/{z}/{x}/{y}.png
		// https://maps.uesp.net/esomap/tamriel/zoom11/tamriel-0-2.jpg
		//L.tileLayer('https://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});

		if (mapConfig.database == "eso") { // unique stuff for eso
			return mapConfig.tileURL + world.name + "/zoom{z}/" + world.name + "-{x}-" + "{y}" + ".jpg";
		} else {
			if (world == null) {
				return "zoom{z}/maptile-{x}-{y}.jpg";
			} else {
				return world + "zoom{z}/maptile-{x}-{y}.jpg";
			}
		}
	}










	/*================================================
						  Utility 
	================================================*/

	/**
	 * Gets width and height of the full map image.
	 * @returns mapImageDimens - The width/height of the map image as an object
	 * @example print(getMapImageDimensions().width);
	 */
	getMapImageDimensions() {

		let dimens = {};
		let width = null;
		let height = null;

		// check if actual map image dimensions (not tile dimensions) are provided
		if (this.mapConfig.fullWidth != null && this.mapConfig.fullHeight != null) { 
			width = this.mapConfig.fullWidth;
			height = this.mapConfig.fullHeight;
		} else if (this.mapConfig.numTilesY == this.mapConfig.numTilesX) { // if the map is a square (1:1)
			// then calculate the image dimensions as the size of the whole grid
			width = this.mapConfig.numTilesX * this.mapConfig.tileSize;
			height = this.mapConfig.numTilesY * this.mapConfig.tileSize;
		} else {
			throw new Error("No map dimensions were provided!");
		}

		dimens.width = width;
		dimens.height = height;

		return dimens;
	}

	/** 
	 * Convert leaflet LatLongs to XY / normalised coordinates.
	 * @param {Object} latLng - the leaflet coordinate object
	 */
	toCoords(latLng) {

		let coords;

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

			// divide xy coords by height to get normalised coords (0.xxx , 0.yyy)
			coords.x = (coords.x / this.mapImage.width).toFixed(3);
			coords.y = (coords.y / this.mapImage.height).toFixed(3);
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
				coords.x = (coords.x * this.mapImage.width);
				coords.y = (coords.y * this.mapImage.height);
			}

			latLng = RC.unproject(coords);
		}

		// are we being given an array of coords?
		if (coords[0] != null && coords.length == 2) {

			// are we using a normalised coordinate scheme?
			if (this.mapConfig.coordType == Constants.COORD_TYPES.NORMALISED) {

				// multiply the normalised coords by the map image dimensions
				// to get the XY coordinates
				coords[0] = (coords[0] * this.mapImage.width);
				coords[1] = (coords[1] * this.mapImage.height);
			}

			latLng = RC.unproject(coords);
		}
		return latLng;
	}


	/*================================================
						  Events 
	================================================*/

	createEvents() {
		
		map.on("moveend", function(e){
			self.updateMapLink(map, self.mapConfig);
			
		})

		map.on("zoomend", function(e){
			self.updateMapLink(map, self.mapConfig);
		})

		map.on("zoom", function(e){
			if (map.getZoom() >= self.mapConfig.maxZoomLevel) {
				$("#btn_zoom_in").prop("disabled",true);
			}

			if (map.getZoom() <= self.mapConfig.minZoomLevel) {
				$("#btn_zoom_out").prop("disabled",true);
			}

			if (map.getZoom() > self.mapConfig.minZoomLevel && map.getZoom() < self.mapConfig.maxZoomLevel) {
				$("#btn_zoom_out").prop("disabled", false);
				$("#btn_zoom_in").prop("disabled", false);
			}
		})

		map.on("dblclick", function(event){
			if (!Utils.isMobileDevice()){
				alert(self.toCoords(event.latlng));
			}
		})

	}

	zoomIn(){
		map.zoomIn();
	}

	zoomOut(){
		map.zoomOut();
	}

	getCurrentZoom() {
		return map.getZoom();
	}



	/*================================================
						  General 
	================================================*/

	isHiddenLocsShown() {
		if (Utils.getURLParams().get("showhidden") === "true") {
			return true;
		} else {
			return this.defaultShowHidden;
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
	
		wikiPage = encodeURIComponent (wikiPage);
	
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
		return this.editingEnabled;
	}

	// check if user has editing permissions
	checkPermissions() {

		loading("permissions");

		let queryParams = {};
		let self = this;
		queryParams.action = "get_perm";
		queryParams.db = this.mapConfig.database;

		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {

			if (data.canEdit != null) {
				self.editingEnabled = data.canEdit;
			} 

			if (self.mapCallbacks != null) {
				self.mapCallbacks.onPermissionsLoaded(self.isMapEditingEnabled());
			}
			
		});

	}








































// retrieveLocations() {
	// 	var self = this;
	// 	// var mapBounds = this.getMapBounds();

	// 	// var queryParams = {};
	// 	// queryParams.action = "get_locs";
	// 	// queryParams.world  = this.currentWorldID;
	// 	// queryParams.top    = mapBounds.top;
	// 	// queryParams.bottom = mapBounds.bottom;
	// 	// queryParams.left   = mapBounds.left;
	// 	// queryParams.right  = mapBounds.right;
	// 	// queryParams.zoom   = this.zoomLevel;
	// 	// if (this.isHiddenLocsShown()) queryParams.showhidden = 1;
	// 	// if (!this.hasWorld(this.currentWorldID)) queryParams.incworld = 1;
	// 	// queryParams.db = this.mapConfig.database;

	// 	// if (queryParams.world <= 0) return print("Unknown worldID for current world " + this.currentWorldID + "!");

	// 	// $.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) { self.onReceiveLocationData(data); });
	// 	//changeWorld
	// }

	// onReceiveLocationData(data) {
	// 	print("Received location data");
	// 	print(data);

	// 	if (data.isError != null)  return print("Error retrieving location data!", data.errorMsg);
	// 	if (data.locations == null) return print("Location data not found in JSON response!", data);

	// 	this.mergeLocationData(data.locations, true);

	// 	if (this.showPopupOnLoadLocationId > 0 && this.locations[this.showPopupOnLoadLocationId] != null) {
	// 		this.locations[this.showPopupOnLoadLocationId].showPopup();
	// 		this.showPopupOnLoadLocationId = -1;
	// 	}

	// 	return true;
 	// }

	// mergeLocationData(locations, displayLocation) {
	// 	if (locations == null) return;
	// 	if (displayLocation == null) displayLocation = false;

	// 	for (let key in locations) {
	// 		var location = locations[key];
	// 		if (location.id == null) continue;

	// 		if ( !(location.id in this.locations)) {
	// 			this.locations[location.id] = uesp.gamemap.createLocationFromJson(location, this);
	// 		}
	// 		else {
	// 			this.locations[location.id].mergeFromJson(location);
	// 		}

	// 		if (displayLocation && !this.USE_CANVAS_DRAW) this.displayLocation(this.locations[location.id]);
	// 	}

	// 	if (displayLocation && this.USE_CANVAS_DRAW) this.redrawCanvas();
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


	// clearLocationElements()	{
	// 	for (let key in this.locations) {
	// 		this.locations[key].removeElements();
	// 	}
	// }

	// redrawLocations() {
	
	// 	let displayedLocations = {};

	// 	for (var key in this.locations) {
	// 		var location = this.locations[key];
	
	// 		if (location.worldID != this.currentWorldID) continue;
	// 		if (!location.visible && !this.isHiddenLocsShown()) continue;
	// 		if (location.displayLevel > this.zoomLevel || (this.isHiddenLocsShown() && this.zoomLevel == this.mapConfig.maxZoomLevel)) continue;
	// 		if (location.locType >= Constants.LOCTYPE_PATH) location.updatePathSize(false);
	
	// 		displayedLocations[key] = 1;
	// 		location.computeOffset();
	// 		location.updatePopupOffset();
	
	// 		if (location.locType >= Constants.LOCTYPE_PATH) location.updatePath();
	// 	}
	
	// 	for (var key in displayedLocations) {
	// 		var location = this.locations[key];
	// 		location.updateIcon();
	// 	}
	
	// 	for (var key in displayedLocations) {
	// 		var location = this.locations[key];
	// 		location.updateLabel();
	// 	}

	// 	for (var key in this.locations) {
	// 		var location = this.locations[key];

	// 		if (location.worldID != this.currentWorldID) continue;
	// 		if (!location.visible && !this.isHiddenLocsShown()) continue;
	// 		if (location.displayLevel > this.zoomLevel || (this.isHiddenLocsShown() && this.zoomLevel == this.mapConfig.maxZoomLevel)) continue;
	// 		if (location.locType >= Constants.LOCTYPE_PATH) location.updatePathSize(false);

	// 		this.displayLocation(location);
	// 	}
	// }

	// updateLocations(animate) {

	// 	this.updateLocationDisplayLevels();
	// 	this.updateLocationOffsets(animate);
	
	// 	this.redrawCanvas();
	// 	//this.redrawLocations();
	
	// 	this.retrieveLocations();
	// }

	// updateLocationDisplayLevels() {
	// 	for (let key in this.locations) {
	// 		if (this.zoomLevel < this.locations[key].displayLevel)
	// 			this.locations[key].hideElements(0);
	// 		else
	// 			this.locations[key].showElements(0);
	// 	}
	// }

	// updateLocationOffsets (animate) {
	// 	for (let key in this.locations) {

	// 		/*
	// 		tilePos = this.convertGameToTilePos(location.x, location.y);

	// 		mapOffset  = this.mapRoot.offset();
	// 		xPos = (tilePos.x - this.startTileX) * this.mapConfig.tileSize + mapOffset.left;
	// 		yPos = (tilePos.y - this.startTileY) * this.mapConfig.tileSize + mapOffset.top;

	// 		location.updateOffset(xPos, yPos, animate); */

	// 		locations[key].computeOffset();
	// 		locations[key].updateOffset();
	// 	}
	// }

	// setGamePosNoUpdate(x, y, zoom) {
	// 	var mapOffset = this.mapRoot.offset();

	// 	if (this.isValidZoom(zoom)) {
	// 		this.zoomLevel = zoom;
	// 	}

	// 	let tilePos = this.convertGameToTilePos(x, y);
	// 	tilePos.x -= this.mapConfig.numTilesX/2;
	// 	tilePos.y -= this.mapConfig.numTilesY/2;
	// 	print("setGamePos(): tilePos = ", x, y, tilePos.x, tilePos.y);

	// 	this.startTileX = Math.floor(tilePos.x);
	// 	this.startTileY = Math.floor(tilePos.y);
	// 	this.startTileCanvasX = this.startTileX;
	// 	this.startTileCanvasY = this.startTileY;
	// 	this.origStartTileCanvasX = this.startTileX;
	// 	this.origStartTileCanvasY = this.startTileY;
	// 	print("setGamePos(): startTile = " + this.startTileX + ", " + this.startTileY);

	// 	let newOffsetX = Math.round(mapOffset.left + this.mapRoot.width()/2  - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - tilePos.x) * this.mapConfig.tileSize);
	// 	let newOffsetY = Math.round(mapOffset.top  + this.mapRoot.height()/2 - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - tilePos.y) * this.mapConfig.tileSize);
	// 	print ("newOffset = " + newOffsetX + ", " + newOffsetY);

	// 	if (this.USE_CANVAS_DRAW) {
	// 		this.startTileX = 0;
	// 		this.startTileY = 0;

	// 		tilePos = this.convertGameToTilePos(x, y);

	// 		newOffsetX = Math.round(this.mapCanvas.width/2 - tilePos.x * this.mapConfig.tileSize);
	// 		newOffsetY = Math.round(this.mapCanvas.height/2 - tilePos.y * this.mapConfig.tileSize);
	// 		print("newOffsetCanvas = " + newOffsetX + ", " + newOffsetY, tilePos.x, tilePos.y);

	// 		this.resetTranslateCanvas();
	// 		this.translateCanvas(newOffsetX, newOffsetY);
	// 	} else {
	// 		this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
	// 	}
	// }

	// convertTileToGamePos(tileX, tileY) {

	// 	let maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);
	// 	let gameX = 0;
	// 	let gameY = 0;

	// 	gameX = Math.round(tileX / maxTiles * (this.mapConfig.maxX - this.mapConfig.minX) + this.mapConfig.minX);
	// 	gameY = Math.round(tileY / maxTiles * (this.mapConfig.maxY - this.mapConfig.minY) + this.mapConfig.minY);

	// 	return new Position(gameX, gameY);
	// }

	// convertGameToTilePos(gameX, gameY) {
	// 	let maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);
	// 	let tileX = 0;
	// 	let tileY = 0;

	// 	tileX = (gameX - this.mapConfig.minX) * maxTiles / (this.mapConfig.maxX - this.mapConfig.minX);
	// 	tileY = (gameY - this.mapConfig.minY) * maxTiles / (this.mapConfig.maxY - this.mapConfig.minY);

	// 	return new Position(tileX, tileY);
	// }

	// convertGameToPixelPos(gameX, gameY) {
	// 	let mapOffset = this.mapRoot.offset();
	// 	let tilePos = this.convertGameToTilePos(gameX, gameY);
	
	// 	let xPos = Math.round((tilePos.x - this.startTileX) * this.mapConfig.tileSize);
	// 	let yPos = Math.round((tilePos.y - this.startTileY) * this.mapConfig.tileSize);
	
	// 	return new Position(xPos, yPos);
	// }

	// getMapRootBounds() {
	// 	let leftTop     = this.convertTileToGamePos(this.startTileX, this.startTileY);
	// 	let rightBottom = this.convertTileToGamePos(this.startTileX + this.mapConfig.numTilesX, this.startTileY + this.mapConfig.numTilesY);

	// 	return new Bounds(leftTop.x, leftTop.y, rightBottom.x, rightBottom.y);
	// }
}

// uesp.gamemap.Map.prototype.clearLocations = function()
// {
// 	this.clearLocationElements();
// 	this.locations = {};
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

// uesp.gamemap.Map.prototype.clearMapCanvas = function()
// {
// 	this.mapContext.save();
// 	this.mapContext.setTransform(1, 0, 0, 1, 0, 0);

// 	let worldName = this.mapWorlds[this.currentWorldID].name;
// 	let canvasBGColor = this.mapConfig.canvasBGColor;
// 	if (this.mapConfig.canvasBGColorFunction !== null) canvasBGColor = this.mapConfig.canvasBGColorFunction(worldName, this.displayState);

// 	this.mapContext.fillStyle = canvasBGColor;
// 	this.mapContext.fillRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);

// 	this.mapContext.restore();


// 	this.mapContextGrid.save();
// 	this.mapContextGrid.setTransform(1, 0, 0, 1, 0, 0);

// 	this.mapContextGrid.clearRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);

// 	this.mapContextGrid.restore();
// }


// uesp.gamemap.Map.prototype.clearMapGrid = function()
// {
// 	if (!this.USE_CANVAS_DRAW) return;
// 	return this.clearMapGridCanvas();
// }

// uesp.gamemap.Map.prototype.displayLocation = function (location)
// {
// 	if (location.worldID != this.currentWorldID) return;
// 	if (!location.visible && !this.isHiddenLocsShown()) return;

// 	location.computeOffset();
// 	location.update();
// }



// uesp.gamemap.Map.prototype.getTilePositionOfCenter = function()
// {
// 	var gamePos = this.getGamePositionOfCenter();
// 	var tilePos = this.convertGameToTilePos(gamePos.x, gamePos.y);

// 	return tilePos;
// }

// uesp.gamemap.Map.prototype.getWorldMapState = function(world)
// {
// 	var worldID = this.getWorldIDFromWorld(world);
// 	if (worldID <= 0) return null;

// 	return this.mapWorlds[worldID].mapState;
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



// uesp.gamemap.Map.prototype.jumpToWorld = function (worldID)
// {
// 	if (worldID == null || worldID <= 0) return;
// 	this.changeWorld(worldID);
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
// 		uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Don't have data for destination location #" + destId + "!");
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

// 	this.setMapState(newState);

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
// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onAddLocationClick()", gamePos);

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

// uesp.gamemap.Map.prototype.onRightClick = function(event)
// {
// 	var self = event.data.self;

// 	//uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onRightClick");

// 	if (self.currentEditMode != '') return true;

// 		/* Don't zoom out if right click in popup */
// 	if ($(event.target).parents('.gmMapPopupRoot').length > 0) return true;

// 	event.preventDefault();
// 	self.onZoomOutWorld();
// 	return false;
// }



// uesp.gamemap.Map.prototype.onDblClickCanvas = function(event)
// {
// 	var self = event.data.self;

// 	if (!self.USE_CANVAS_DRAW) return false;

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onDblClickCanvas");

// 	var foundLoc = self.findLocationAt(event.pageX, event.pageY);

// 	if (foundLoc == null)
// 	{
// 		return self.onDoubleClick(event);
// 	}

// 	foundLoc.onLabelDblClick(event);
// }


// 	self.onMouseUp(event);
// }

// uesp.gamemap.Map.prototype.onDoubleClick = function(event)
// {
// 	var self = event.data.self;

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onDoubleClick");

// 	gamePos = self.convertWindowPixelToGamePos(event.pageX, event.pageY);

// 	self.panToGamePos(gamePos.x, gamePos.y);
// }



// uesp.gamemap.Map.prototype.onReceiveCenterOnLocationData = function (data)
// {
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Received centeron location data");
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, data);

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




// uesp.gamemap.Map.prototype.retrieveLocation = function(locId, onLoadFunction, eventData)
// {
// 	if (locId <= 0) return;

// 	var self = this;
// 	var queryParams = {};
// 	queryParams.action = "get_loc";
// 	queryParams.locid  = locId;
// 	queryParams.db = this.mapConfig.dbPrefix;

// 	if (this.isHiddenLocsShown()) queryParams.showhidden = 1;

// 	if (this.mapConfig.isOffline)
// 	{
// 		setTimeout(	function() { ugmLoadOfflineLocation(self, queryParams, onLoadFunction, eventData); }, 10);
// 	}
// 	else
// 	{
// 		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {
// 				self.onReceiveLocationData(data);
// 				if ( !(onLoadFunction == null) ) onLoadFunction.call(self, eventData, data);
// 			});
// 	}

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
// 	//if (queryParams.world <= 0) return uesp.logError("Unknown worldID " + this.currentWorldID + "!");

// 	if (this.mapConfig.isOffline)
// 	{
// 		setTimeout(	function() { ugmLoadOfflineCenterOnLocation(self, queryParams); }, 10);
// 	}
// 	else
// 	{
// 		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) { self.onReceiveCenterOnLocationData(data); });
// 	}

// }





// uesp.gamemap.Map.prototype.panToGamePos = function(x, y)
// {
// 		// TODO: Needs Canvas version
// 	if (this.USE_CANVAS_DRAW) return this.panToGamePosCanvas(x, y);

// 	var mapOffset = this.mapContainer.offset();

// 	var tilePos = this.convertGameToTilePos(x, y);
// 	tilePos.x -= this.mapConfig.numTilesX/2;
// 	tilePos.y -= this.mapConfig.numTilesY/2;

// 	var tileX = Math.floor(tilePos.x);
// 	var tileY = Math.floor(tilePos.y);

// 	var newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - tilePos.x) * this.mapConfig.tileSize);
// 	var newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - tilePos.y) * this.mapConfig.tileSize);

// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "newOffset = " + newOffsetX + ", " + newOffsetY);

// 	var self = this;

// 	this.mapRoot.animate({ left: newOffsetX, top: newOffsetY}, {
// 				complete: function() {
// 					self.checkTileEdges();
// 					self.loadMapTiles();
// 					self.updateLocations();
// 				}
// 			});
// }


// uesp.gamemap.Map.prototype.panToGamePosCanvas = function(x, y)
// {
// 	var mapOffset = this.mapContainer.offset();
// 	var pixelPos = this.convertGameToPixelPos(x, y);
// 	var tilePos = this.convertGameToTilePos(x, y);

// 	tilePos.x -= this.mapConfig.numTilesX/2;
// 	tilePos.y -= this.mapConfig.numTilesY/2;

// 	var tileX = Math.floor(tilePos.x);
// 	var tileY = Math.floor(tilePos.y);

// 	var newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - tilePos.x) * this.mapConfig.tileSize);
// 	var newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - tilePos.y) * this.mapConfig.tileSize);

// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "newOffset = " + newOffsetX + ", " + newOffsetY);

// 	this.resetTranslateCanvas();
// 	this.translateCanvas(newOffsetX, newOffsetY);
// 	this.redrawCanvas(true);
// }

// uesp.gamemap.Map.prototype.setMapOptions = function (world, mapOptions)
// {
// 	var worldID = this.getWorldIDFromWorld(world);
// 	if ( !(worldID in this.mapWorlds) ) return uesp.logError("Unknown world #" + worldID + " received!");

// 	this.mapWorlds[worldID].mergeMapOptions(mapOptions);

// 	if (this.currentWorldID == worldID) this.mapConfig.mergeOptions(mapOptions);
// }

// uesp.gamemap.Map.prototype.setGameZoom = function(zoom)
// {
// 	var newTileX = 0;
// 	var newTileY = 0;

// 	if (!this.isValidZoom(zoom)) return;

// 	var curGamePos = this.getGamePositionOfCenter();
// 	var curTilePos = this.convertGameToTilePos(curGamePos.x, curGamePos.y);
// 	var mapOffset = this.mapContainer.offset();
// 	var zoomSize = Math.pow(2, zoom - this.zoomLevel);

// 	newTileX = curTilePos.x * zoomSize - this.mapConfig.numTilesX/2;
// 	newTileY = curTilePos.y * zoomSize - this.mapConfig.numTilesY/2;

// 	this.zoomLevel = zoom;

// 	this.startTileX = Math.floor(newTileX);
// 	this.startTileY = Math.floor(newTileY);
// 	this.startTileCanvasX = this.startTileX;
// 	this.startTileCanvasY = this.startTileY;
// 	this.origStartTileCanvasX = this.startTileX;
// 	this.origStartTileCanvasY = this.startTileY;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "setGameZoom(): startTile = " + this.startTileX + ", " + this.startTileY);

// 	newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - newTileX) * this.mapConfig.tileSize);
// 	newOffsetY = Math.round(LOG_LEVEL_INFO.top  + this.mapContainer.height()/2 - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - newTileY) * this.mapConfig.tileSize);
// 	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);

// 	if (this.USE_CANVAS_DRAW)
// 	{
// 		this.startTileX = 0;
// 		this.startTileY = 0;

// 		newOffsetX = -Math.round(this.mapCanvas.width/2  - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - tilePos.x) * this.mapConfig.tileSize);
// 		newOffsetY = -Math.round(this.mapCanvas.height/2 - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - tilePos.y) * this.mapConfig.tileSize);
// 		uesp.logDebug(uesp.LOG_LEVEL_INFO, "newOffsetCanvas = " + newOffsetX + ", " + newOffsetY);

// 		this.resetTranslateCanvas();
// 		this.translateCanvas(newOffsetX, newOffsetY);
// 	}
// 	else
// 	{
// 		this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
// 	}

// 	this.updateLocations();
// 	this.loadMapTiles();
// }

// uesp.gamemap.Map.prototype.shiftLocations = function (deltaX, deltaY)
// {
// 	var shiftX = deltaX * this.mapConfig.tileSize;
// 	var shiftY = deltaY * this.mapConfig.tileSize;

// 	for (key in this.locations)
// 	{
// 		this.locations[key].shiftElements(shiftX, shiftY);
// 	}
// }

// uesp.gamemap.Map.prototype.redrawLocationPaths = function()
// {
// 	for (key in this.locations)
// 	{
// 		if (this.locations[key].locType >= Constants.LOCTYPE_PATH) this.locations[key].updatePathSize();
// 	}
// }


// uesp.gamemap.Map.prototype.updateMap = function()
// {
// 	this.updateLocations();
// 	this.loadMapTiles();
// }

// uesp.gamemap.Map.prototype.updateZoomControlButtons = function(newZoomLevel)
// {
// 	var isMaxZoom = newZoomLevel >= this.mapConfig.maxZoomLevel;
// 	var isMinZoom = newZoomLevel <= this.mapConfig.minZoomLevel;

// 	if (isMaxZoom)
// 	{
// 		this.mapControlZoomIn.removeClass('gmMapControlZoomHover');
// 		this.mapControlZoomIn.addClass('gmMapControlZoomDisable');
// 	}
// 	else
// 	{
// 		this.mapControlZoomIn.addClass('gmMapControlZoomHover');
// 		this.mapControlZoomIn.removeClass('gmMapControlZoomDisable');
// 	}

// 	if (isMinZoom)
// 	{
// 		this.mapControlZoomOut.removeClass('gmMapControlZoomHover');
// 		this.mapControlZoomOut.addClass('gmMapControlZoomDisable');
// 	}
// 	else
// 	{
// 		this.mapControlZoomOut.addClass('gmMapControlZoomHover');
// 		this.mapControlZoomOut.removeClass('gmMapControlZoomDisable');
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
// 	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Received onSavedWorld data");
// 	uesp.logDebug(uesp.LOG_LEVEL_WARNING, data);

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


// uesp.gamemap.Map.prototype.hideWorldEditForm = function()
// {
// 	if (this.worldEditPopup != null) this.worldEditPopup.hide();
// }


// uesp.gamemap.Map.prototype.setEditClickWallBackground = function(background)
// {
// 	this.editClickWall.css('background', background);
// }



// uesp.gamemap.Map.prototype.onZoomOutWorld = function()
// {
// 	if ( !(this.currentWorldID in this.mapWorlds)) return false;

// 	world = this.mapWorlds[this.currentWorldID];
// 	if (world.parentId <= 0) return false;

// 	this.changeWorld(world.parentId);
// 	return true;
// }


// uesp.gamemap.Map.prototype.setUserEvents = function(userEvents)
// {
// 	if (userEvents == null) return;
// 	uesp.mergeObjects(this.userEvents, userEvents);
// }


// uesp.gamemap.Map.prototype.setEventsForMapGroupList = function ()
// {
// 	var self = this;

// 	$("#gmMapList li").bind("touchstart click", function(e) {
// 		if ($(this).hasClass('gmMapListHeader')) return false;
// 		if (self.mapListLastSelectedItem != null) self.mapListLastSelectedItem.removeClass('gmMapListSelect');
// 		$(this).addClass('gmMapListSelect');
// 		self.mapListLastSelectedItem = $(this);

// 		worldName = $(this).text();
// 		g_GameMap.changeWorld(worldName);

// 		self.hideMapList();
// 		return false;
// 	});

// 	$("#gmMapList li.gmMapListHeader").bind("touchstart click", function(e) {
// 		childList = $(this).next('ul');

// 		if (childList)
// 		{
// 			visible = !childList.is(':visible');
// 			childList.slideToggle(200);

// 			if (visible)
// 				$(this).css('background-image', 'url(images/uparrow.gif)');
// 			else
// 				$(this).css('background-image', 'url(images/downarrow.gif)');
// 		}

// 		return false;
// 	});

// 	$(document).bind("mousedown", function (e) {
// 		var container = $("#gmMapListRoot");

// 		if (!container.is(e.target) && container.has(e.target).length === 0)
// 		{
// 			self.hideMapList();
// 		}
// 	});

// }


// uesp.gamemap.Map.prototype.FindMapLocTypeString = function (locTypeString)
// {
// 	var checkTypeString = locTypeString.trim().toLowerCase();

// 	if (this.mapOptions == null || this.mapConfig.iconTypeMap == null || checkTypeString == "") return null;

// 	for (locType in this.mapConfig.iconTypeMap)
// 	{
// 		if (checkTypeString === this.mapConfig.iconTypeMap[locType].toLowerCase()) return locType;
// 	}

// 	return null;

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
// 		uesp.logDebug(uesp.LOG_LEVEL_WARNING, 'Received help block contents!', data);
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


// uesp.gamemap.Map.prototype.hideHelpBlock = function()
// {
// 	if (this.currentEditMode == 'showhelpblock')
// 	{
// 		this.currentEditMode = '';
// 		this.removeEditClickWall();
// 	}

// 	if (this.helpBlockElement != null) this.helpBlockElement.hide();
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


// uesp.gamemap.Map.prototype.hideMapKey = function()
// {
// 	if (this.currentEditMode == 'showmapkey')
// 	{
// 		this.currentEditMode = '';
// 		this.removeEditClickWall();
// 	}

// 	if (this.mapKeyElement != null) this.mapKeyElement.hide();
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


// uesp.gamemap.Map.prototype.clearRecentChanges = function ()
// {
// 	this.recentChangesRoot.text("");
// }
