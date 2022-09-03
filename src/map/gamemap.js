/**
 * @name gamemap.js
 * @author Dave Humphrey <dave@uesp.net> (21st Jan 2014)
 * @summary The main source code for the interactive gamemap.
 */

import * as Utils from "../common/utils.js";
import * as Constants from "../common/constants.js";
import World from "./world.js";
import MapState from "./mapState.js";
import MapTile from "./mapTile.js";
import Position from "./mapPosition.js";
import Bounds from "./bounds.js";

/*================================================
				Gamemap constructor
================================================*/

export default class Gamemap {

	// class constructor
	constructor(mapContainerID, mapConfig, mapCallbacks) {

		// load in map config
		this.mapConfig = mapConfig;
	
		// set up map callbacks
		this.mapCallbacks = mapCallbacks;

		// set up important constants
		this.USE_CANVAS_DRAW = this.mapConfig.useCanvasDraw;
		this.PAN_AMOUNT = this.mapConfig.tileSize / 2;
	
		// set up the root map element
		this.mapContainer = $('#' + mapContainerID);
		if (this.mapContainer == null) {
			print('The gamemap container \'' + mapContainerID + '\' was not found!');
		} 

		// set up map world arrays
		this.mapWorlds = {};
		this.mapWorldNameIndex = {};
		this.mapWorldDisplayNameIndex = {};
	
		// set the default map info 	
		// TODO: figure out which of these are redundant
		this.locations = {};
		this.startTileX = 0;
		this.startTileY = 0;
		this.startTileCanvasX = 0;
		this.startTileCanvasY = 0;
		this.origStartTileCanvasX = 0;
		this.origStartTileCanvasY = 0;
		this.draggingObject = null;
		this.dragStartLeft = 0;
		this.dragStartTop  = 0;
		this.dragStartLeftCanvas = 0;
		this.dragStartTopCanvas  = 0;
		this.dragStartEventX = 0;
		this.dragStartEventY = 0;
		this.mapRoot = null;
		this.mapCanvas = null;
		this.mapCanvasGrid = null;
		this.mapCanvasElement = null;
		this.mapCanvasGridElement = null;
		this.mapContext = null;
		this.mapContextGrid = null;
		this.mapListContainer = null;
		this.mapListLastSelectedItem = null;
		this.lastCanvasHoverLocation = null;

		this.mapKeyNumColumns = 8;
		this.showPopupOnLoadLocationId = -1;
		this.mapTransformX = 0;
		this.mapTransformY = 0;
		this.canvasLastDragX = 0;
		this.canvasLastDragY = 0;
		this.canvasImages = [];
		this.canvasImageMap = {};
		this.canvasTileCountX = 0;
		this.canvasTileCountY = 0;
		this.lastCanvasRedrawRequest = 0;
		this.lastPinchDistance = 0;
		this.cellResource = "";
		this.loadedCellResource = "";
		this.cellResourceData = {};
		this.worldGroupListContents = '';
		this.helpBlockContents = '';
		this.mapTiles = [];
		this.displayState = "";
		this.currentWorldID = 0;
		this.addWorld('__default', this.mapConfig, this.currentWorldID, '');
		this.zoomLevel = this.mapConfig.initialZoom;
	
		// set editing to false by default
		this.editingEnabled = false;

		// set up state bools
		this.defaultShowHidden = false;
		this.jumpToDestinationOnClick = true;
		this.openPopupOnJump = false;
		this.isShowingRecentChanges = false;
		this.checkTilesOnDrag = true;
		this.isDrawGrid = false;
		this.isDragging = false;
		this.isPinching = false;

		// check user editing permission
		this.checkPermissions();

		if (Utils.getURLParams().get("centeron")) {
			this.retrieveCenterOnLocation(Utils.getURLParams().get("world"), Utils.getURLParams().get("centeron"));
		}

		// start building map
		this.getWorldData();
		this.createMapRoot()
		this.createEvents();
	
		this.setGamePosNoUpdate(this.mapConfig.xPos, this.mapConfig.yPos, this.mapConfig.zoomLevel);
		this.updateMapStateFromQuery(false);
	}

	/*================================================
					General functions
	================================================*/

	isHiddenLocsShown() {
		if (Utils.getURLParams().get("showHidden") === "true") {
			return true;
		} else {
			return this.defaultShowHidden;
		}
		
	}
	
	hasCentreOnParam(){
		return Utils.getURLParams().get("centreOn") != null && Utils.getURLParams().get("centreOn") !== '';
	}

	onDocReady() {

		if (this.USE_CANVAS_DRAW) {
			let event = {};
			event.data = {};
			event.data.self = this;

			this.onResize(event);
			this.redrawCanvas(true);
		}
	
	}

	/*================================================
						Map state
	================================================*/

	getMapState() {
		let mapState = new MapState();

		mapState.zoomLevel    = this.zoomLevel;
		mapState.gamePos      = this.getGamePositionOfCenter();
		mapState.worldID      = this.currentWorldID;
		mapState.grid         = this.isDrawGrid;
		mapState.cellResource = this.cellResource;
		mapState.displayState = this.displayState;

		return mapState;
	}

	setMapState (newState, updateMap) {
		if (newState == null) return;
		if (updateMap == null) updateMap = true;

		this.isDrawGrid = newState.grid;
		this.cellResource = newState.cellResource;
		this.displayState = newState.displayState;

		if (this.currentWorldID != newState.worldID) {
			this.changeWorld(newState.worldID, newState, updateMap);
		} else {
			this.setGamePos(newState.gamePos.x, newState.gamePos.y, newState.zoomLevel, updateMap);
		}

	}

	getMapStateFromQuery(defaultMapState) {
		var gamePos = this.getGamePositionOfCenter();
		var gameX   = gamePos.x;
		var gameY   = gamePos.y;
		var zoom    = this.zoomLevel;
		var worldID = this.currentWorldID;
		var grid    = this.isDrawGrid;
		var cellResource = this.cellResource;
		var displayState = this.displayState;

		if ( !(defaultMapState == null) ) {
			gameX   = defaultMapState.gamePos.x;
			gameY   = defaultMapState.gamePos.y;
			zoom    = defaultMapState.zoomLevel;
			worldID = defaultMapState.worldID;
			grid    = defaultMapState.grid;
			cellResource = defaultMapState.cellResource;
			displayState = defaultMapState.displayState;
		}

		if (Utils.getURLParams().get("x") != null && Utils.getURLParams().get("y") != null) {
			gameX = parseInt(Utils.getURLParams().get("x"));
			gameY = parseInt(Utils.getURLParams().get("y"));
			if (Utils.getURLParams().get("zoom") == null) zoom = 15;
		}

		if (Utils.getURLParams().get("zoom") != null) zoom = parseInt(Utils.getURLParams().get("zoom"));

		if ( ! (Utils.getURLParams().get("world") == null)) {
			worldID = this.getWorldIDFromWorld(Utils.getURLParams().get("world"));
		}

		if ( !(Utils.getURLParams().get("world") == null)) {
			worldID = this.getWorldIDFromWorld(Utils.getURLParams().get("world"));
		}

		if ( !(Utils.getURLParams().get("grid") == null)) {
			if (Utils.getURLParams().get("grid") == "true")
				grid = true;
			else if (Utils.getURLParams().get("grid") == "false")
				grid = false;
		}

		if ( ! (Utils.getURLParams().get("cellResource") == null)) {
			cellResource = Utils.getURLParams().get("cellResource");
		}

		if ( ! (Utils.getURLParams().get("displayState") == null)) {
			displayState = Utils.getURLParams().get("displayState");
		}

		var newState = new MapState();

		newState.gamePos.x = gameX;
		newState.gamePos.y = gameY;
		newState.zoomLevel = zoom;
		newState.worldID   = worldID;
		newState.grid      = grid;
		newState.cellResource = cellResource;
		newState.displayState = displayState;

		return newState;
	}

	updateMapStateFromQuery(updateMap) {
		let newState = this.getMapStateFromQuery();
		this.setMapState(newState, updateMap);
	}

	/*================================================
						Map worlds
	================================================*/

	addWorld(worldName, mapConfig, worldID, displayName) {
		this.mapWorlds[worldID] = new World(worldName.toLowerCase(), this.mapConfig, worldID);
		this.mapWorlds[worldID].mergeMapConfig(mapConfig);
	
		this.mapWorldNameIndex[worldName.toLowerCase()] = worldID;
		if (displayName != null) this.mapWorldDisplayNameIndex[displayName] = worldID;
	}

	hasWorld(worldID) {
		return worldID in this.mapWorlds;
	}

