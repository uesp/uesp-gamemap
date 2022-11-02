/**
 * @name gamemap.js
 * @author Dave Humphrey <dave@uesp.net> (21st Jan 2014)
 * @summary The main source code for the interactive gamemap.
 */

import * as Utils from "../common/utils.js";
import * as Constants from "../common/constants.js";
import World from "./world.js";
import MapState from "./mapstate.js";
import Location from "./location.js";
import Point from "./point.js";
import RasterCoords from "../lib/rastercoords.js";

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
	constructor(mapRootID, mapConfig, mapCallbacks) {
		if (mapRootID != null && mapConfig != null && mapCallbacks != null) {

			// load in map config
			this.mapConfig = mapConfig;

			// set up map callbacks
			this.mapCallbacks = mapCallbacks;

			// set up the root map element
			this.rootMapID = mapRootID;
			if ($('#'+mapRootID) == null) {
				throw new Error('The gamemap container \'' + mapRootID + '\' could not be found or was invalid.');
			}
			self = this;

			$("#"+mapRootID).css("background-color", mapConfig.bgColour);

			// set the default map info
			this.mapWorlds = {};

			// check user editing permission
			this.checkPermissions();

			// get world data for this mapConfig
			this.getWorlds(mapConfig);

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
			// zoom options:
			zoomSnap: mapConfig.enableZoomSnap,
			zoomDelta: mapConfig.zoomStep,
			zoomControl: false, // hide leaflet zoom control (we have our own)
			boxZoom: false, // disable box zoom
			doubleClickZoom: false, // disable double click to zoom
			scrollWheelZoom: false, // disable original zoom function
			smoothWheelZoom: true,  // enable smooth zoom
  			smoothSensitivity: 0.7, // zoom speed. default is 1
        }

		map = L.map(this.rootMapID, mapOptions);
		this.setupInfobar(mapConfig);

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

		// remove previous tiles
		if (tileLayer != null) {
			tileLayer.remove();
			this.clearLocations();
		}

		// set full image width & height
		let mapImageDimens = this.getMapImageDimensions(mapState.world);
		this.mapImage = {
			width : mapImageDimens.width,  // original width of image
			height: mapImageDimens.height, // original height of image
		}

		// calculate raster coords
		RC = new RasterCoords(map, this.mapImage)

		// default tilelayer options
		let tileOptions = {
			noWrap: true,
			bounds: RC.getMaxBounds(),
			errorTileUrl: mapState.world.missingMapTilePath,
			minZoom: mapState.world.minZoomLevel,
			maxZoom: mapState.world.maxZoomLevel,
			edgeBufferTiles: this.mapConfig.numEdgeBufferTiles,
		}

		// set map tile layer
		if (Utils.isFirefox()){ // use HTML-based rendering on firefox
			tileLayer = L.tileLayer(this.getMapTileImageURL(mapState.world, this.mapConfig), tileOptions);
		} else { // use canvas based tile rendering on everything else
			tileLayer = L.tileLayer.canvas(this.getMapTileImageURL(mapState.world, this.mapConfig), tileOptions);
		}
		tileLayer.addTo(map);

		// set map view
		map.setView(this.toLatLng(mapState.coords), mapState.zoomLevel, {animate: true});

		// update world
		this.currentWorldID = mapState.world.id;
		if (this.mapCallbacks != null) {
			this.mapCallbacks.onWorldChanged(this.mapWorlds[this.currentWorldID])
		}

		// get/set locations
		if (mapState.world.locations == null) {
			// get locations for this map
			this.getLocations(mapState.world.id);
		} else {
			//redraw locations from cache
			this.redrawLocations(mapState.world.locations);
		}

		// remove map bounds to fix RC bug
		map.setMaxBounds(null);

		// finally, update map state
		this.updateMapState(mapState);
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
		}

		if (Utils.getURLParams().has("cellresource")) {
			mapState.cellResource = Utils.getURLParams().get("cellresource");
		}

		return mapState;
	}

	updateMapState(mapState) {

		let newMapState;

		if (mapState == null) {
			newMapState = this.getMapState();
		} else {
			newMapState = mapState;
		}

		// update map state
		newMapState.coords = [this.toCoords(map.getCenter()).x, this.toCoords(map.getCenter()).y]
		newMapState.zoomLevel = parseFloat(map.getZoom().toFixed(3));
		newMapState.world = this.getWorldFromID(this.getCurrentWorldID());
		this.currentMapState = newMapState;

		// update url
		let mapLink = "?"

		if (this.hasMultipleWorlds()){
			mapLink += 'world=' + newMapState.world.id;
		}

		mapLink += '&x=' + newMapState.coords[0];
		mapLink += '&y=' + newMapState.coords[1];
		mapLink += '&zoom=' + newMapState.zoomLevel;

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
		return this.currentWorldID || this.mapConfig.defaultWorldID;
	}

	getCurrentWorld(){
		return this.getWorldFromID(this.getCurrentWorldID());
	}

	/** Gets the world object associated to a given worldID.
	 * @param {int} worldID - ID that represents a world in the database.
	 * @returns {Object} world - A world object that contains map info for the gamemap.
	 */
	getWorldFromID(worldID) {
		return this.mapWorlds[worldID] || null;
	}

	getWorldNameFromID(worldID) {
		if (this.getWorldFromID(worldID) != null) return this.getWorldFromID(worldID).name; else return "null";
	}

	getWorldDisplayNameFromID(worldID) {

		if (this.getWorldFromID(worldID) == null) {
			return "null";
		} else {
			return this.getWorldFromID(worldID).displayName || "null";
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

					self.mapWorlds[world.id] = new World(world, mapConfig);
					mapWorldNameIndex[world.name] = world.id;

					if (world.displayName != null) {
						mapWorldDisplayNameIndex[world.displayName] = world.id;
					} else {
						mapWorldDisplayNameIndex[world.name] = world.id;
					}

					//self.worlds[world.id].mergeFromJson(world);

				}
			}
			if (self.mapCallbacks != null) {
				self.mapCallbacks.onWorldsLoaded(self.mapWorlds);

				// load map
				self.initialiseMap(mapConfig);

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

	gotoWorld(worldID, coords) {
		$("#map_loading_bar").show();
		this.clearLocations();
		if (this.isWorldValid(worldID)) {
			log("Going to world... " + worldID);
			log(this.getWorldFromID(worldID));

			let mapState = new MapState();
			mapState.zoomLevel = this.mapConfig.defaultZoomLevel;

			if (coords == null) {
				mapState.coords = [this.mapConfig.defaultXPos, this.mapConfig.defaultYPos];
			}

			mapState.world = this.getWorldFromID(worldID);

			this.setMapState(mapState);
		} else {
			throw new Error('Gamemap attempted to navigate to invalid world ID: ' + worldID);
		}
	}

	/*================================================
						Locations
	================================================*/

	getLocations(world) {

		// check if we've been sent a world ID
		if (world != null && !isNaN(world)){
			if (this.isWorldValid(world)) {
				world = this.getWorldFromID(world);
			}
		}

		// make sure we're being given a valid world state
		if (world == null || world.id == null || world.id < 0 ) {
			log(world)
			return;
		}

		// generate api query
		var queryParams = {};
		queryParams.action = "get_locs";
		queryParams.world  = world.id;
		queryParams.db = this.mapConfig.database;
		if (this.isHiddenLocsShown()) { queryParams.showhidden = 1; }

		// make api query
		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {

			if (data.isError == null && data.locations != null) {
				log("Got " + data.locationCount + " locations!");
				let locations = data.locations
				//log(locations); // server side locations
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
				log("There was an error getting locations for this world.")
			}
		});
	}

	getLocation(locationID, onLoadFunction) {
		if (locationID > 0) {
			let queryParams = {};
			queryParams.action = "get_loc";
			queryParams.locid  = locationID;
			queryParams.db = this.mapConfig.dbPrefix;
			if (this.isHiddenLocsShown()) { queryParams.showhidden = 1; }


			$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {

				log("Getting info for locationID: "+ locationID);
				if (!data.isError && data != null && data.locations[0] != null) {
					log("Got location info!");
					log(data);
					if (!(onLoadFunction == null) ) {
						onLoadFunction.call(location, data);
					}
					} else {
						log("LocationID " + locationID + " was invalid.");
					}

			});

		}
	}

	clearLocations() {
		if (this.markerLayer != null) {
			this.markerLayer.clearLayers();
			this.markerLayer.remove();
		}

		map.eachLayer((layer) => {
			if (layer._tiles == null) { //remove anything that is not a tile
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
				//log("should be getting removed");
				marker.remove();
			}

			marker._wasVisible = isVisible;

		}

	}


	redrawLocations(locations) {

		log(locations);
		// delete any existing location layers
		this.clearLocations();

		// set up location layer for each zoom level
		log("Setting up location markers...")
		let locationMarkers = [];

		// check if current map has any locations
		if (Object.keys(locations).length > 0) {

			log("Loading locations...");

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
		log("Adding location markers to map...")
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
			iconUrl: "assets/icons/transparent.png",
		});

		// create specific marker type
		if (location.isPolygon()) { // is location polygonal? (polyline or polygon)

			let options = {
				noClip: true,
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
				log(location);
				marker = new L.polyline(coords, options);
				log(marker);
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


	getLocationLabel(location){
		return {
			className : "location-label",
			permanent: true,
			direction: location.labelDirection,
		}
	}

	/*================================================
						  Utility
	================================================*/

	/**
	 * Gets width and height of the full map image.
	 * @param world -
	 * @returns mapImageDimens - The width/height of the map image as an object
	 * @example log(getMapImageDimensions().width);
	 */
	getMapImageDimensions(world) {

		let dimens = {};
		let width = null;
		let height = null;

		// check if actual map image dimensions (not tile dimensions) are provided
		if (this.mapConfig.fullWidth != null && this.mapConfig.fullHeight != null) {
			width = this.mapConfig.fullWidth;
			height = this.mapConfig.fullHeight;
		} else if (world.numTilesX == world.numTilesY) { // if the map is a square (1:1)
			// then calculate the image dimensions as the size of the whole grid
			width = world.numTilesX * this.mapConfig.tileSize;
			height = world.numTilesY * this.mapConfig.tileSize;
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

		var coords;

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

				let x = (coords.x * this.mapImage.width);
				let y = (coords.y * this.mapImage.height);
				let point = new Point(x, y);

				latLng = RC.unproject(point);
			} else {
				latLng = RC.unproject(coords);
			}
		}

		// are we being given an array of coords?
		if (coords[0] != null && coords.length == 2) {

			let tempCoords = coords;

			// are we using a normalised coordinate scheme?
			if (this.mapConfig.coordType == Constants.COORD_TYPES.NORMALISED) {

				// multiply the normalised coords by the map image dimensions
				// to get the XY coordinates
				tempCoords[0] = (tempCoords[0] * this.mapImage.width);
				tempCoords[1] = (tempCoords[1] * this.mapImage.height);
			}

			latLng = RC.unproject(tempCoords);
		}
		return latLng;
	}


	/*================================================
						  Events
	================================================*/

	bindMapEvents() {

		map.on('resize moveend zoomend', function() {
			self.updateMapState();
			self.hideMenus();
			self.clearTooltips();
		});

		map.on("mousedown", function(e){
			self.hideMenus();
		})

		map.on("contextmenu", function(e){
			if (self.getMapState().world.parentID != null && self.getMapState().world.parentID != -1 ) {
				let parentID = self.getMapState().world.parentID;
				self.gotoWorld(parentID);
			}
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
			map.panTo(event.latlng, {animate: true});
		})

	}

	onMarkerClicked(marker, shift, ctrl) {

		function openPopup(marker, isEdit) {

			let latlng;

			try {
				latlng = marker.getCenter();
			} catch (e) {
				latlng = marker.getLatLng();
			}

			if (!isEdit){
				log("making popup");
				L.popup(latlng, {content: marker.location.getPopupContent() }).openOn(map);
			} else {
				M.toast({text: "TODO: Location editing not done yet."});
			}

		}

		let isJumpTo = marker.location != null && marker.location.isClickable();

		if (isJumpTo && !shift && !ctrl) { // is location a link to a worldspace/location

			let location = marker.location;
			if (location != null){
				if (location.destinationID < 0) { // is location destination a worldID
					this.gotoWorld((location.destinationID+"").slice(1));
				} else { // it is a location ID
					function onGetLocation(data) {
						self.gotoWorld(data.locations[0].worldId);
					}
					this.getLocation(location.destinationID, onGetLocation);
				}
			}
		} else {
			if (shift) { // if shift pressed, and can edit, show edit menu
				openPopup(marker, self.isMapEditingEnabled());
			}
		}

		// if normally clicked or pressing ctrl, show popup
		if (!shift || ctrl ) {

			if (isJumpTo && !ctrl){
				// do nothing
			} else {
				openPopup(marker);
			}

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

			} else {
				marker.remove();
				marker.off('resize move zoom');
			}

			if (location.displayLevel > map.getZoom()) {
				marker.remove();
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

	zoomIn(){
		map.zoomIn();
	}

	zoomOut(){
		map.zoomOut();
	}

	hideMenus(){
		if (this.mapCallbacks != null) {
			this.mapCallbacks.hideMenus();
		}
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

	// check if user has editing permissions
	checkPermissions() {

		loading("permissions");

		let queryParams = {};
		let self = this;
		queryParams.action = "get_perm";
		queryParams.db = this.mapConfig.database;

		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {

			if (data.canEdit != null) {
				self.mapConfig.editingEnabled = data.canEdit;
			}

			if (self.mapCallbacks != null) {
				self.mapCallbacks.onPermissionsLoaded(self.isMapEditingEnabled());
			}

		});

	}

	// tileX, tileY, zoom, world
	getMapTileImageURL(world, mapConfig) {

		// http://mavvo.altervista.org/dofus/tiles/{z}/{x}/{y}.png
		// https://maps.uesp.net/esomap/tamriel/zoom11/tamriel-0-2.jpg

		if (mapConfig.database == "eso") { // unique stuff for eso
			return mapConfig.tileURL + world.name + "/leaflet/zoom{z}/" + world.name + "-{x}-" + "{y}" + ".jpg";
		} else {
			if (world == null) {
				return "zoom{z}/maptile-{x}-{y}.jpg";
			} else {
				return world + "zoom{z}/maptile-{x}-{y}.jpg";
			}
		}
	}

	getCurrentZoom() {
		return map.getZoom();
	}
}














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