	getWorldData() {
		let self = this;
		let queryParams = {};
		queryParams.action = "get_worlds";
		queryParams.db = this.mapConfig.database;
		if (this.isHiddenLocsShown()) {
			queryParams.showhidden = 1;
		} 

		loading("world");
	
		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {
			if (data.isError) {
				print("Error retrieving world data!" + errorMsg);
				return;
			} else {
				if (data.worlds == null) {
					print ("World data not found in JSON response!" + data);
					return;
				}
			}
	
			self.mergeWorldData(data.worlds);
		});
	}

	mergeWorldData(worlds) {

		if (worlds == null) {
			return;
		}

		for (var key in worlds) {
			var world = worlds[key];

			if (world.id < this.mapConfig.minValidworldID) continue;
			if (world.id > this.mapConfig.maxValidworldID) continue;

			if ((world.name) == null) continue;

			if (world.id in this.mapWorlds) {
				this.mapWorlds[world.id] = Utils.mergeObjects(this.mapWorlds[world.id], world);
				this.mapWorldNameIndex[world.name] = world.id;
				this.mapWorldDisplayNameIndex[world.displayName] = world.id;
			}
			else {
				this.addWorld(world.name, this.mapConfig, world.id, world.displayName);
				this.mapWorlds[world.id] = Utils.mergeObjects(this.mapWorlds[world.id], world);
				this.mapWorldNameIndex[world.name] = world.id;
				this.mapWorldDisplayNameIndex[world.displayName] = world.id;
			}
		}

		if (this.mapCallbacks != null) {
			this.mapCallbacks.onWorldsLoaded(this.mapWorlds);
		}
	}

	changeWorld(world, newState) {
		let worldID = this.getWorldIDFromWorld(world);
		if (worldID == this.currentWorldID) {
			// do nothing
			return;
		} 

		if (worldID <= 0) {
			print("Unknown world #" + worldID + " received!");
			return ;
		} 

		if (this.currentWorldID in this.mapWorlds) {
			this.mapWorlds[this.currentWorldID].mapState   = this.getMapState();
			this.mapWorlds[this.currentWorldID].mapConfig = this.mapConfig;
		}

		if (! (worldID in this.mapWorlds)){
			print("Unknown world ID " + worldID + "!");
			return;
		}  

		this.clearLocationElements();

		this.currentWorldID = worldID;
		this.mapConfig = this.mapWorlds[this.currentWorldID].mapConfig;

		if (newState == null) {
			this.setMapState(this.mapWorlds[this.currentWorldID].mapState);
		} else {
			this.setMapState(newState);
		}

		//callback to notify world changed
		if (this.mapCallbacks != null) {
			this.mapCallbacks.onWorldChanged(this.mapWorlds[this.currentWorldID])
		}
	
	}

	/*================================================
					  Map locations 
	================================================*/

	retrieveLocations() {
		var self = this;
		var mapBounds = this.getMapBounds();

		var queryParams = {};
		queryParams.action = "get_locs";
		queryParams.world  = this.currentWorldID;
		queryParams.top    = mapBounds.top;
		queryParams.bottom = mapBounds.bottom;
		queryParams.left   = mapBounds.left;
		queryParams.right  = mapBounds.right;
		queryParams.zoom   = this.zoomLevel;
		if (this.isHiddenLocsShown()) queryParams.showhidden = 1;
		if (!this.hasWorld(this.currentWorldID)) queryParams.incworld = 1;
		queryParams.db = this.mapConfig.database;

		if (queryParams.world <= 0) return print("Unknown worldID for current world " + this.currentWorldID + "!");

		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) { self.onReceiveLocationData(data); });
	
	}

	onReceiveLocationData(data) {
		print("Received location data");
		print(data);

		if (data.isError != null)  return print("Error retrieving location data!", data.errorMsg);
		if (data.locations == null) return print("Location data not found in JSON response!", data);

		this.mergeLocationData(data.locations, true);

		if (this.showPopupOnLoadLocationId > 0 && this.locations[this.showPopupOnLoadLocationId] != null) {
			this.locations[this.showPopupOnLoadLocationId].showPopup();
			this.showPopupOnLoadLocationId = -1;
		}

		return true;
 	}

	mergeLocationData(locations, displayLocation) {
		if (locations == null) return;
		if (displayLocation == null) displayLocation = false;

		for (let key in locations) {
			var location = locations[key];
			if (location.id == null) continue;

			if ( !(location.id in this.locations)) {
				this.locations[location.id] = uesp.gamemap.createLocationFromJson(location, this);
			}
			else {
				this.locations[location.id].mergeFromJson(location);
			}

			if (displayLocation && !this.USE_CANVAS_DRAW) this.displayLocation(this.locations[location.id]);
		}

		if (displayLocation && this.USE_CANVAS_DRAW) this.redrawCanvas();
	}

	findLocationAt(pageX, pageY) {
		// Look for icons first
		for (let key in this.locations) {
			var location = this.locations[key];

			if (location.locType >= Constants.LOCTYPE_PATH) continue;
			if (location.worldID != this.currentWorldID) continue;
			if (!location.visible && !this.isHiddenLocsShown()) continue;
			if (location.displayLevel > this.zoomLevel || (this.isHiddenLocsShown() && this.zoomLevel == this.mapConfig.maxZoomLevel)) continue;

			const rect = this.mapCanvas.getBoundingClientRect();
			const x = pageX - rect.left;
			const y = pageY - rect.top;

			if (location.isMouseHoverCanvas(x, y)) return location;
		}

		// Check paths/areas next
		for (let key in this.locations) {
			var location = this.locations[key];

			if (location.locType < Constants.LOCTYPE_PATH) continue;
			if (location.worldID != this.currentWorldID) continue;
			if (!location.visible && !this.isHiddenLocsShown()) continue;
			if (location.displayLevel > this.zoomLevel || (this.isHiddenLocsShown() && this.zoomLevel == this.mapConfig.maxZoomLevel)) continue;

			const rect = this.mapCanvas.getBoundingClientRect();
			const x = pageX - rect.left;
			const y = pageY - rect.top;

			if (location.isMouseHoverCanvas(x, y)) return location;
		}

		return null;
	}


	clearLocationElements()	{
		for (let key in this.locations) {
			this.locations[key].removeElements();
		}
	}

	removeExtraLocations() {
		var mapBounds = this.getMapRootBounds();
	
		// Remove locations in this world that are out of the current bounds
		for (let key in this.locations) {
			if (this.locations[key].worldID != this.currentWorldID) continue;
			if (this.locations[key].isInBounds(mapBounds)) continue;
	
			this.locations[key].removeElements();
			delete this.locations[key];
		}
	
	}

	redrawLocations() {
	
		let displayedLocations = {};

		for (var key in this.locations) {
			var location = this.locations[key];
	
			if (location.worldID != this.currentWorldID) continue;
			if (!location.visible && !this.isHiddenLocsShown()) continue;
			if (location.displayLevel > this.zoomLevel || (this.isHiddenLocsShown() && this.zoomLevel == this.mapConfig.maxZoomLevel)) continue;
			if (location.locType >= Constants.LOCTYPE_PATH) location.updatePathSize(false);
	
			displayedLocations[key] = 1;
			location.computeOffset();
			location.updatePopupOffset();
	
			if (location.locType >= Constants.LOCTYPE_PATH) location.updatePath();
		}
	
		for (var key in displayedLocations) {
			var location = this.locations[key];
			location.updateIcon();
		}
	
		for (var key in displayedLocations) {
			var location = this.locations[key];
			location.updateLabel();
		}

		for (var key in this.locations) {
			var location = this.locations[key];

			if (location.worldID != this.currentWorldID) continue;
			if (!location.visible && !this.isHiddenLocsShown()) continue;
			if (location.displayLevel > this.zoomLevel || (this.isHiddenLocsShown() && this.zoomLevel == this.mapConfig.maxZoomLevel)) continue;
			if (location.locType >= Constants.LOCTYPE_PATH) location.updatePathSize(false);

			this.displayLocation(location);
		}
	}

	updateLocations(animate) {

		this.removeExtraLocations();
		this.updateLocationDisplayLevels();
		this.updateLocationOffsets(animate);
	
		this.redrawCanvas();
		//this.redrawLocations();
	
		this.retrieveLocations();
	}

	updateLocationDisplayLevels() {
		for (let key in this.locations) {
			if (this.zoomLevel < this.locations[key].displayLevel)
				this.locations[key].hideElements(0);
			else
				this.locations[key].showElements(0);
		}
	}

	updateLocationOffsets (animate) {
		for (let key in this.locations) {

			/*
			tilePos = this.convertGameToTilePos(location.x, location.y);

			mapOffset  = this.mapRoot.offset();
			xPos = (tilePos.x - this.startTileX) * this.mapConfig.tileSize + mapOffset.left;
			yPos = (tilePos.y - this.startTileY) * this.mapConfig.tileSize + mapOffset.top;

			location.updateOffset(xPos, yPos, animate); */

			locations[key].computeOffset();
			locations[key].updateOffset();
		}
	}

	drawCellResources() {
		if (this.cellResource == "") return;

		var startX = this.mapConfig.cellResourceStartX;
		var startY = this.mapConfig.cellResourceStartY;
		var endX = this.mapConfig.cellResourceStopX;
		var endY = this.mapConfig.cellResourceStopY;
		var color = "white";
		var x1, y1, x2, y2;
		var zoomDiff = this.zoomLevel - this.mapConfig.minZoomLevel
		var gridOffsetY = this.mapConfig.gridOffsetY;
	
		for (var z = 1; z <= zoomDiff; ++z) {
			gridOffsetY += Math.pow(2, z + this.mapConfig.gridOffsetPowerY)
		}
	
		if (!this.isDrawGrid) this.clearMapGridCanvas();
	
		for (var x = startX; x <= endX; x++) {
			let xData = this.cellResourceData.data[x - startX];
			if (xData == null) continue;
	
			for (var y = startY; y <= endY; y++) {
				resourceCount = xData[y - startY];
				if (resourceCount == null) continue;
	
	
				if (resourceCount == 0) {
					continue;	//do nothing
				} else if (resourceCount <= 2) {
					color = "rgba(255,0,255,0.5)";	//TODO: No hardcode colors?
				} else if (resourceCount <= 5) {
					color = "rgba(0,0,255,0.5)";
				} else if (resourceCount <= 10) {
					color = "rgba(0,255,0,0.5)";
				}
				else if (resourceCount <= 20) {
					color = "rgba(255,255,0,0.5)";
				} else if (resourceCount <= 50) {
					color = "rgba(255,102,51,0.5)";
				} else {
					color = "rgba(255,0,0,0.5)";
				}
	
				x1 = x * this.mapConfig.cellResourceDeltaX;
				y1 = y * this.mapConfig.cellResourceDeltaY;
				x2 = (x + 1) * this.mapConfig.cellResourceDeltaX;
				y2 = (y + 1) * this.mapConfig.cellResourceDeltaY;
	
				var pos1 = this.convertGameToPixelPos(x1, y2);
				var pos2 = this.convertGameToPixelPos(x2, y1);
	
				pos1.x -= this.mapTransformX;
				pos1.y -= this.mapTransformY + gridOffsetY;
				pos2.x -= this.mapTransformX;
				pos2.y -= this.mapTransformY + gridOffsetY;
	
				this.mapContextGrid.fillStyle = color;
				this.mapContextGrid.fillRect(pos1.x + 1, pos1.y + 1, pos2.x - pos1.x - 2, pos2.y - pos1.y - 2);
			}
	
		}
	
	}

	/*================================================
						Map editing
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

	/*================================================
					 Gamemap Interface
	================================================*/

	createMapRoot() {
		if (this.USE_LEAFLET) return;
			
		this.mapRoot = $('<div />').attr('id', 'gmMapRoot').appendTo(this.mapContainer);
		this.createMapCanvas();
	}

	createMapCanvas() {

		let canvasWidth = this.mapContainer.width();
		let canvasHeight = this.mapContainer.height();
	
		print("Creating map canvas with width: " + canvasWidth + ", and height: " + canvasHeight);
	
		this.mapCanvas = $('<canvas />').
							attr('id', 'gmMapCanvas').
							attr('width', canvasWidth).
							attr('height', canvasHeight).
							css('width', canvasWidth).
							css('height', canvasHeight).
							css('cursor', "grab").
							appendTo(this.mapContainer)[0];
	
		this.mapCanvasGrid = $('<canvas />').
							attr('id', 'gmMapCanvasGrid').
							attr('width', canvasWidth).
							attr('height', canvasHeight).
							css('width', canvasWidth).
							css('height', canvasHeight).
							css('cursor', "grab").
							appendTo(this.mapContainer)[0];
	
		this.mapCanvasElement = $("#gmMapCanvas");
		this.mapCanvasGridElement = $("#gmMapCanvasGrid");
	
		this.mapContext = this.mapCanvas.getContext("2d");
		this.mapContextGrid = this.mapCanvasGrid.getContext("2d");

		print("stuff!");
	
		this.mapContext.fillStyle = this.mapConfig.bgColour;
		this.mapContext.fillRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
	}

	clearOldCanvasTiles() {
		for (var i in this.canvasImages) {
			let image = this.canvasImages[i];
			image.image.showTile = false;
		}
	}

	triggerCanvasRedraw() {
		var self = this;

		//console.log("triggerCanvasRedraw");
	
		setTimeout(function() { self.doCanvasRedraw(); } , 100);
		this.lastCanvasRedrawRequest = Date.now();
	}

	doCanvasRedraw() {
		var diffTime = Date.now() - this.lastCanvasRedrawRequest;

		if (diffTime < 100) {
			//setTimeout(this.doCanvasRedraw, 100);
			return;
		}
	
		//console.log("doCanvasRedraw");
	
		this.redrawCanvas(true);
		this.lastCanvasRedrawRequest = 0;
	}

	loadMapTiles() {
		var self = this;

		if (!(this.currentWorldID in this.mapWorlds)) {
			print("Unknown worldID " + this.currentWorldID + "!");
			return;
		}

		this.clearOldCanvasTiles();

		var worldName = this.mapWorlds[this.currentWorldID].name;
		var maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);

		print("worldID: " + this.currentWorldID + " worldName: " + worldName);

		this.canvasImages = [];
		this.canvasImageMap = {};
		this.canvasTileCountX = this.mapConfig.numTilesX;
		this.canvasTileCountY = this.mapConfig.numTilesY;

		let canvasBGColor = this.mapConfig.bgColour;

		for (let y = 0; y < this.mapConfig.numTilesY; ++y) {
			this.canvasImageMap[y] = {};

			for (let x = 0; x < this.mapConfig.numTilesX; ++x) {
				let tileX = x; //+ this.startTileCanvasX;
				let tileY = y; //+ this.startTileCanvasY;

				let world = this.mapWorlds[this.currentWorldID];

				//getMapTileFunction(tileX, tileY, this.zoomLevel, worldName, this.displayState);
				let imageURL = this.getMapTileImageURL(tileX, tileY, this.zoomLevel, world, this.mapConfig, this.displayState);
				let newImage = new Image();
				let canvasX = tileX * this.mapConfig.tileSize;
				let canvasY = tileY * this.mapConfig.tileSize;

				newImage.isError = false;
				newImage.showTile = true;
				newImage.isLoaded = false;

				let imageInfo = {
						image: newImage,
						x: x,
						y: y,
						canvasX: canvasX,
						canvasY: canvasY,
						tileX : tileX,
						tileY : tileY,
				};

				this.canvasImages.push(imageInfo);
				this.canvasImageMap[y][x] = imageInfo;

				newImage.onerror = function() {

					if (newImage.showTile) {
						self.mapContext.fillStyle = canvasBGColor;
						self.mapContext.fillRect(canvasX, canvasY, self.mapConfig.tileSize, self.mapConfig.tileSize);
						self.triggerCanvasRedraw();
					}

					newImage.isError = true;
				}

				newImage.onload = function () {

					if (newImage.showTile) {
						self.mapContext.drawImage(newImage, canvasX, canvasY, self.mapConfig.tileSize, self.mapConfig.tileSize);
						self.triggerCanvasRedraw();
					}

					newImage.isLoaded = true;
				};

				if (tileX < 0 || tileY < 0) {
					newImage.onerror();
				}
				else {
					newImage.src = imageURL;
				}
			}
		}

	}

	// tileX, tileY, zoom, world
	getMapTileImageURL(tileX, tileY, zoom, world, mapConfig) {

		if (mapConfig.database == "eso") { // unique stuff for eso
			return mapConfig.tileURL + world.name + "/zoom" + zoom + "/" + world.name + "-" + tileX + "-" + tileY + ".jpg";
		} else {

			if (world == null) {
				return "zoom" + zoom + "/maptile-" + tilePos.x + "-" + tilePos.y + ".jpg";
			} else {
				return world + "/zoom" + zoom + "/maptile-" + tilePos.x + "-" + tilePos.y + ".jpg";
			}
		}
	}

	canvasDrawGrid() {
		
		var deltaX = this.mapConfig.gridDeltaX;
		var deltaY = this.mapConfig.gridDeltaY;
		var gridOffsetY = this.mapConfig.gridOffsetY;
		var zoomDiff = this.zoomLevel - this.mapConfig.minZoomLevel

		print("canvasDrawGrid");
		this.clearMapGridCanvas();

		for (let z = 1; z <= zoomDiff; ++z) {
			gridOffsetY += Math.pow(2, z + this.mapConfig.gridOffsetPowerY)
		}

		for (var y = this.mapConfig.gridStartY; y <= this.mapConfig.gridStopY; y += deltaY) {
			var pos1 = this.convertGameToPixelPos(this.mapConfig.gridStartX, y);
			var pos2 = this.convertGameToPixelPos(this.mapConfig.gridStopX, y);

			pos1.x -= this.mapTransformX;
			pos2.x -= this.mapTransformX;
			pos1.y -= this.mapTransformY + gridOffsetY;
			pos2.y -= this.mapTransformY + gridOffsetY;

			this.mapContextGrid.beginPath();
			this.mapContextGrid.moveTo(pos1.x, pos1.y);
			this.mapContextGrid.lineTo(pos2.x, pos2.y);
			this.mapContextGrid.lineWidth = 1;
			this.mapContextGrid.strokeStyle = this.mapConfig.gridStyle;
			this.mapContextGrid.stroke();
		}
	}

	clearMapGridCanvas = function() {
		this.mapContextGrid.save();
		this.mapContextGrid.setTransform(1, 0, 0, 1, 0, 0);
		this.mapContextGrid.clearRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
		this.mapContextGrid.restore();
	}

	redrawCanvas = function(redrawGrid) {
		this.redrawImages();
		if (redrawGrid) {
			this.canvasDrawGrid();
		} 
		this.drawCellResources();
		this.redrawLocations();
	}

	redrawImages() {
		let worldName = this.mapWorlds[this.currentWorldID].name;

		let canvasBGColor = this.mapConfig.bgColour;

		for (var i in this.canvasImages) {
			let image = this.canvasImages[i];

			if (image.image.isLoaded) {
				this.mapContext.drawImage(image.image, image.canvasX, image.canvasY, this.mapConfig.tileSize, this.mapConfig.tileSize);
			} else {
				this.mapContext.fillStyle = canvasBGColor;
				this.mapContext.fillRect(image.canvasX, image.canvasY, this.mapConfig.tileSize, this.mapConfig.tileSize);
			}
		}
	}

	createEvents = function() {
		let self = this;
	
		$(window).on("mousemove", { self: this }, this.onMouseMove);
		$(window).on("touchmove", { self: this }, this.onTouchMove);
	
		if (this.USE_CANVAS_DRAW) {
			$('#gmMapCanvas').on("mousedown", { self: this }, this.onMouseDown);
			$('#gmMapCanvas').on("touchstart", { self: this }, this.onTouchStart);
			$('#gmMapCanvas').on("click", { self: this }, this.onClick);
			$('#gmMapCanvas').on("dblclick", { self: this }, this.onDblClickCanvas);
			$(this.mapCanvas).on('DOMMouseScroll mousewheel', { self: this }, this.onMouseScrollCanvas);
	
			$('#gmMapCanvasGrid').on("mousedown", { self: this }, this.onMouseDown);
			$('#gmMapCanvasGrid').on("touchstart", { self: this }, this.onTouchStart);
			$('#gmMapCanvasGrid').on("click", { self: this }, this.onClick);
			$('#gmMapCanvasGrid').on("dblclick", { self: this }, this.onDblClickCanvas);
			$(this.mapCanvasGrid).on('DOMMouseScroll mousewheel', { self: this }, this.onMouseScrollCanvas);
		}

		if (!this.USE_LEAFLET) {
			this.mapRoot.on('DOMMouseScroll mousewheel', { self: this }, this.onMouseScroll);
		}
	
		$(window).on("mouseup", { self: this }, this.onMouseUp);
		$(window).on("touchend touchcancel", { self: this }, this.onTouchEnd);

		this.mapContainer.on("contextmenu", {self: this}, this.onRightClick);
	
		$(window).on("keyup", { self: this }, this.onKeyUp);
		$(window).on("keydown", { self: this }, this.onKeyDown);
	
		$(window).on('resize', { self: this }, this.onResize);
	
		$(document).ready(function() {
				self.onDocReady();
		});
	
		$('.gmMapTile').dblclick({ self: this }, this.onDoubleClick);
	}

	/*================================================
						  Events 
	================================================*/

	onResize(event) {
		let self = event.data.self;

		let canvasWidth = self.mapContainer.width();
		let canvasHeight = self.mapContainer.height();

		print("OnResize: " + canvasWidth + ", " + canvasHeight);

		$(self.mapCanvas).attr('width', canvasWidth).
							attr('height', canvasHeight).
							css('width', canvasWidth).
							css('height', canvasHeight);

		$(self.mapCanvasGrid).attr('width', canvasWidth).
							attr('height', canvasHeight).
							css('width', canvasWidth).
							css('height', canvasHeight);

		let worldName = self.mapWorlds[self.currentWorldID].name;
		let canvasBGColor = DEFAULT_MAP_CONFIG.bgColour;

		if (self.mapContext) {
			self.mapContext.fillStyle = canvasBGColor;
			self.mapContext.fillRect(0, 0, self.mapCanvas.width, self.mapCanvas.height);

			self.mapContext.translate(self.mapTransformX, self.mapTransformY);
			self.mapContextGrid.translate(self.mapTransformX, self.mapTransformY);
		}

		self.redrawCanvas(true);
	}
	
	onMouseMove(event) {

		var self = event.data.self;

		if (self.isDragging) {
			self.onDragMove(event);
			event.preventDefault();
		} else if (self.currentEditMode == 'edithandles') {
			self.currentEditLocation.onPathMouseMoveCanvas(event);
		} else {
			self.checkCanvasHover(event);
		}

	}

	/*================================================
					Utility functions
	================================================*/

	getCurrentWorldID() {
		return this.currentWorldID;
	}

	getWorldIDFromWorld(world) {

		let worldID = 0;

		if (world == null) return 0;

		// check if it's an object
		if (isNaN(world)) {
			worldName = decodeURIComponent(world);

			// is it in the named world array?
			if (worldName in this.mapWorldDisplayNameIndex) {
				return this.mapWorldDisplayNameIndex[worldName];
			} 

			worldName = worldName.toLowerCase();
			if ( !(worldName in this.mapWorldNameIndex) ) return 0;
			worldID = this.mapWorldNameIndex[worldName];
		}
		else {
			worldID = parseInt(world);
			if ( !(worldID in this.mapWorlds)) return 0;
		}

		return worldID;
	}

	getArticleLink() {

		if (! (this.currentWorldID in this.mapWorlds)) {
			return "";
		} 

		let wikiPage = this.mapWorlds[this.currentWorldID].wikiPage;
		if (wikiPage == null || wikiPage == '') wikiPage = this.mapWorlds[this.currentWorldID].displayName;
	
		let namespace = '';
		if (this.mapConfig.wikiNamespace != null && this.mapConfig.wikiNamespace != '') namespace = this.mapConfig.wikiNamespace + ':';
	
		wikiPage = encodeURIComponent (wikiPage);
	
		return this.mapConfig.wikiURL + namespace + wikiPage;

	}

	createMapLink() { 

		let mapLink = window.location;
		let mapState = this.getMapState();
	
		mapLink += '&world=' + mapState.worldID;
		mapLink += '&x=' + mapState.gamePos.x;
		mapLink += '&y=' + mapState.gamePos.y;
		mapLink += '&zoom=' + mapState.zoomLevel;
	
		if (mapState.grid) mapLink += "&grid=true";
		if (mapState.cellResource != "") mapLink += "&cellResource=" + mapState.cellResource;
		if (mapState.displayState != "") mapLink += "&displayState=" + mapState.displayState;
	
		return mapLink;

	}

	checkCanvasHover(event) {
		let needsUpdate = false;

		let hoverLocation = this.findLocationAt(event.pageX, event.pageY);
		if (hoverLocation == this.lastCanvasHoverLocation) return;

		if (hoverLocation) {
			hoverLocation.isHoverCanvas = true;
			needsUpdate = true;
		}

		if (this.lastCanvasHoverLocation) {
			this.lastCanvasHoverLocation.isHoverCanvas = false;
			this.lastCanvasHoverLocation.hideTooltip();
			this.lastCanvasHoverLocation = null;
			needsUpdate = true;
		}

		if (needsUpdate) {
			this.lastCanvasHoverLocation = hoverLocation;
			this.redrawCanvas();

			if (this.lastCanvasHoverLocation) {
				this.mapCanvasGridElement.css('cursor', 'pointer')
				if (this.lastCanvasHoverLocation.shouldShowTooltip()) this.lastCanvasHoverLocation.showTooltip();
			}
			else {
				this.mapCanvasGridElement.css('cursor', "grab")
			}
		}
	}

	

	isValidZoom(zoom) {
		if (zoom == null ) {
			return false;
		} else {
			return zoom >= this.mapConfig.minZoomLevel && zoom <= this.mapConfig.maxZoomLevel;
		}
	}

	/*================================================
					Position functions
	================================================*/

	setGamePos(x, y, zoom, updateMap) {
		
		this.setGamePosNoUpdate(x, y, zoom);

		if (updateMap == null || updateMap === true) {
			this.redrawCanvas();
			this.updateLocations();
			this.loadMapTiles();
			if (this.isDrawGrid) this.drawGrid();
			if (this.cellResource != "") this.getCellResourceData(this.cellResource);
		}
	}

	setGamePosNoUpdate(x, y, zoom) {
		var mapOffset = this.mapContainer.offset();

		if (this.isValidZoom(zoom)) {
			this.zoomLevel = zoom;
		}

		let tilePos = this.convertGameToTilePos(x, y);
		tilePos.x -= this.mapConfig.numTilesX/2;
		tilePos.y -= this.mapConfig.numTilesY/2;
		print("setGamePos(): tilePos = ", x, y, tilePos.x, tilePos.y);

		this.startTileX = Math.floor(tilePos.x);
		this.startTileY = Math.floor(tilePos.y);
		this.startTileCanvasX = this.startTileX;
		this.startTileCanvasY = this.startTileY;
		this.origStartTileCanvasX = this.startTileX;
		this.origStartTileCanvasY = this.startTileY;
		print("setGamePos(): startTile = " + this.startTileX + ", " + this.startTileY);

		let newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - tilePos.x) * this.mapConfig.tileSize);
		let newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - tilePos.y) * this.mapConfig.tileSize);
		print ("newOffset = " + newOffsetX + ", " + newOffsetY);

		if (this.USE_CANVAS_DRAW) {
			this.startTileX = 0;
			this.startTileY = 0;

			tilePos = this.convertGameToTilePos(x, y);

			newOffsetX = Math.round(this.mapCanvas.width/2 - tilePos.x * this.mapConfig.tileSize);
			newOffsetY = Math.round(this.mapCanvas.height/2 - tilePos.y * this.mapConfig.tileSize);
			print("newOffsetCanvas = " + newOffsetX + ", " + newOffsetY, tilePos.x, tilePos.y);

			this.resetTranslateCanvas();
			this.translateCanvas(newOffsetX, newOffsetY);
		} else {
			this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
		}
	}

	getGamePositionOfCenter() {
		let rootOffset = this.mapRoot.offset();
		let mapOffset  = this.mapContainer.offset();

		let rootCenterX = this.mapContainer.width() /2 + mapOffset.left - rootOffset.left;
		let rootCenterY = this.mapContainer.height()/2 + mapOffset.top  - rootOffset.top;

		let tileX = rootCenterX / this.mapConfig.tileSize + this.startTileX;
		let tileY = rootCenterY / this.mapConfig.tileSize + this.startTileY;

		return this.convertTileToGamePos(tileX, tileY);
	}

	convertTileToGamePos(tileX, tileY) {

		let maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);
		let gameX = 0;
		let gameY = 0;

		gameX = Math.round(tileX / maxTiles * (this.mapConfig.maxX - this.mapConfig.minX) + this.mapConfig.minX);
		gameY = Math.round(tileY / maxTiles * (this.mapConfig.maxY - this.mapConfig.minY) + this.mapConfig.minY);

		return new Position(gameX, gameY);
	}

	convertGameToTilePos(gameX, gameY) {
		let maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);
		let tileX = 0;
		let tileY = 0;

		tileX = (gameX - this.mapConfig.minX) * maxTiles / (this.mapConfig.maxX - this.mapConfig.minX);
		tileY = (gameY - this.mapConfig.minY) * maxTiles / (this.mapConfig.maxY - this.mapConfig.minY);

		return new Position(tileX, tileY);
	}

	convertGameToPixelPos(gameX, gameY) {
		let mapOffset = this.mapRoot.offset();
		let tilePos = this.convertGameToTilePos(gameX, gameY);
	
		let xPos = Math.round((tilePos.x - this.startTileX) * this.mapConfig.tileSize);
		let yPos = Math.round((tilePos.y - this.startTileY) * this.mapConfig.tileSize);
	
		return new Position(xPos, yPos);
	}

	getMapRootBounds() {
		let leftTop     = this.convertTileToGamePos(this.startTileX, this.startTileY);
		let rightBottom = this.convertTileToGamePos(this.startTileX + this.mapConfig.numTilesX, this.startTileY + this.mapConfig.numTilesY);

		return new Bounds(leftTop.x, leftTop.y, rightBottom.x, rightBottom.y);
	}

	getMapBounds() {
		var rootOffset = this.mapRoot.offset();
		var mapOffset  = this.mapContainer.offset();
		var width  =  this.mapContainer.width();
		var height =  this.mapContainer.height();

		let leftTile = this.startTileX + (mapOffset.left - rootOffset.left - this.mapTransformX)/this.mapConfig.tileSize;
		let topTile  = this.startTileY + (mapOffset.top  - rootOffset.top  - this.mapTransformY)/this.mapConfig.tileSize;

		let rightTile   = this.startTileX + (mapOffset.left - rootOffset.left + width  - this.mapTransformX)/this.mapConfig.tileSize;
		let bottomTile  = this.startTileY + (mapOffset.top  - rootOffset.top  + height - this.mapTransformY)/this.mapConfig.tileSize;

		//this.startTileX + this.mapConfig.numTilesX, this.startTileY + this.mapConfig.numTilesY

		let leftTop     = this.convertTileToGamePos(leftTile, topTile);
		let rightBottom = this.convertTileToGamePos(rightTile, bottomTile);

		return new Bounds(leftTop.x, leftTop.y, rightBottom.x, rightBottom.y);
	}

}

// uesp.gamemap.Map.prototype.checkTileEdges = function ()
// {
// 	if (this.USE_CANVAS_DRAW) return this.checkTileEdgesCanvas();

// 	tilesLeft = 0;
// 	tilesRight = 0;
// 	tilesTop = 0;
// 	tilesBottom = 0;

// 	extraX = this.mapConfig.numTilesX * this.mapConfig.tileSize - this.mapContainer.width();
// 	extraY = this.mapConfig.numTilesY * this.mapConfig.tileSize - this.mapContainer.height();

// 	tilesLeft = -Math.floor(this.mapRoot.offset().left / this.mapConfig.tileSize) - 1;
// 	tilesTop  = -Math.floor(this.mapRoot.offset().top  / this.mapConfig.tileSize) - 1;
// 	tilesRight  = Math.floor((extraX + this.mapRoot.offset().left) / this.mapConfig.tileSize);
// 	tilesBottom = Math.floor((extraY + this.mapRoot.offset().top)  / this.mapConfig.tileSize);

// 	if (tilesRight < this.mapConfig.tileEdgeLoadCount)
// 	{
// 		this.shiftMapTiles(1, 0);
// 	}
// 	else if (tilesLeft < this.mapConfig.tileEdgeLoadCount)
// 	{
// 		this.shiftMapTiles(-1, 0);
// 	}

// 	if (tilesTop < this.mapConfig.tileEdgeLoadCount)
// 	{
// 		this.shiftMapTiles(0, -1);
// 	}
// 	else if (tilesBottom < this.mapConfig.tileEdgeLoadCount)
// 	{
// 		this.shiftMapTiles(0, 1);
// 	}
// }


// uesp.gamemap.Map.prototype.checkTileEdgesCanvas = function ()
// {
// 	let tilesLeft = 0;
// 	let tilesRight = 0;
// 	let tilesTop = 0;
// 	let tilesBottom = 0;

// 	tilesLeft = -(this.startTileCanvasX + Math.floor(this.mapTransformX / this.mapConfig.tileSize));
// 	tilesTop  = -(this.startTileCanvasY + Math.floor(this.mapTransformY / this.mapConfig.tileSize));
// 	tilesRight  = this.canvasTileCountX - tilesLeft - Math.floor(this.mapCanvas.width / this.mapConfig.tileSize);
// 	tilesBottom = this.canvasTileCountY - tilesTop - Math.floor(this.mapCanvas.height / this.mapConfig.tileSize);

// 	if (tilesRight < this.mapConfig.tileEdgeLoadCount)
// 	{
// 		this.loadMapTilesCanvasRowCol(0, 1, 0, 0);
// 	}
// 	else if (tilesLeft < this.mapConfig.tileEdgeLoadCount)
// 	{
// 		this.loadMapTilesCanvasRowCol(1, 0, 0, 0);
// 	}

// 	if (tilesTop < this.mapConfig.tileEdgeLoadCount)
// 	{
// 		this.loadMapTilesCanvasRowCol(0, 0, 1, 0);
// 	}
// 	else if (tilesBottom < this.mapConfig.tileEdgeLoadCount)
// 	{
// 		this.loadMapTilesCanvasRowCol(0, 0, 0, 1);
// 	}
// }


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

// uesp.gamemap.onLoadIconSuccess = function(event)
// {
// 	event.data.updateOffset();
// 	$(this).show();
// }


// uesp.gamemap.onLoadIconFailed = function(missingURL)
// {
// 	return function() {
// 		$(this).attr('src', missingURL);
// 	};
// }


// uesp.gamemap.Map.prototype.displayLocation = function (location)
// {
// 	if (location.worldID != this.currentWorldID) return;
// 	if (!location.visible && !this.isHiddenLocsShown()) return;

// 	location.computeOffset();
// 	location.update();
// }


// uesp.gamemap.Map.prototype.dumpTileIndices = function()
// {
// 	for (y = 0; y < this.mapConfig.numTilesY; ++y)
// 	{
// 		var LineString = "";

// 		for (x = 0; x < this.mapConfig.numTilesX; ++x)
// 		{
// 			LineString += "(" + this.mapTiles[y][x].deltaTileX + ","+ this.mapTiles[y][x].deltaTileX + ") ";
// 		}

// 		uesp.logDebug(uesp.LOG_LEVEL_WARNING, LineString);
// 	}
// }


// function compareMapWorld (a, b)
// {
// 	if (a < b) return -1;
// 	if (a > b) return 1;
// 	return 0;
// }


// uesp.gamemap.Map.prototype.fillWorldList = function(ElementID)
// {
// 	TargetList = $(ElementID);
// 	if (TargetList == null) return false;

// 	var tmpWorldList = [];

// 	for (key in this.mapWorlds)
// 	{
// 		if (this.mapWorlds[key].name[0] != '_' && key > 0) tmpWorldList.push(this.mapWorlds[key].name);
// 	}

// 	tmpWorldList.sort(compareMapWorld);
// 	TargetList.empty();

// 	for (i = 0; i < tmpWorldList.length; ++i)
// 	{
// 		world = this.mapWorlds[this.mapWorldNameIndex[tmpWorldList[i]]];
// 		if (world == null) continue;

// 		TargetList.append($("<option></option>")
// 					.attr("value", world.id)
// 					.text(world.displayName));
// 	}

// 	return true;
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

// uesp.gamemap.onMapTileLoadFunction = function (element, imageURL)
// {
// 	return function() {
// 		$(this).remove();
// 		element.css('background-image', 'url(' + imageURL + ')');
// 	};
// }


// uesp.gamemap.onMapTileLoadFunctionEx = function (element, imageURL, gameMap, origZoomLevel, origworldID)
// {
// 	return function() {
// 		$(this).remove();
// 		if (gameMap.zoomLevel != origZoomLevel || gameMap.currentWorldID != origworldID) return;
// 		element.css('background-image', 'url(' + imageURL + ')');
// 	};
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

// uesp.gamemap.Map.prototype.loadMapTilesCanvasRowCol = function(left, right, top, bottom)
// {
// 	if (uesp.gamemap.isNullorUndefined(this.mapConfig.getMapTileFunction)) return;

// 	if (!(this.currentWorldID in this.mapWorlds))
// 	{
// 		uesp.logError("Unknown worldID " + this.currentWorldID + "!");
// 		return;
// 	}

// 	let ix = this.startTileCanvasX - this.origStartTileCanvasX;
// 	let iy = this.startTileCanvasY - this.origStartTileCanvasY;

// 	if (left)
// 	{
// 		this.startTileCanvasX -= 1;
// 		this.canvasTileCountX++;
// 		this.loadMapTilesCanvasRowColPriv(ix - 1, iy, left, this.canvasTileCountY)
// 	}

// 	if (right)
// 	{
// 		this.canvasTileCountX++;
// 		this.loadMapTilesCanvasRowColPriv(ix + this.canvasTileCountX - 1, iy, right, this.canvasTileCountY)
// 	}

// 	if (top)
// 	{
// 		this.startTileCanvasY -= 1;
// 		this.canvasTileCountY++;
// 		this.loadMapTilesCanvasRowColPriv(ix, iy - 1, this.canvasTileCountX, top)
// 	}

// 	if (bottom)
// 	{
// 		this.canvasTileCountY++;
// 		this.loadMapTilesCanvasRowColPriv(ix, iy + this.canvasTileCountY - 1, this.canvasTileCountX, bottom)
// 	}


// }


// uesp.gamemap.Map.prototype.loadMapTilesCanvasRowColPriv = function(startX, startY, dx, dy)
// {
// 	let worldName = this.mapWorlds[this.currentWorldID].name;
// 	let maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);
// 	let self = this;

// 	let canvasBGColor = this.mapConfig.canvasBGColor;
// 	if (this.mapConfig.canvasBGColorFunction !== null) canvasBGColor = this.mapConfig.canvasBGColorFunction(worldName, this.displayState);

// 	for (y = startY; y < startY + dy; ++y)
// 	{
// 		if (this.canvasImageMap[y] == null)	this.canvasImageMap[y] = {};

// 		for (x = startX; x < startX + dx; ++x)
// 		{
// 			if (this.canvasImageMap[y][x] != null) continue;

// 			let tileX = x + this.origStartTileCanvasX;
// 			let tileY = y + this.origStartTileCanvasY;

// 			let imageURL = this.mapConfig.getMapTileFunction(tileX, tileY, this.zoomLevel, worldName, this.displayState);
// 			let newImage = new Image();
// 			let canvasX = tileX * this.mapConfig.tileSize;
// 			let canvasY = tileY * this.mapConfig.tileSize;

// 			newImage.isError = false;
// 			newImage.showTile = true;
// 			newImage.isLoaded = false;

// 			let imageInfo = {
// 					image: newImage,
// 					x: x,
// 					y: y,
// 					canvasX: canvasX,
// 					canvasY: canvasY,
// 					tileX : tileX,
// 					tileY : tileY,
// 			};

// 			this.canvasImages.push(imageInfo);
// 			this.canvasImageMap[y][x] = imageInfo;

// 			newImage.onerror = function() {

// 				if (newImage.showTile)
// 				{
// 					self.mapContext.fillStyle = canvasBGColor;
// 					self.mapContext.fillRect(canvasX, canvasY, self.mapConfig.tileSize, self.mapConfig.tileSize);
// 				}

// 				newImage.isError = true;
// 			}

// 			newImage.onload = function () {

// 				if (newImage.showTile)
// 				{
// 					self.mapContext.drawImage(newImage, canvasX, canvasY, self.mapConfig.tileSize, self.mapConfig.tileSize);
// 				}

// 				newImage.isLoaded = true;
// 			};

// 			if (tileX < 0 || tileY < 0)
// 			{
// 				newImage.onerror();
// 			}
// 			else
// 			{
// 				newImage.src = imageURL;
// 			}

// 		}
// 	}

// }


// uesp.gamemap.Map.prototype.loadMapTilesRowCol = function(xIndex, yIndex)
// {
// 	if (uesp.gamemap.isNullorUndefined(this.mapConfig.getMapTileFunction)) return;

// 	if (!(this.currentWorldID in this.mapWorlds))
// 	{
// 		uesp.logError("Unknown worldID " + this.currentWorldID + "!");
// 		return;
// 	}

// 	var world = this.mapWorlds[this.currentWorldID];
// 	var worldName = world.name;
// 	var worldName = this.mapWorlds[this.currentWorldID].name;
// 	var maxTiles = Math.pow(2, this.zoomLevel - this.mapConfig.zoomOffset);
// 	var isFakeMaxZoom = false;

// 	var missingTile = this.mapConfig.missingMapTile;
// 	if (this.mapConfig.missingMapTileFunction !== null) missingTile = this.mapConfig.missingMapTileFunction(worldName, this.displayState);

// 	if (this.zoomLevel == world.maxZoom && this.mapConfig.useFakeMaxZoom)
// 	{
// 		isFakeMaxZoom = true;
// 	}

// 	for (y = 0; y < this.mapConfig.numTilesY; ++y)
// 	{
// 		for (x = 0; x < this.mapConfig.numTilesX; ++x)
// 		{
// 			if (xIndex >= 0 && this.mapTiles[y][x].deltaTileX != xIndex) continue;
// 			if (yIndex >= 0 && this.mapTiles[y][x].deltaTileY != yIndex) continue;

// 			var tileX = this.mapTiles[y][x].deltaTileX + this.startTileX;
// 			var tileY = this.mapTiles[y][x].deltaTileY + this.startTileY;

// 			//if (tileX < 0 || tileY < 0 || tileX >= maxTiles || tileY >= maxTiles)
// 			if (tileX < 0 || tileY < 0)
// 			{
// 				this.mapTiles[y][x].element.css("background-image", "url(" + missingTile + ")");
// 				continue;
// 			}

// 			var imageURL = this.mapConfig.getMapTileFunction(tileX, tileY, this.zoomLevel, worldName, this.displayState);
// 			var element  = this.mapTiles[y][x].element;

// 			if (isFakeMaxZoom)
// 			{
// 				var xPos = "left";
// 				var yPos = "top";

// 				if (tileX % 2 == 1) xPos = "right";
// 				if (tileY % 2 == 1) yPos = "bottom";

// 				element.css("background-size", "200%");
// 				element.css("background-position", xPos + " " + yPos);

// 				imageURL = this.mapConfig.getMapTileFunction(Math.floor(tileX/2), Math.floor(tileY/2), this.zoomLevel-1, worldName, this.displayState);

// 				$('<img/>').attr('src', imageURL)
// 					.load( uesp.gamemap.onMapTileLoadFunction(element, imageURL))
// 					.error(uesp.gamemap.onMapTileLoadFunction(element, missingTile));
// 			}
// 			else
// 			{
// 				element.css("background-size", "");
// 				element.css("background-position", "");

// 				$('<img/>').attr('src', imageURL)
// 					.load( uesp.gamemap.onMapTileLoadFunction(element, imageURL))
// 					.error(uesp.gamemap.onMapTileLoadFunction(element, missingTile));
// 			}

// 		}
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


// uesp.gamemap.Map.prototype.onDragEnd = function(event)
// {
// 	if (this.USE_CANVAS_DRAW) return this.onDragEndCanvas(event);

// 	this.isDragging = false;
// 	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;

// 	this.draggingObject = null;
// 	this.checkTileEdges();

// 	deltaX = event.pageX - this.dragStartEventX;
// 	deltaY = event.pageY - this.dragStartEventY;

// 	if (deltaX != 0 || deltaY != 0) this.updateLocations();
// }


// uesp.gamemap.Map.prototype.onDragEndCanvas = function(event)
// {
// 	this.isDragging = false;
// 	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;

// 	this.draggingObject = null;
// 	this.checkTileEdgesCanvas();

// 	deltaX = event.pageX - this.dragStartEventX;
// 	deltaY = event.pageY - this.dragStartEventY;

// 	if (deltaX != 0 || deltaY != 0) this.updateLocationsCanvas();
// }


// uesp.gamemap.Map.prototype.onDragMove = function(event)
// {
// 	if (this.draggingObject == null) return;
// 	if (this.USE_CANVAS_DRAW) return this.onDragMoveCanvas(event);

// 	this.mapRoot.offset({
// 			left: event.pageX - this.dragStartLeft,
// 			top:  event.pageY - this.dragStartTop
// 	});

// 	if (this.checkTilesOnDrag) this.checkTileEdges();
// }


// uesp.gamemap.Map.prototype.onDragMoveCanvas = function(event)
// {
// 	if (this.draggingObject == null) return;

// 	let x = event.pageX - this.dragStartLeftCanvas;
// 	let y = event.pageY - this.dragStartTopCanvas;
// 	let diffX = x - this.canvasLastDragX;
// 	let diffY = y - this.canvasLastDragY;

// 	this.translateCanvas(diffX, diffY);

// 	if (this.checkTilesOnDrag) this.checkTileEdgesCanvas();

// 	this.canvasLastDragX = x;
// 	this.canvasLastDragY = y;

// 	/* this.mapRoot.offset({
// 		left: event.pageX - this.dragStartLeft,
// 		top:  event.pageY - this.dragStartTop
// 	}); //*/

// 	this.redrawCanvas(true);

// }


// uesp.gamemap.Map.prototype.onDragStart = function(event)
// {
// 	if (this.USE_CANVAS_DRAW) return this.onDragStartCanvas(event);

// 	let mapOffset = this.mapRoot.offset();

// 	this.dragStartLeft = event.pageX - mapOffset.left;
// 	this.dragStartTop = event.pageY - mapOffset.top;

// 	this.dragStartEventX = event.pageX;
// 	this.dragStartEventY = event.pageY;

// 	this.draggingObject = $(event.target);
// 	this.isDragging = true;

// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Drag Start Offset: " + this.dragStartLeft + ", " + this.dragStartTop);
// }


// uesp.gamemap.Map.prototype.onDragStartCanvas = function(event)
// {
// 	let mapOffset = this.mapRoot.offset();

// 	this.dragStartLeft = event.pageX - mapOffset.left;
// 	this.dragStartTop = event.pageY - mapOffset.top;

// 	this.dragStartLeftCanvas = event.pageX;
// 	this.dragStartTopCanvas = event.pageY;

// 	this.dragStartEventX = event.pageX;
// 	this.dragStartEventY = event.pageY;

// 	this.canvasLastDragX = 0;
// 	this.canvasLastDragY = 0;

// 	this.draggingObject = $(event.target);
// 	this.isDragging = true;

// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Drag Start Offset: " + this.dragStartLeft + ", " + this.dragStartTop);
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


// uesp.gamemap.Map.prototype.onClick = function(event)
// {
// 	var self = event.data.self;

// 	if (event.which == 3)
// 		return self.onRightClick(event);
// 	else if (event.which != 1)
// 		return false;

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onClick");

// 	if (self.currentEditMode == 'addlocation')
// 		self.onAddLocationClick(event);
// 	else if (self.currentEditMode == 'addpath')
// 		self.onAddPathClick(event);
// 	else if (self.currentEditMode == 'addarea')
// 		self.onAddAreaClick(event);
// 	else if (self.currentEditMode == 'draglocation')
// 		self.onDragLocationClick(event);
// 	else if (self.currentEditMode != '' )
// 		return false;
// 	else if (self.USE_CANVAS_DRAW)
// 		return self.onCanvasClick(event);

// 	return true;
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


// uesp.gamemap.Map.prototype.onMouseDown = function(event)
// {
// 	var self = event.data.self;

// 	if (self.USE_CANVAS_DRAW) return self.onMouseDownCanvas(event);

// 	event.preventDefault();

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseDown");

// 	if (event.which != 1) return false;

// 	if (self.currentEditMode == 'edithandles')
// 		self.currentEditLocation.onPathEditHandlesMouseDown(event);
// 	else if (self.currentEditMode == '')
// 		self.onDragStart(event);

// }


// uesp.gamemap.Map.prototype.onMouseDownCanvas = function(event)
// {
// 	var self = event.data.self;
// 	event.preventDefault();

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseDownCanvas");

// 	if (event.which != 1) return false;

// 	if (self.currentEditMode == 'edithandles')
// 		self.currentEditLocation.onPathEditHandlesMouseDown(event);
// 	else if (self.currentEditMode == '')
// 		self.onDragStart(event);

// }


// uesp.gamemap.Map.prototype.onTouchStart = function(event)
// {
// 	var self = event.data.self;

// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onTouchStart");

// 	if (event.originalEvent == null) return;
// 	if (event.originalEvent.touches == null) return;
// 	if (event.originalEvent.touches[0] == null) return;

// 	var touch = event.originalEvent.touches[0];

// 	event.pageX = touch.pageX;
// 	event.pageY = touch.pageY;
// 	event.which = 1;
// 	self.isPinching = false;

// 	if (event.originalEvent.touches.length === 2)
// 	{
// 		self.isPinching = true;
// 		event.pinchDistance = Math.hypot(
// 				event.originalEvent.touches[0].pageX - event.originalEvent.touches[1].pageX,
// 				event.originalEvent.touches[0].pageY - event.originalEvent.touches[1].pageY);
// 		self.onPinchStart(event);
// 		return;
// 	}

// 	self.onMouseDown(event);
// }


// uesp.gamemap.Map.prototype.onTouchEnd = function(event)
// {
// 	var self = event.data.self;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onTouchEnd");

// 	if (event.originalEvent == null) return;
// 	if (event.originalEvent.touches == null) return;

// 	if (event.originalEvent.touches[0] != null)
// 	{
// 		var touch = event.originalEvent.touches[0];
// 		event.pageX = touch.pageX;
// 		event.pageY = touch.pageY;
// 		event.which = 1;
// 	}
// 	else
// 	{
// 		var offset = self.mapRoot.offset();
// 		event.pageX = offset.left + self.dragStartLeft;
// 		event.pageY = offset.top + self.dragStartTop;
// 		event.which = 1;
// 	}

// 	if (self.isPinching)
// 	{
// 		if (event.originalEvent.touches.length === 2)
// 		{
// 			event.pinchDistance = Math.hypot(
// 					event.originalEvent.touches[0].pageX - event.originalEvent.touches[1].pageX,
// 					event.originalEvent.touches[0].pageY - event.originalEvent.touches[1].pageY);
// 		}
// 		else
// 		{
// 			event.pinchDistance = -1;
// 		}

// 		self.onPinchEnd(event);
// 		return;
// 	}

// 	self.onMouseUp(event);
// }


// uesp.gamemap.Map.prototype.onPinchStart = function(event)
// {
// 	self.lastPinchDistance = event.pinchDistance;
// }


// uesp.gamemap.Map.prototype.onPinchMove = function(event)
// {

// 	if (event.pinchDistance >= 500)
// 	{
// 		if (event.pinchDistance > self.lastPinchDistance) this.onPinchZoomIn();
// 		if (event.pinchDistance < self.lastPinchDistance) this.onPinchZoomOut();

// 		this.lastPinchDistance = event.pinchDistance;

// 	}

// }


// uesp.gamemap.Map.prototype.onPinchZoomOut = function(event)
// {
// 	this.zoomOut();
// }


// uesp.gamemap.Map.prototype.onPinchZoomIn = function(event)
// {
// 	this.zoomIn();
// }


// uesp.gamemap.Map.prototype.onPinchEnd = function(event)
// {
// }


// uesp.gamemap.Map.prototype.onDoubleClick = function(event)
// {
// 	var self = event.data.self;

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onDoubleClick");

// 	gamePos = self.convertWindowPixelToGamePos(event.pageX, event.pageY);

// 	self.panToGamePos(gamePos.x, gamePos.y);
// }


// uesp.gamemap.Map.prototype.onTouchMove = function(event)
// {
// 	var self = event.data.self;
// 	event.preventDefault();

// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onTouchMove");

// 	if (event.originalEvent == null) return;
// 	if (event.originalEvent.touches == null) return;
// 	if (event.originalEvent.touches[0] == null) return;

// 	var touch = event.originalEvent.touches[0];

// 	event.pageX = touch.pageX;
// 	event.pageY = touch.pageY;

// 	if (self.isPinching)
// 	{
// 		if (event.originalEvent.touches.length === 2)
// 		{
// 			event.pinchDistance = Math.hypot(
// 					event.originalEvent.touches[0].pageX - event.originalEvent.touches[1].pageX,
// 					event.originalEvent.touches[0].pageY - event.originalEvent.touches[1].pageY);
// 		}
// 		else
// 		{
// 			event.pinchDistance = -1;
// 		}

// 		self.onPinchMove(event);
// 		return;
// 	}

// 	self.onMouseMove(event);
// }


// uesp.gamemap.Map.prototype.onKeyDown = function(event)
// {
// 	var self = event.data.self;

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, 'onKeyDown');

// 	if (self.currentEditLocation != null && self.currentEditLocation.editPathHandles)
// 	{
// 		self.currentEditLocation.onPathEditHandlesKeyDown(event);
// 	}
// 	else
// 	{
// 	}
// }


// uesp.gamemap.Map.prototype.onKeyUp = function(event)
// {
// 	var self = event.data.self;

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, 'onKeyUp');

// 	if (self.currentEditLocation != null && self.currentEditLocation.editPathHandles)
// 	{
// 		self.currentEditLocation.onPathEditHandlesKeyUp(event);
// 	}
// }


// uesp.gamemap.Map.prototype.onMouseScroll = function(event)
// {
// 	var self = event.data.self;
// 	var rootOffset = self.mapContainer.offset();

// 	if (uesp.gamemap.isNullorUndefined(event.pageX)) event.pageX = event.originalEvent.pageX;
// 	if (uesp.gamemap.isNullorUndefined(event.pageY)) event.pageY = event.originalEvent.pageY;

// 	var zoomX = event.pageX - rootOffset.left;
// 	var zoomY = event.pageY - rootOffset.top;

// 	if (event.originalEvent.detail > 0 || event.originalEvent.wheelDelta < 0)
// 	{
// 		self.zoomOut(zoomX, zoomY);
// 	} else {
// 		self.zoomIn(zoomX, zoomY);
// 	}

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseScroll");

// 	event.preventDefault();
// }


// uesp.gamemap.Map.prototype.onMouseScrollCanvas = function(event)
// {
// 	var self = event.data.self;
// 	var rootOffset = self.mapContainer.offset();

// 	if (uesp.gamemap.isNullorUndefined(event.pageX)) event.pageX = event.originalEvent.pageX;
// 	if (uesp.gamemap.isNullorUndefined(event.pageY)) event.pageY = event.originalEvent.pageY;

// 	var zoomX = event.pageX - rootOffset.left;
// 	var zoomY = event.pageY - rootOffset.top;

// 	if (event.originalEvent.detail > 0 || event.originalEvent.wheelDelta < 0)
// 	{
// 		self.zoomOut(zoomX, zoomY);
// 	} else {
// 		self.zoomIn(zoomX, zoomY);
// 	}

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseScroll");
// 	event.preventDefault();
// }


// uesp.gamemap.Map.prototype.onMouseUp = function(event)
// {
// 	var self = event.data.self;

// 	if (self.USE_CANVAS_DRAW) return self.onMouseUpCanvas(event);

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseUp");

// 	if (event.which != 1) return false;

// 	if (self.isDragging)
// 	{
// 		//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseUp::EndDrag");
// 		self.onDragEnd(event);
// 		event.preventDefault();
// 	}
// 	else if (self.currentEditLocation != null && self.currentEditLocation.draggingPathHandle >= 0)
// 	{
// 		self.currentEditLocation.onPathEditHandlesDragEnd(event);
// 	}
// }


// uesp.gamemap.Map.prototype.onMouseUpCanvas = function(event)
// {
// 	var self = event.data.self;

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseUpCanvas");

// 	if (event.which != 1) return false;

// 	if (self.isDragging)
// 	{
// 		//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseUpCanvas::EndDrag");
// 		self.onDragEnd(event);
// 		event.preventDefault();
// 	}
// 	else if (self.currentEditLocation != null && self.currentEditLocation.draggingPathHandle >= 0)
// 	{
// 		self.currentEditLocation.onPathEditHandlesDragEnd(event);
// 	}

// }


// uesp.gamemap.Map.prototype.onCanvasClick = function(event)
// {
// 	var self = event.data.self;

// 	if (!self.USE_CANVAS_DRAW) return false;

// 	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onCanvasClick", event);

// 	var foundLoc = self.findLocationAt(event.pageX, event.pageY);
// 	if (foundLoc == null) return false;

// 	foundLoc.onLabelClick(event);

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

// uesp.gamemap.Map.prototype.shiftMapTiles = function(deltaX, deltaY)
// {
// 	var curOffset = this.mapRoot.offset();
// 	var targetXIndex = -1;
// 	var targetYIndex = -1;

// 	if (deltaX >= 1)
// 	{
// 		targetXIndex = 0;
// 		deltaX = 1;
// 	}
// 	else if (deltaX <= -1)
// 	{
// 		targetXIndex = this.mapConfig.numTilesX - 1;
// 		deltaX = -1;
// 	}

// 	if (deltaY >= 1)
// 	{
// 		targetYIndex = 0;
// 		deltaY = 1;
// 	}
// 	else if (deltaY <= -1)
// 	{
// 		targetYIndex = this.mapConfig.numTilesY - 1;
// 		deltaY = -1;
// 	}

// 	for (var y = 0; y < this.mapConfig.numTilesY; y++)
// 	{
// 		for(var x = 0; x < this.mapConfig.numTilesX; x++)
// 		{
// 			var tileOffset = this.mapTiles[y][x].element.offset();

// 			if (this.mapTiles[y][x].deltaTileX == targetXIndex)
// 			{
// 				this.mapTiles[y][x].deltaTileX += (this.mapConfig.numTilesX - 1) * deltaX;
// 				tileLeft = tileOffset.left + this.mapConfig.tileSize * (this.mapConfig.numTilesX - 1) * deltaX;
// 			}
// 			else
// 			{
// 				this.mapTiles[y][x].deltaTileX -= deltaX;
// 				tileLeft = tileOffset.left - this.mapConfig.tileSize * deltaX;
// 			}

// 			if (this.mapTiles[y][x].deltaTileY == targetYIndex)
// 			{
// 				this.mapTiles[y][x].deltaTileY += (this.mapConfig.numTilesY - 1) * deltaY;
// 				tileTop = tileOffset.top + this.mapConfig.tileSize * (this.mapConfig.numTilesY - 1) * deltaY;
// 			}
// 			else
// 			{
// 				this.mapTiles[y][x].deltaTileY -= deltaY;
// 				tileTop = tileOffset.top - this.mapConfig.tileSize * deltaY;
// 			}

// 			this.mapTiles[y][x].element.offset({
// 				left: tileLeft,
// 				top:  tileTop
// 			});
// 		}
// 	}

// 	this.mapRoot.offset({
// 		left: curOffset.left + this.mapConfig.tileSize * deltaX,
// 		top : curOffset.top  + this.mapConfig.tileSize * deltaY
// 	});

// 	this.shiftLocations(deltaX, deltaY);

// 	this.dragStartLeft -= this.mapConfig.tileSize * deltaX;
// 	this.dragStartTop  -= this.mapConfig.tileSize * deltaY;

// 	this.startTileX += deltaX;
// 	this.startTileY += deltaY;

// 	this.loadMapTilesRowCol(targetXIndex + (this.mapConfig.numTilesX - 1) * deltaX, targetYIndex + (this.mapConfig.numTilesY - 1) * deltaY);
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


// uesp.gamemap.Map.prototype.translateCanvas = function(dx, dy, animate)
// {
// 	dx = Math.floor(dx);
// 	dy = Math.floor(dy);

// 	this.mapTransformX += dx;
// 	this.mapTransformY += dy;

// 		/* TODO: Animate optionally
// 		 *  	window.requestAnimationFrame()
// 		 */
// 	this.mapContext.translate(dx, dy);
// 	this.mapContextGrid.translate(dx, dy);
// }


// uesp.gamemap.Map.prototype.zoomIn = function(x, y)
// {
// 	if (this.USE_CANVAS_DRAW) return this.zoomInCanvas(x, y);

// 	this.updateZoomControlButtons(this.zoomLevel + 1);
// 	if (this.zoomLevel >= this.mapConfig.maxZoomLevel) return;

// 	var curPos = this.getGamePositionOfCenter();

// 	this.zoomLevel++;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoom In (" + x + ", " + y + ") = " + this.zoomLevel);

// 	if (x == null) x = this.mapContainer.width() /2;
// 	if (y == null) y = this.mapContainer.height()/2;

// 	var mapOffset  = this.mapContainer.offset();
// 	var rootOffset = this.mapRoot.offset();

// 	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapConfig.tileSize;
// 	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapConfig.tileSize;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin tile = " + tileX + ", " + tileY);

// 	newTileX = tileX*2 - this.mapConfig.numTilesX/2;
// 	newTileY = tileY*2 - this.mapConfig.numTilesY/2;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newTile = " + newTileX + ", " + newTileY);

// 	this.startTileX = Math.floor(newTileX);
// 	this.startTileY = Math.floor(newTileY);

// 	newOffsetX = Math.round(mapOffset.left + x - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - newTileX) * this.mapConfig.tileSize);
// 	newOffsetY = Math.round(mapOffset.top  + y - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - newTileY) * this.mapConfig.tileSize);
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newOffset = " + newOffsetX + ", " + newOffsetY, mapOffset, this.startTileX);
// 	this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});

// 	this.updateLocations(true);
// 	this.loadMapTiles();
// }


// uesp.gamemap.Map.prototype.zoomInCanvas = function(x, y)
// {
// 	this.updateZoomControlButtons(this.zoomLevel + 1);
// 	if (this.zoomLevel >= this.mapConfig.maxZoomLevel) return;

// 	var curPos = this.getGamePositionOfCenter();

// 	this.zoomLevel++;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoom In (" + x + ", " + y + ") = " + this.zoomLevel);
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin OrigOffset = " + this.mapTransformX + ", " + this.mapTransformY);

// 	if (x == null) x = this.mapCanvas.width/2;
// 	if (y == null) y = this.mapCanvas.height/2;

// 	let tileX = (x - this.mapTransformX) / this.mapConfig.tileSize;
// 	let tileY = (y - this.mapTransformY) / this.mapConfig.tileSize;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin tile = " + tileX + ", " + tileY);

// 	let newOffsetX = x - tileX * 2 * this.mapConfig.tileSize;
// 	let newOffsetY = y - tileY * 2 * this.mapConfig.tileSize;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newOffset = " + newOffsetX + ", " + newOffsetY);

// 	let origTileX = tileX*2 - this.mapConfig.numTilesX/2;
// 	let origTileY = tileY*2 - this.mapConfig.numTilesY/2;

// 	var mapOffset  = this.mapContainer.offset();
// 	var rootOffset = this.mapRoot.offset();

// 	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapConfig.tileSize;
// 	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapConfig.tileSize;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin tile = " + tileX + ", " + tileY);

// 	let newTileX = tileX*2 - this.mapConfig.numTilesX/2;
// 	let newTileY = tileY*2 - this.mapConfig.numTilesY/2;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newTile = " + newTileX + ", " + newTileY);

// 	this.startTileX = Math.floor(origTileX);
// 	this.startTileY = Math.floor(origTileY);
// 	this.startTileCanvasX = this.startTileX;
// 	this.startTileCanvasY = this.startTileY;
// 	this.origStartTileCanvasX = this.startTileX;
// 	this.origStartTileCanvasY = this.startTileY;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin startTile = " + this.startTileX + ", " + this.startTileY);

// 	this.startTileX = 0;
// 	this.startTileY = 0;

// 	let newOffsetX1 = (mapOffset.left + x - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - newTileX) * this.mapConfig.tileSize);
// 	let newOffsetY1 = (mapOffset.top  + y - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - newTileY) * this.mapConfig.tileSize);
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newOffset1 = " + newOffsetX1 + ", " + newOffsetY1, mapOffset, this.startTileX);

// 		/* Fix for slow drift when zooming in/out multiple times */
// 	let diffX = newOffsetX - newOffsetX1;
// 	let diffY = newOffsetY - newOffsetY1;
// 	let newOffsetX2 = newOffsetX - Math.round(diffX / this.mapConfig.tileSize) * this.mapConfig.tileSize + mapOffset.left;
// 	let newOffsetY2 = newOffsetY - Math.round(diffY / this.mapConfig.tileSize) * this.mapConfig.tileSize + mapOffset.top;

// 	//this.mapRoot.offset({ left: newOffsetX2, top: newOffsetY2});

// 	this.resetTranslateCanvas();
// 	this.translateCanvas(newOffsetX, newOffsetY);

// 	this.mapContext.scale(2, 2);
// 	this.clearMapCanvas();
// 	this.redrawCanvas(false);

// 	this.resetTranslateCanvas();
// 	this.translateCanvas(newOffsetX, newOffsetY);

// 	this.updateLocationsCanvas(true);
// 	this.loadMapTiles();

// 	this.redrawCanvas(false);
// }


// uesp.gamemap.Map.prototype.resetTranslateCanvas = function()
// {
// 	this.mapContext.setTransform(1, 0, 0, 1, 0, 0);
// 	this.mapContextGrid.setTransform(1, 0, 0, 1, 0, 0);
// 	this.mapTransformX = 0;
// 	this.mapTransformY = 0;
// }


// uesp.gamemap.Map.prototype.zoomOut = function(x, y)
// {
// 	if (this.USE_CANVAS_DRAW) return this.zoomOutCanvas(x, y);

// 	this.updateZoomControlButtons(this.zoomLevel - 1);
// 	if (this.zoomLevel <= this.mapConfig.minZoomLevel) return;

// 	this.zoomLevel--;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut (" + x + ", " + y + ") = " + this.zoomLevel);

// 	if (x == null) x = this.mapContainer.width() /2;
// 	if (y == null) y = this.mapContainer.height()/2;

// 	var mapOffset  = this.mapContainer.offset();
// 	var rootOffset = this.mapRoot.offset();

// 	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapConfig.tileSize;
// 	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapConfig.tileSize;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut tile = " + tileX + ", " + tileY);

// 	newTileX = tileX/2 - this.mapConfig.numTilesX/2;
// 	newTileY = tileY/2 - this.mapConfig.numTilesY/2;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut newTile = " + newTileX + ", " + newTileY);

// 	this.startTileX = Math.floor(newTileX);
// 	this.startTileY = Math.floor(newTileY);

// 	newOffsetX = Math.round(mapOffset.left + x - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - newTileX) * this.mapConfig.tileSize);
// 	newOffsetY = Math.round(mapOffset.top  + y - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - newTileY) * this.mapConfig.tileSize);
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut newOffset = " + newOffsetX + ", " + newOffsetY);

// 	this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});

// 	this.updateLocations(true);
// 	this.loadMapTiles();
// }


// uesp.gamemap.Map.prototype.zoomOutCanvas = function(x, y)
// {
// 	this.updateZoomControlButtons(this.zoomLevel - 1);
// 	if (this.zoomLevel <= this.mapConfig.minZoomLevel) return;

// 	this.zoomLevel--;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut (" + x + ", " + y + ") = " + this.zoomLevel);

// 	if (x == null) x = this.mapCanvas.width/2;
// 	if (y == null) y = this.mapCanvas.height/2;

// 	let tileX = (x - this.mapTransformX) / this.mapConfig.tileSize;
// 	let tileY = (y - this.mapTransformY) / this.mapConfig.tileSize;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut tile = " + tileX + ", " + tileY);

// 	let newOffsetX = x - tileX / 2 * this.mapConfig.tileSize;
// 	let newOffsetY = y - tileY / 2 * this.mapConfig.tileSize;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut newOffset = " + newOffsetX + ", " + newOffsetY);

// 	let origTileX = tileX/2 - this.mapConfig.numTilesX/2;
// 	let origTileY = tileY/2 - this.mapConfig.numTilesY/2;

// 	var mapOffset  = this.mapContainer.offset();
// 	var rootOffset = this.mapRoot.offset();
// 	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapConfig.tileSize;
// 	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapConfig.tileSize;
// 	let newTileX = tileX/2 - this.mapConfig.numTilesX/2;
// 	let newTileY = tileY/2 - this.mapConfig.numTilesY/2;

// 	this.startTileX = Math.floor(origTileX);
// 	this.startTileY = Math.floor(origTileY);
// 	this.startTileCanvasX = this.startTileX;
// 	this.startTileCanvasY = this.startTileY;
// 	this.origStartTileCanvasX = this.startTileX;
// 	this.origStartTileCanvasY = this.startTileY;
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut startTile = " + this.startTileX + ", " + this.startTileY);

// 	this.startTileX = 0;
// 	this.startTileY = 0;

// 	let newOffsetX1 = (mapOffset.left + x - this.mapConfig.numTilesX /2 * this.mapConfig.tileSize + (this.startTileX - newTileX) * this.mapConfig.tileSize);
// 	let newOffsetY1 = (mapOffset.top  + y - this.mapConfig.numTilesY /2 * this.mapConfig.tileSize + (this.startTileY - newTileY) * this.mapConfig.tileSize);

// 		/* Fix for slow drift when zooming in/out multiple times */
// 	let diffX = newOffsetX - newOffsetX1;
// 	let diffY = newOffsetY - newOffsetY1;
// 	let newOffsetX2 = newOffsetX - Math.round(diffX / this.mapConfig.tileSize) * this.mapConfig.tileSize + mapOffset.left;
// 	let newOffsetY2 = newOffsetY - Math.round(diffY / this.mapConfig.tileSize) * this.mapConfig.tileSize + mapOffset.top;

// 	//this.mapRoot.offset({ left: newOffsetX2, top: newOffsetY2});

// 	this.resetTranslateCanvas();
// 	this.translateCanvas(newOffsetX, newOffsetY);

// 	this.mapContext.scale(0.5, 0.5);
// 	this.clearMapCanvas();
// 	this.redrawCanvas(false);

// 	this.resetTranslateCanvas();
// 	this.translateCanvas(newOffsetX, newOffsetY);

// 	this.updateLocationsCanvas(true);
// 	this.loadMapTiles();
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


// uesp.gamemap.Map.prototype.pan = function (deltaX, deltaY)
// {
// 	if (this.USE_CANVAS_DRAW) return this.panCanvas(deltaX, deltaY);

// 	var self = this;

// 	this.mapRoot.animate({ left: '+=' + deltaX, top: '+=' + deltaY }, 500);

// 	setTimeout(function() {
// 		self.checkTileEdges();
// 		self.updateLocations();
// 		self.loadMapTiles();
// 	}, 600);

// }


// uesp.gamemap.Map.prototype.panCanvas = function (deltaX, deltaY)
// {
// 	let self = this;

// 	this.translateCanvas(deltaX, deltaY);
// 	this.redrawCanvas(true);

// 	this.mapRoot.animate({ left: '+=' + deltaX, top: '+=' + deltaY }, 0);

// 	setTimeout(function() {
// 		self.checkTileEdges();
// 		self.updateLocations();
// 		self.loadMapTiles();
// 	}, 1);
// }


// uesp.gamemap.Map.prototype.panLeft = function ()
// {
// 	this.pan(this.PAN_AMOUNT, 0);
// }


// uesp.gamemap.Map.prototype.panRight = function ()
// {
// 	this.pan(-this.PAN_AMOUNT, 0);
// }


// uesp.gamemap.Map.prototype.panUp = function ()
// {
// 	this.pan(0, this.PAN_AMOUNT);
// }


// uesp.gamemap.Map.prototype.panDown = function ()
// {
// 	this.pan(0, -this.PAN_AMOUNT);
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


// uesp.gamemap.Map.prototype.testGroupMap = function()
// {
// 	var self = this;
// 	var foundMaps = { };
// 	var count = 0;

// 	$("#gmMapList li").not('.gmMapListHeader').each (function () {
// 		var mapName = $(this).text();

// 		if (! (mapName in self.mapWorldDisplayNameIndex))
// 		{
// 			uesp.logError("Group map '" + mapName + "' not found!");
// 			count++;
// 		}
// 		else
// 		{
// 			foundMaps[mapName] = 1;
// 		}
// 	});

// 	if (count == 0)
// 		uesp.logError("No invalid group map names found!");
// 	else
// 		uesp.logError("Found " + count + " invalid group map names!");

// 	count = 0;

// 	for (mapName in self.mapWorldDisplayNameIndex)
// 	{
// 		if (! (mapName in foundMaps))
// 		{
// 			uesp.logError("Map '" + mapName + "' missing from group maps!");
// 			count++;
// 		}
// 	}

// 	if (count == 0)
// 		uesp.logError("No missing group map names found!");
// 	else
// 		uesp.logError("Found " + count + " missing group map names!");

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


// uesp.gamemap.Map.prototype.drawGrid = function()
// {
// 	if (!this.USE_CANVAS_DRAW) return;

// 	this.canvasDrawGrid();
// }


// 	for (var x = this.mapConfig.gridStartX; x <= this.mapConfig.gridStopX; x += deltaX)
// 	{
// 		var pos1 = this.convertGameToPixelPos(x, this.mapConfig.gridStartY);
// 		var pos2 = this.convertGameToPixelPos(x, this.mapConfig.gridStopY);

// 		pos1.x -= this.mapTransformX;
// 		pos2.x -= this.mapTransformX;
// 		pos1.y -= this.mapTransformY + gridOffsetY;
// 		pos2.y -= this.mapTransformY + gridOffsetY;

// 		this.mapContextGrid.beginPath();
// 		this.mapContextGrid.moveTo(pos1.x, pos1.y);
// 		this.mapContextGrid.lineTo(pos2.x, pos2.y);
// 		this.mapContextGrid.lineWidth = 1;
// 		this.mapContextGrid.strokeStyle = this.mapConfig.gridStyle;
// 		this.mapContextGrid.stroke();
// 	}

// 	if (!this.mapConfig.gridShowLabels) return;
// 	if (this.zoomLevel < this.mapConfig.gridStartLabelZoom) return;

// 	var labelStartX = Math.ceil(this.mapConfig.gridStartX / this.mapConfig.gridDeltaX / this.mapConfig.gridLabelDeltaX) * this.mapConfig.gridLabelDeltaX;
// 	var labelStartY = Math.ceil(this.mapConfig.gridStartY / this.mapConfig.gridDeltaY / this.mapConfig.gridLabelDeltaY) * this.mapConfig.gridLabelDeltaY;
// 	var labelEndX = Math.floor(this.mapConfig.gridStopX / this.mapConfig.gridDeltaX / this.mapConfig.gridLabelDeltaX) * this.mapConfig.gridLabelDeltaX;
// 	var labelEndY = Math.floor(this.mapConfig.gridStopY / this.mapConfig.gridDeltaY / this.mapConfig.gridLabelDeltaY) * this.mapConfig.gridLabelDeltaY;

// 	for (var cellY = labelStartY; cellY <= labelEndY; cellY += this.mapConfig.gridLabelDeltaY)
// 	{
// 		var y = cellY * this.mapConfig.gridDeltaY + this.mapConfig.gridLabelOffsetY;

// 		for (var cellX = labelStartX; cellX <= labelEndX; cellX += this.mapConfig.gridLabelDeltaX)
// 		{
// 			var x = cellX * this.mapConfig.gridDeltaX + this.mapConfig.gridLabelOffsetX;
// 			var pos = this.convertGameToPixelPos(x, y);

// 			pos.x += 1 - this.mapTransformX;
// 			pos.y += 10 - this.mapTransformY - gridOffsetY;

// 			gridText = "" + cellX + "," + cellY;

// 			//console.log(gridText, pos.x, pos.y, x, y, cellX, cellY);

// 			this.mapContextGrid.font = "8px Arial";
// 			this.mapContextGrid.textBaseLine = "bottom";
// 			this.mapContextGrid.fillStyle = this.mapConfig.gridStyle;
// 			this.mapContextGrid.fillText(gridText, pos.x, pos.y);
// 		}

// 	}

// }


// uesp.gamemap.Map.prototype.onCellGridClick = function(e)
// {
// 	let self = e.data.self;

// 	self.isDrawGrid = !self.isDrawGrid;

// 	if (self.isDrawGrid)
// 	{
// 		self.drawGrid();
// 	}
// 	else
// 	{
// 		self.clearMapGrid();
// 	}

// 	self.updateCellGridLabel();
// 	self.updateMapLink();
// 	self.drawCellResources();
// }


// uesp.gamemap.Map.prototype.onCellResourceChange = function(list)
// {
// 	var cellResource = $(list).val();

// 	if (cellResource == this.cellResource) return;

// 	this.cellResource = cellResource;

// 	this.showCellResourceGuide(cellResource != "");

// 	this.clearMapGrid();
// 	if (this.isDrawGrid) this.drawGrid();

// 	this.getCellResourceData(cellResource);

// 	this.updateMapLink();
// }



// uesp.gamemap.Map.prototype.getCellResourceData = function(resourceEditorID)
// {
// 	var self = this;

// 	if (resourceEditorID === "") return;

// 	if (this.loadedCellResource == resourceEditorID)
// 	{
// 		this.drawCellResources();
// 		return;
// 	}

// 	var queryParams = { };
// 	queryParams.action = "get_cellresource";
// 	queryParams.db = this.mapConfig.dbPrefix;
// 	queryParams.worldID = this.currentWorldID;
// 	queryParams.editorid = resourceEditorID;

// 	$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {
// 		self.parseGetCellResourceRequest(data, resourceEditorID);
// 	});

// }


// uesp.gamemap.Map.prototype.parseGetCellResourceRequest = function(data, resourceEditorID)
// {
// 	if (data === null || data.isError === true || data.resources === null || data.resources[0] === null)
// 	{
// 		this.showCellResourceGuide(false);
// 		return;
// 	}

// 	this.loadedCellResource = resourceEditorID;
// 	this.cellResourceData = data.resources[0];
// 	this.drawCellResources();
// }


// uesp.gamemap.Map.prototype.onDisplayStateChange = function(displayState)
// {
// 	this.displayState = displayState;

// 	this.loadMapTiles();
// 	this.updateDisplayStateLabel();
// 	this.updateMapLink();
// }


// uesp.gamemap.Map.prototype.updateDisplayStateLabel = function()
// {
// 	var label = $("#gmMapControlDisplayState_" + this.displayState);

// 	$(".gmMapControlDisplayState").removeClass("gmMapControlDisplayStateSelected");
// 	label.addClass("gmMapControlDisplayStateSelected");
// }







