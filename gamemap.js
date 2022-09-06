/*
 * gamemap.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Main source code for the game map system. 
 *
 * TODO:
 * 		- Delete location
 * 		- Enable display of non-visible locations when editing
 * 		- Disable locations when adding path/area points?
 *		- Better cursor icons for adding/deleting path nodes
 *		- Move world editing to world class
 *		- Add edit comment input field
 *		- Add patrolling
 *		- Add reversion of edits
 *
 */


uesp.gamemap.Map = function(mapContainerId, defaultMapOptions, userEvents)
{
	this.defaultMapOptions = uesp.cloneObject(defaultMapOptions);
	this.mapOptions        = new uesp.gamemap.MapOptions(this.defaultMapOptions);
	
	if (userEvents == null)
		this.userEvents = { };
	else
		this.userEvents = userEvents;
	
	this.USE_CANVAS_DRAW = this.mapOptions.useCanvasDraw;
	this.USE_LEAFLET = this.mapOptions.useLeaflet;
	this.PANAMOUNT = this.mapOptions.tileSize;
	
	this.mapRoot = null;
	this.mapCanvas = null;
	this.mapCanvasGrid = null;
	this.mapCanvasElement = null;
	this.mapCanvasGridElement = null;
	this.mapContext = null;
	this.mapContextGrid = null;
	this.mapContainerId = mapContainerId;
	this.mapContainer = $('#' + mapContainerId);
	if (this.mapContainer == null) uesp.logError('The gamemap container \'' + mapContainerId + '\' was not found!');
	
	this.mapListContainer = null;
	this.mapListLastSelectedItem = null;
	
	this.lastCanvasHoverLocation = null;
	
	this.mapKeyElement = null;
	this.helpBlockElement = null;
	
	this.isShowingRecentChanges = false;

	this.recentChangesRoot = null;
	
	this.mapControlRoot = null;
	this.mapSearchRoot  = null;
	this.mapSearchResults = null;
	
	this.mapWorlds = {};
	this.mapWorldNameIndex = {};
	this.mapWorldDisplayNameIndex = {};
	this.mapWorldsLoaded = false;
	this.centerOnError = false;
	
	this.searchText = '';
	this.searchResults = [ ];
	
	this.currentWorldId = 0;
	this.addWorld('__default', this.mapOptions, this.currentWorldId, '');
	
	this.locations = {};
	
	this.zoomLevel = 15;
	this.startTileX = 0;
	this.startTileY = 0;
	this.startTileCanvasX = 0;
	this.startTileCanvasY = 0;
	this.origStartTileCanvasX = 0;
	this.origStartTileCanvasY = 0;
	
	this.isDragging = false;
	this.draggingObject = null;
	this.dragStartLeft = 0;
	this.dragStartTop  = 0;
	this.dragStartLeftCanvas = 0;
	this.dragStartTopCanvas  = 0;
	this.dragStartEventX = 0;
	this.dragStartEventY = 0;
	this.checkTilesOnDrag = true;
	
	this.defaultShowHidden = false;
	
	this.jumpToDestinationOnClick = true;
	this.openPopupOnJump = false;
	
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
	
	this.isPinching = false;
	this.lastPinchDistance = 0;
	
		// This just controls the client-side editing abilities.
		// All security for writes is handled on the server side.
	this.enableEdit = false;
	this.currentEditMode = '';
	this.editNoticeDiv = null;
	this.nextNewLocationId = -100;
	this.editClickWall = null;
	this.currentEditLocation = null;
	this.currentEditPathPoints = null;
	this.worldEditPopup = null;
	this.currentEditWorld = null;
	
	this.isDrawGrid = false;
	this.cellResource = "";
	this.loadedCellResource = "";
	this.cellResourceData = {};
	
	this.autoGenerateWorldGroupList = true;
	this.worldGroupListContents = '';
	this.helpBlockContents = '';
	
	this.mapTiles = [];
	
	this.displayState = "";
	
	this.queryParams = uesp.parseQueryParams();
	
	this.requestPermissions();
	this.retrieveWorldData();
	
	if (this.queryParams.centeron != null)
	{
		this.retrieveCenterOnLocation(this.queryParams.world, this.queryParams.centeron);
	}
	
	if (this.USE_LEAFLET) this.initializeLeaflet();
	
	this.createMapRoot();
	this.createMapTiles();
	this.createMapControls();
	this.createSearchControls();
	this.createRecentChanges();
	//this.createMapList(this.mapContainer);
	this.createEvents();
	
	this.setGamePosNoUpdate(this.mapOptions.initialGamePosX, this.mapOptions.initialGamePosY, this.mapOptions.initialZoom);
	this.updateMapStateFromQuery(false);
}


uesp.gamemap.Map.prototype.initializeLeaflet = function()
{
	$('<div />').attr('id', 'gmMapLeafletRoot').appendTo(this.mapContainer);
	this.leafletMap = L.map("gmMapLeafletRoot", { crs: L.CRS.Simple });
	//this.leafletMap = L.map("gmMapLeafletRoot", );
	this.leafletMap.setView([1, 1], 16);
	
	L.tileLayer(this.mapOptions.leafletTileLayer, {
	    maxZoom: 17,
	    id: 'mapbox.streets',
	}).addTo(this.leafletMap);
}


uesp.gamemap.Map.prototype.isShowHidden = function ()
{
	if (this.queryParams.showhidden >= 1) return true;
	return this.defaultShowHidden;
}


uesp.gamemap.Map.prototype.hasCenterOnParam = function ()
{
	return this.queryParams.centeron != null && this.queryParams.centeron !== '' && !this.centerOnError;
}


uesp.gamemap.Map.prototype.addWorld = function (worldName, mapOptions, worldId, displayName)
{
	this.mapWorlds[worldId] = new uesp.gamemap.World(worldName.toLowerCase(), this.defaultMapOptions, worldId);
	this.mapWorlds[worldId].mergeMapOptions(mapOptions);
	
	this.mapWorldNameIndex[worldName.toLowerCase()] = worldId;
	if (displayName != null) this.mapWorldDisplayNameIndex[displayName] = worldId;
}


uesp.gamemap.Map.prototype.createMapList = function (parentObject)
{
	var self = this;
	var listHtml = 	"<div id='gmMapListTitle'>" +
						"Map List" +
						"<div id='gmMapListButtonAlpha'>Alpha</div>" +
						"<div id='gmMapListButtonGroup' class='gmMapListButtonSelect'>Group</div>" +
					"</div>" +
					"<div id='gmMapListAlpha' style='display: none;'>" +
						"<form><select id='gmMapListAlphaSelect' size='4'></select></form>" + 
					"</div>" +
					"<div id='gmMapListGroup'>" + 
					"<ul id='gmMapList'>" +
						"<li>Loading world data...</li>" + 
					"</ul></div>";
	
	this.mapListContainer = $('<div />')
								.attr('id', 'gmMapListContainer')
								.appendTo(parentObject);
	
	this.mapListContainer.html(listHtml);
	
	$('#gmMapListButtonAlpha').bind("touchstart click", function(e) {
		$('#gmMapListButtonAlpha').addClass('gmMapListButtonSelect');
		$('#gmMapListButtonGroup').removeClass('gmMapListButtonSelect');
		$('#gmMapListAlpha').show();
		$('#gmMapListGroup').hide();
		$('#gmMapListAlphaSelect').focus();
		return false;
	});
	
	$('#gmMapListButtonGroup').bind("touchstart click", function(e) {
		$('#gmMapListButtonGroup').addClass('gmMapListButtonSelect');
		$('#gmMapListButtonAlpha').removeClass('gmMapListButtonSelect');
		$('#gmMapListGroup').show();
		$('#gmMapListAlpha').hide();
		$('#gmMapListGroup').focus();
		
		selItem = $('#gmMapList li.gmMapListSelect');
		if (selItem == null) return false;
		
		container = $('#gmMapListGroup');
		container.scrollTop(selItem.offset().top - container.offset().top + container.scrollTop() - 200);
		return false;
	});
	
	$('#gmMapListAlphaSelect').change(function(e) {
		var result = parseInt(this.options[this.selectedIndex].value);
		self.changeWorld(result);
		
		self.hideMapList();
	});
	
	return true;
}


uesp.gamemap.Map.prototype.canEdit = function ()
{
	return this.enableEdit;
}


uesp.gamemap.Map.prototype.updateMapLink = function ()
{
	let linkElement = $(this.mapOptions.mapLinkElement);
		
	if (linkElement != null)
	{
		linkElement.attr('href', this.createMapLink());
	}
	
	wikiLinkElement = $('#gmMapWikiLink');
	
	if (wikiLinkElement != null)
	{
		wikiLinkElement.attr('href', this.createMapWikiLink());
	}
	
	return true;
}


uesp.gamemap.Map.prototype.createMapWikiLink = function ()
{
	if (! (this.currentWorldId in this.mapWorlds)) return '';
	
	wikiPage = this.mapWorlds[this.currentWorldId].wikiPage;
	if (wikiPage == null || wikiPage == '') wikiPage = this.mapWorlds[this.currentWorldId].displayName;
	
	nameSpace = '';
	if (this.mapOptions.wikiNamespace != null && this.mapOptions.wikiNamespace != '') nameSpace = this.mapOptions.wikiNamespace + ':';
	
	wikiPage = encodeURIComponent (wikiPage);
	
	return this.mapOptions.wikiUrl + nameSpace + wikiPage;
}


uesp.gamemap.Map.prototype.createMapLink = function (mapState)
{
	var mapLink = this.mapOptions.mapUrl;
	
	if (mapState == null) mapState = this.getMapState();
	
	mapLink += '?world=' + mapState.worldId;
	mapLink += '&x=' + mapState.gamePos.x;
	mapLink += '&y=' + mapState.gamePos.y;
	mapLink += '&zoom=' + mapState.zoomLevel;
	
	if (mapState.grid) mapLink += "&grid=true";
	if (mapState.cellResource != "") mapLink += "&cellResource=" + mapState.cellResource;
	if (mapState.displayState != "") mapLink += "&displayState=" + mapState.displayState;
	
	return mapLink;
}


uesp.gamemap.Map.prototype.changeWorld = function (world, newState)
{
	worldId = this.getWorldId(world);
	if (worldId == this.currentWorldId) return;
	if (worldId <= 0) return uesp.logError("Unknown world #" + worldId + " received!");
	
	if (this.currentWorldId in this.mapWorlds)
	{
		this.mapWorlds[this.currentWorldId].mapState   = this.getMapState();
		this.mapWorlds[this.currentWorldId].mapOptions = this.mapOptions;
	}
	
	if (! (worldId in this.mapWorlds)) return uesp.logError("Unknown world ID " + worldId + "!");
	
	this.clearLocationElements();
	
	this.currentWorldId = worldId;
	this.mapOptions = this.mapWorlds[this.currentWorldId].mapOptions;
	
	if (newState == null)
		this.setMapState(this.mapWorlds[this.currentWorldId].mapState);
	else
		this.setMapState(newState);
	
	if (this.userEvents.onMapWorldChanged != null) this.userEvents.onMapWorldChanged.call(this, this.mapWorlds[this.currentWorldId]);
}


uesp.gamemap.Map.prototype.checkTileEdges = function ()
{
	if (this.USE_CANVAS_DRAW) return this.checkTileEdgesCanvas();
	
	tilesLeft = 0;
	tilesRight = 0;
	tilesTop = 0;
	tilesBottom = 0;
	
	extraX = this.mapOptions.tileCountX * this.mapOptions.tileSize - this.mapContainer.width();
	extraY = this.mapOptions.tileCountY * this.mapOptions.tileSize - this.mapContainer.height();
	
	tilesLeft = -Math.floor(this.mapRoot.offset().left / this.mapOptions.tileSize) - 1;
	tilesTop  = -Math.floor(this.mapRoot.offset().top  / this.mapOptions.tileSize) - 1;
	tilesRight  = Math.floor((extraX + this.mapRoot.offset().left) / this.mapOptions.tileSize);
	tilesBottom = Math.floor((extraY + this.mapRoot.offset().top)  / this.mapOptions.tileSize);
	
	if (tilesRight < this.mapOptions.tileEdgeLoadCount)
	{
		this.shiftMapTiles(1, 0);
	}
	else if (tilesLeft < this.mapOptions.tileEdgeLoadCount)
	{
		this.shiftMapTiles(-1, 0);
	}
	
	if (tilesTop < this.mapOptions.tileEdgeLoadCount)
	{
		this.shiftMapTiles(0, -1);
	}
	else if (tilesBottom < this.mapOptions.tileEdgeLoadCount)
	{
		this.shiftMapTiles(0, 1);
	}
}


uesp.gamemap.Map.prototype.checkTileEdgesCanvas = function ()
{
	let tilesLeft = 0;
	let tilesRight = 0;
	let tilesTop = 0;
	let tilesBottom = 0;
	
	tilesLeft = -(this.startTileCanvasX + Math.floor(this.mapTransformX / this.mapOptions.tileSize));
	tilesTop  = -(this.startTileCanvasY + Math.floor(this.mapTransformY / this.mapOptions.tileSize));
	tilesRight  = this.canvasTileCountX - tilesLeft - Math.floor(this.mapCanvas.width / this.mapOptions.tileSize);
	tilesBottom = this.canvasTileCountY - tilesTop - Math.floor(this.mapCanvas.height / this.mapOptions.tileSize);
	
	if (tilesRight < this.mapOptions.tileEdgeLoadCount)
	{
		this.loadMapTilesCanvasRowCol(0, 1, 0, 0);
	}
	else if (tilesLeft < this.mapOptions.tileEdgeLoadCount)
	{
		this.loadMapTilesCanvasRowCol(1, 0, 0, 0);
	}
	
	if (tilesTop < this.mapOptions.tileEdgeLoadCount)
	{
		this.loadMapTilesCanvasRowCol(0, 0, 1, 0);
	}
	else if (tilesBottom < this.mapOptions.tileEdgeLoadCount)
	{
		this.loadMapTilesCanvasRowCol(0, 0, 0, 1);
	}
}


uesp.gamemap.Map.prototype.clearLocations = function()
{
	this.clearLocationElements();
	this.locations = {};
}


uesp.gamemap.Map.prototype.clearLocationElements = function()
{
	for (key in this.locations)
	{
		this.locations[key].removeElements();
	}
}


uesp.gamemap.Map.prototype.convertGameToTilePos = function(gameX, gameY)
{
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	var tileX = 0;
	var tileY = 0;	
	
	tileX = (gameX - this.mapOptions.gamePosX1) * maxTiles / (this.mapOptions.gamePosX2 - this.mapOptions.gamePosX1);
	tileY = (gameY - this.mapOptions.gamePosY1) * maxTiles / (this.mapOptions.gamePosY2 - this.mapOptions.gamePosY1);
	
	return new uesp.gamemap.Position(tileX, tileY);
}


uesp.gamemap.Map.prototype.convertGameToPixelSize = function(width, height)
{
	var pixelW = 0;
	var pixelH = 0;
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	
	pixelW = Math.round(width  * maxTiles / Math.abs(this.mapOptions.gamePosX2 - this.mapOptions.gamePosX1) * this.mapOptions.tileSize);
	pixelH = Math.round(height * maxTiles / Math.abs(this.mapOptions.gamePosY2 - this.mapOptions.gamePosY1) * this.mapOptions.tileSize);
	
	return new uesp.gamemap.Position(pixelW, pixelH);
}


uesp.gamemap.Map.prototype.convertGameToPixelPos = function(gameX, gameY)
{
	mapOffset = this.mapRoot.offset();
	tilePos = this.convertGameToTilePos(gameX, gameY);
	
	if (this.USE_CANVAS_DRAW)
	{
		xPos = Math.round((tilePos.x - this.startTileX) * this.mapOptions.tileSize);
		yPos = Math.round((tilePos.y - this.startTileY) * this.mapOptions.tileSize);
	}
	else
	{
		xPos = Math.round((tilePos.x - this.startTileX) * this.mapOptions.tileSize + mapOffset.left);
		yPos = Math.round((tilePos.y - this.startTileY) * this.mapOptions.tileSize + mapOffset.top);
	}
	
	return new uesp.gamemap.Position(xPos, yPos);
}


uesp.gamemap.Map.prototype.convertTileToGamePos = function(tileX, tileY)
{
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	var gameX = 0;
	var gameY = 0;	
	
	gameX = Math.round(tileX / maxTiles * (this.mapOptions.gamePosX2 - this.mapOptions.gamePosX1) + this.mapOptions.gamePosX1);
	gameY = Math.round(tileY / maxTiles * (this.mapOptions.gamePosY2 - this.mapOptions.gamePosY1) + this.mapOptions.gamePosY1);
	
	return new uesp.gamemap.Position(gameX, gameY);
}


uesp.gamemap.Map.prototype.convertPixelToGamePos = function(pixelX, pixelY)
{
	mapOffset = this.mapRoot.offset();
	
	if (this.USE_CANVAS_DRAW)
	{
		tileX = (pixelX - this.mapTransformX) / this.mapOptions.tileSize + this.startTileX;
		tileY = (pixelY - this.mapTransformY) / this.mapOptions.tileSize + this.startTileY;
	}
	else
	{
		tileX = (pixelX - mapOffset.left) / this.mapOptions.tileSize + this.startTileX;
		tileY = (pixelY - mapOffset.top)  / this.mapOptions.tileSize + this.startTileY;
	}
	
	return this.convertTileToGamePos(tileX, tileY);
}


uesp.gamemap.Map.prototype.convertWindowPixelToGamePos = function(pixelX, pixelY)
{
	mapOffset = this.mapRoot.offset();
	
	if (this.USE_CANVAS_DRAW)
	{
		tileX = (pixelX - this.mapTransformX - mapOffset.left) / this.mapOptions.tileSize + this.startTileX;
		tileY = (pixelY - this.mapTransformY - mapOffset.top) / this.mapOptions.tileSize + this.startTileY;
	}
	else
	{
		tileX = (pixelX - mapOffset.left) / this.mapOptions.tileSize + this.startTileX;
		tileY = (pixelY - mapOffset.top)  / this.mapOptions.tileSize + this.startTileY;
	}
	
	return this.convertTileToGamePos(tileX, tileY);
}


uesp.gamemap.Map.prototype.onResize = function(event)
{
	let self = event.data.self;
	
	let canvasWidth = self.mapContainer.width();
	let canvasHeight = self.mapContainer.height();
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "OnResize: " + canvasWidth + ", " + canvasHeight);
	
	$(self.mapCanvas).attr('width', canvasWidth).
						attr('height', canvasHeight).
						css('width', canvasWidth).
						css('height', canvasHeight);
	
	$(self.mapCanvasGrid).attr('width', canvasWidth).
						attr('height', canvasHeight).
						css('width', canvasWidth).
						css('height', canvasHeight);
	
	let worldName = self.mapWorlds[self.currentWorldId].name;
	let canvasBGColor = self.mapOptions.canvasBGColor;
	if (self.mapOptions.canvasBGColorFunction !== null) canvasBGColor = self.mapOptions.canvasBGColorFunction(worldName, self.displayState);
	
	if (self.mapContext)
	{
		self.mapContext.fillStyle = canvasBGColor;
		self.mapContext.fillRect(0, 0, self.mapCanvas.width, self.mapCanvas.height);
	
		self.mapContext.translate(self.mapTransformX, self.mapTransformY);
		self.mapContextGrid.translate(self.mapTransformX, self.mapTransformY);
	}
	
	self.redrawCanvas(true);
}


uesp.gamemap.Map.prototype.onDocReady = function()
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onDocReady");
	
	if (this.USE_CANVAS_DRAW)
	{
		let event = {};
		event.data = {};
		event.data.self = this;
		
		this.onResize(event);
		this.redrawCanvas(true);
	}
}


uesp.gamemap.Map.prototype.createEvents = function()
{
	let self = this;
	
	$(window).on("mousemove", { self: this }, this.onMouseMove);
	$(window).on("touchmove", { self: this }, this.onTouchMove);
	$('.gmMapTile').on("mousedown", { self: this }, this.onMouseDown);
	$('.gmMapTile').on("touchstart", { self: this }, this.onTouchStart);
	$('.gmMapTile').on("click", { self: this }, this.onClick);
	
	if (this.USE_CANVAS_DRAW)
	{
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
	
	$(window).on("mouseup", { self: this }, this.onMouseUp);
	$(window).on("touchend touchcancel", { self: this }, this.onTouchEnd);
	
	if (!this.USE_LEAFLET)
	{
		this.mapRoot.on('DOMMouseScroll mousewheel', { self: this }, this.onMouseScroll);
	}
	
	this.mapContainer.on("contextmenu", {self: this}, this.onRightClick);
	
	$(window).on("keyup", { self: this }, this.onKeyUp);
	$(window).on("keydown", { self: this }, this.onKeyDown);
	
	$(window).on('resize', { self: this }, this.onResize);
	
	$(document).ready(function() {
			self.onDocReady();
		});
	
	$('.gmMapTile').dblclick({ self: this }, this.onDoubleClick);
}


uesp.gamemap.Map.prototype.createMapRoot = function()
{
	if (this.USE_LEAFLET) return;
		
	this.mapRoot = $('<div />').attr('id', 'gmMapRoot').appendTo(this.mapContainer);
	
	if (this.USE_CANVAS_DRAW) this.createMapCanvas();
}


uesp.gamemap.Map.prototype.createMapCanvas = function()
{
	let canvasWidth = this.mapContainer.width();
	let canvasHeight = this.mapContainer.height();
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "createMapCanvas: " + canvasWidth + ", " + canvasHeight);
	
	this.mapCanvas = $('<canvas />').
						attr('id', 'gmMapCanvas').
						attr('width', canvasWidth).
						attr('height', canvasHeight).
						css('width', canvasWidth).
						css('height', canvasHeight).
						css('cursor', "url(grab.cur) 8 8, default").
						appendTo(this.mapContainer)[0];
	
	this.mapCanvasGrid = $('<canvas />').
						attr('id', 'gmMapCanvasGrid').
						attr('width', canvasWidth).
						attr('height', canvasHeight).
						css('width', canvasWidth).
						css('height', canvasHeight).
						css('cursor', "url(grab.cur) 8 8, default").
						appendTo(this.mapContainer)[0];
	
	this.mapCanvasElement = $("#gmMapCanvas");
	this.mapCanvasGridElement = $("#gmMapCanvasGrid");
	
	this.mapContext = this.mapCanvas.getContext("2d");
	this.mapContextGrid = this.mapCanvasGrid.getContext("2d");
	
	this.mapContext.fillStyle = this.mapOptions.canvasBGColor;
	this.mapContext.fillRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
}


uesp.gamemap.Map.prototype.clearMapCanvas = function()
{
	this.mapContext.save();
	this.mapContext.setTransform(1, 0, 0, 1, 0, 0);
	
	let worldName = this.mapWorlds[this.currentWorldId].name;
	let canvasBGColor = this.mapOptions.canvasBGColor;
	if (this.mapOptions.canvasBGColorFunction !== null) canvasBGColor = this.mapOptions.canvasBGColorFunction(worldName, this.displayState);
	
	this.mapContext.fillStyle = canvasBGColor;
	this.mapContext.fillRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
	
	this.mapContext.restore();
	
	
	this.mapContextGrid.save();
	this.mapContextGrid.setTransform(1, 0, 0, 1, 0, 0);
	
	this.mapContextGrid.clearRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
	
	this.mapContextGrid.restore();
}


uesp.gamemap.Map.prototype.clearMapGrid = function()
{
	if (!this.USE_CANVAS_DRAW) return;
	return this.clearMapGridCanvas();
}


uesp.gamemap.Map.prototype.clearMapGridCanvas = function()
{
	this.mapContextGrid.save();
	this.mapContextGrid.setTransform(1, 0, 0, 1, 0, 0);
	this.mapContextGrid.clearRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
	this.mapContextGrid.restore();
}


uesp.gamemap.Map.prototype.createMapTiles = function()
{
	if (this.USE_LEAFLET) return;
	if (this.USE_CANVAS_DRAW) return;
	
	offsetX = this.mapContainer.offset().left;
	offsetY = this.mapContainer.offset().top;
	
	this.mapTiles = [];
	
	for (y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		this.mapTiles.push([]);
		this.mapTiles[y].push( new Array(this.mapOptions.tileCountX));
		
		for (x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			this.mapTiles[y][x] = this.createMapTile(x, y);
		}
	}
	
}


uesp.gamemap.Map.prototype.createMapTile = function(x, y)
{
	var newTile = new uesp.gamemap.MapTile(x, y);
	
	xPos = x * this.mapOptions.tileSize + offsetX;
	yPos = y * this.mapOptions.tileSize + offsetY;
	tileID = "Tile_" + x + "_" + y;
	
	newDiv = $('<div />').addClass('gmMapTile').attr('id', tileID)
					.appendTo(this.mapRoot)
					.offset({ top: yPos, left: xPos })
					.attr('unselectable', 'on')
					.attr('deltax', x)
					.attr('deltay', y)
					.css('user-select', 'none')
					.on('selectstart', false);
	
	//if (uesp.debug) newDiv.text(tileID);
	newTile.element = newDiv;
	
	return newTile;
}


uesp.gamemap.onLoadIconSuccess = function(event)
{
	event.data.updateOffset();
	$(this).show();
}


uesp.gamemap.onLoadIconFailed = function(missingURL)
{
	return function() {
		$(this).attr('src', missingURL);
	};
}


uesp.gamemap.Map.prototype.displayLocation = function (location)
{
	if (location.worldId != this.currentWorldId) return;
	if (!location.visible && !this.isShowHidden()) return;
	
	location.computeOffset();
	location.update();
}


uesp.gamemap.Map.prototype.dumpTileIndices = function()
{
	for (y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		var LineString = "";
		
		for (x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			LineString += "(" + this.mapTiles[y][x].deltaTileX + ","+ this.mapTiles[y][x].deltaTileX + ") ";
		}
		
		uesp.logDebug(uesp.LOG_LEVEL_WARNING, LineString);
	}
}


function compareMapWorld (a, b)
{
	if (a < b) return -1;
	if (a > b) return 1;
	return 0;
}


uesp.gamemap.Map.prototype.fillWorldList = function(ElementID)
{
	TargetList = $(ElementID);
	if (TargetList == null) return false;
	
	var tmpWorldList = [];
	
	for (key in this.mapWorlds)
	{
		if (this.mapWorlds[key].name[0] != '_' && key > 0) tmpWorldList.push(this.mapWorlds[key].name);
	}
	
	tmpWorldList.sort(compareMapWorld);
	TargetList.empty();
	
	for (i = 0; i < tmpWorldList.length; ++i)
	{
		world = this.mapWorlds[this.mapWorldNameIndex[tmpWorldList[i]]];
		if (world == null) continue;
		
		TargetList.append($("<option></option>")
					.attr("value", world.id)
					.text(world.displayName)); 
	}
	
	return true;
}


uesp.gamemap.Map.prototype.getGamePositionOfCenter = function()
{
	var rootOffset = this.mapRoot.offset();
	var mapOffset  = this.mapContainer.offset();
	
	rootCenterX = this.mapContainer.width() /2 + mapOffset.left - rootOffset.left;
	rootCenterY = this.mapContainer.height()/2 + mapOffset.top  - rootOffset.top;
	
	tileX = rootCenterX / this.mapOptions.tileSize + this.startTileX;
	tileY = rootCenterY / this.mapOptions.tileSize + this.startTileY;
	
	return this.convertTileToGamePos(tileX, tileY);
}


uesp.gamemap.Map.prototype.getMapStateFromQuery = function (defaultMapState)
{
	var gamePos = this.getGamePositionOfCenter();
	var gameX   = gamePos.x;
	var gameY   = gamePos.y;
	var zoom    = this.zoomLevel;
	var worldId = this.currentWorldId;
	var grid    = this.isDrawGrid;
	var cellResource = this.cellResource;
	var displayState = this.displayState;
	
	if ( !(defaultMapState == null) )
	{
		gameX   = defaultMapState.gamePos.x;
		gameY   = defaultMapState.gamePos.y;
		zoom    = defaultMapState.zoomLevel;
		worldId = defaultMapState.worldId;
		grid    = defaultMapState.grid;
		cellResource = defaultMapState.cellResource;
		displayState = defaultMapState.displayState;
	}
	
	if (this.queryParams.x != null && this.queryParams.y != null)
	{
		gameX = parseInt(this.queryParams.x);
		gameY = parseInt(this.queryParams.y);
		if (this.queryParams.zoom == null) zoom = 15;
	}
	
	if (this.queryParams.zoom != null) zoom = parseInt(this.queryParams.zoom);
	
	if ( ! (this.queryParams.world == null))
	{
		worldId = this.getWorldId(this.queryParams.world);
	}
	
	if ( ! (this.queryParams.world == null))
	{
		worldId = this.getWorldId(this.queryParams.world);
	}
	
	if ( ! (this.queryParams.grid == null))
	{
		if (this.queryParams.grid == "true")
			grid = true;
		else if (this.queryParams.grid == "false")
			grid = false;
	}
	
	if ( ! (this.queryParams.cellResource == null))
	{
		//TODO
		cellResource = this.queryParams.cellResource;
	}
	
	if ( ! (this.queryParams.displayState == null))
	{
		displayState = this.queryParams.displayState;
	}

	var newState = new uesp.gamemap.MapState();
	
	newState.gamePos.x = gameX;
	newState.gamePos.y = gameY;
	newState.zoomLevel = zoom;
	newState.worldId   = worldId;
	newState.grid      = grid;
	newState.cellResource = cellResource;
	newState.displayState = displayState;
	
	return newState;
}


uesp.gamemap.Map.prototype.getTilePositionOfCenter = function()
{
	var gamePos = this.getGamePositionOfCenter();
	var tilePos = this.convertGameToTilePos(gamePos.x, gamePos.y);
	
	return tilePos;
}


uesp.gamemap.Map.prototype.getMapBounds = function()
{
	var rootOffset = this.mapRoot.offset();
	var mapOffset  = this.mapContainer.offset();
	var width  =  this.mapContainer.width();
	var height =  this.mapContainer.height();
	
	leftTile = this.startTileX + (mapOffset.left - rootOffset.left - this.mapTransformX)/this.mapOptions.tileSize;
	topTile  = this.startTileY + (mapOffset.top  - rootOffset.top  - this.mapTransformY)/this.mapOptions.tileSize;
	
	rightTile   = this.startTileX + (mapOffset.left - rootOffset.left + width  - this.mapTransformX)/this.mapOptions.tileSize;
	bottomTile  = this.startTileY + (mapOffset.top  - rootOffset.top  + height - this.mapTransformY)/this.mapOptions.tileSize;
	
	//this.startTileX + this.mapOptions.tileCountX, this.startTileY + this.mapOptions.tileCountY
		
	leftTop     = this.convertTileToGamePos(leftTile, topTile);
	rightBottom = this.convertTileToGamePos(rightTile, bottomTile);

	return new uesp.gamemap.Bounds(leftTop.x, leftTop.y, rightBottom.x, rightBottom.y);
}


uesp.gamemap.Map.prototype.getMapRootBounds = function()
{
	leftTop     = this.convertTileToGamePos(this.startTileX, this.startTileY);
	rightBottom = this.convertTileToGamePos(this.startTileX + this.mapOptions.tileCountX, this.startTileY + this.mapOptions.tileCountY);
	
	return new uesp.gamemap.Bounds(leftTop.x, leftTop.y, rightBottom.x, rightBottom.y);
}


uesp.gamemap.Map.prototype.getMapState = function()
{
	var mapState = new uesp.gamemap.MapState();
	
	mapState.zoomLevel    = this.zoomLevel;
	mapState.gamePos      = this.getGamePositionOfCenter();
	mapState.worldId      = this.currentWorldId;
	mapState.grid         = this.isDrawGrid;
	mapState.cellResource = this.cellResource;
	mapState.displayState = this.displayState;
	
	return mapState;
}


uesp.gamemap.Map.prototype.getWorldMapState = function(world)
{
	var worldId = this.getWorldId(world);
	if (worldId <= 0) return null;
	
	return this.mapWorlds[worldId].mapState;
}


uesp.gamemap.Map.prototype.hasLocation = function(locId)
{
	return locId in this.locations;
}


uesp.gamemap.Map.prototype.hasWorld = function(worldId)
{
	return worldId in this.mapWorlds;
}


uesp.gamemap.Map.prototype.isGamePosInBounds = function(gamePos)
{
	if (uesp.gamemap.isNullorUndefined(gamePos.x) || uesp.gamemap.isNullorUndefined(gamePos.y)) return false;
	
	if (this.mapOptions.gamePosX1 < this.mapOptions.gamePosX2)
	{
		if (gamePos.x < this.mapOptions.gamePosX1 || gamePos.x > this.mapOptions.gamePosX2) return false;
	}
	else
	{
		if (gamePos.x > this.mapOptions.gamePosX1 || gamePos.x < this.mapOptions.gamePosX2) return false;
	}
		
	if (this.mapOptions.gamePosY1 < this.mapOptions.gamePosY2)
	{
		if (gamePos.y < this.mapOptions.gamePosY1 || gamePos.y > this.mapOptions.gamePosY2) return false;
	}
	else
	{
		if (gamePos.y > this.mapOptions.gamePosY1 || gamePos.y < this.mapOptions.gamePosY2) return false;
	}
	
	return true;
}


uesp.gamemap.Map.prototype.isValidZoom = function(zoom)
{
	if (uesp.gamemap.isNullorUndefined(zoom)) return false;
	return zoom >= this.mapOptions.minZoomLevel && zoom <= this.mapOptions.maxZoomLevel;
}


uesp.gamemap.onMapTileLoadFunction = function (element, imageURL) 
{
	return function() {
		$(this).remove();
		element.css('background-image', 'url(' + imageURL + ')');
	};
}


uesp.gamemap.onMapTileLoadFunctionEx = function (element, imageURL, gameMap, origZoomLevel, origWorldId) 
{
	return function() {
		$(this).remove();
		if (gameMap.zoomLevel != origZoomLevel || gameMap.currentWorldId != origWorldId) return;
		element.css('background-image', 'url(' + imageURL + ')');
	};
}


uesp.gamemap.Map.prototype.onJumpToDestinationLoad = function (eventData)
{
	if (eventData.destId == null) return;
	this.jumpToDestination(eventData.destId, eventData.openPopup, eventData.useEditPopup);
}



uesp.gamemap.Map.prototype.jumpToWorld = function (worldId)
{
	if (worldId == null || worldId <= 0) return;
	this.changeWorld(worldId);
}


uesp.gamemap.Map.prototype.jumpToDestination = function (destId, openPopup, useEditPopup)
{
	if (destId == null || destId == 0) return;
	
	if (destId < 0)
	{
		return this.jumpToWorld(-destId);
	}
	
	if (!this.hasLocation(destId))
	{
		uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Don't have data for destination location #" + destId + "!");
		this.retrieveLocation(destId, this.onJumpToDestinationLoad, { destId: destId, openPopup:openPopup, useEditPoup:useEditPopup });
		return;
	}
	
	var newState = new uesp.gamemap.MapState;
	var destLoc  = this.locations[destId];
	
	newState.worldId = destLoc.worldId;
	newState.gamePos.x = destLoc.x;
	newState.gamePos.y = destLoc.y;
	
	newState.zoomLevel = this.zoomLevel;
	if (newState.zoomLevel < destLoc.displayLevel) newState.zoomLevel = destLoc.displayLevel;
	
	this.setMapState(newState);
	
	if (openPopup === true || (this.openPopupOnJump && (destLoc.displayData.labelPos != 0 || destLoc.iconType != 0)))
	{
		if (useEditPopup === true) destLoc.useEditPopup = true;
		destLoc.showPopup();
	}
}


uesp.gamemap.Map.prototype.loadMapTiles = function()
{
	if (this.USE_CANVAS_DRAW) return this.loadMapTilesCanvas();
	
	if (this.mapOptions.getMapTileFunction == null) return;
	var self = this;
	
	if (!(this.currentWorldId in this.mapWorlds))
	{
		uesp.logError("Unknown worldID " + this.currentWorldId + "!");
		return;
	}
	
	var world = this.mapWorlds[this.currentWorldId];
	var worldName = world.name;
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	var isFakeMaxZoom = false;
	
	var missingTile = this.mapOptions.missingMapTile;
	if (this.mapOptions.missingMapTileFunction !== null) missingTile = this.mapOptions.missingMapTileFunction(worldName, this.displayState);
	
	if (this.zoomLevel == world.maxZoom && this.mapOptions.useFakeMaxZoom)
	{
		isFakeMaxZoom = true;
	}
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "worldID: " + this.currentWorldId + " worldName: " + worldName);
			
	for (var y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		for (var x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			var tileX = this.mapTiles[y][x].deltaTileX + this.startTileX;
			var tileY = this.mapTiles[y][x].deltaTileY + this.startTileY;
			
			//if (tileX < 0 || tileY < 0 || tileX >= maxTiles || tileY >= maxTiles)
			if (tileX < 0 || tileY < 0)
			{
				this.mapTiles[y][x].element.css("background-image", "url(" + missingTile + ")");
				continue;
			}
			
			var imageURL = this.mapOptions.getMapTileFunction(tileX, tileY, this.zoomLevel, worldName, this.displayState);
			var element  = this.mapTiles[y][x].element;
			
			if (isFakeMaxZoom)
			{
				var xPos = "left";
				var yPos = "top";
				
				if (tileX % 2 == 1) xPos = "right";
				if (tileY % 2 == 1) yPos = "bottom";
				
				element.css("background-size", "200%");
				element.css("background-position", xPos + " " + yPos);
				
				imageURL = this.mapOptions.getMapTileFunction(Math.floor(tileX/2), Math.floor(tileY/2), this.zoomLevel-1, worldName, this.displayState);
				
				$('<img/>').attr('src', imageURL)
					.load(uesp.gamemap.onMapTileLoadFunctionEx(element, imageURL, this, this.zoomLevel, this.currentWorldId))
					.error(uesp.gamemap.onMapTileLoadFunction(element, missingTile));
			}
			else
			{
				element.css("background-size", "");
				element.css("background-position", "");
				
				$('<img/>').attr('src', imageURL)
					.load(uesp.gamemap.onMapTileLoadFunctionEx(element, imageURL, this, this.zoomLevel, this.currentWorldId))
					.error(uesp.gamemap.onMapTileLoadFunction(element, missingTile));
			}
			
		}
	}
}


uesp.gamemap.Map.prototype.clearOldCanvasTiles = function()
{
	for (var i in this.canvasImages)
	{
		let image = this.canvasImages[i];
		image.image.showTile = false;
	}
}


uesp.gamemap.Map.prototype.loadMapTilesCanvas = function()
{
	if (this.mapOptions.getMapTileFunction == null) return;
	var self = this;
	
	if (!(this.currentWorldId in this.mapWorlds))
	{
		uesp.logError("Unknown worldID " + this.currentWorldId + "!");
		return;
	}
	
	this.clearOldCanvasTiles();
	
	var worldName = this.mapWorlds[this.currentWorldId].name;
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "worldID: " + this.currentWorldId + " worldName: " + worldName);
	
	this.canvasImages = [];
	this.canvasImageMap = {};
	this.canvasTileCountX = this.mapOptions.tileCountX;
	this.canvasTileCountY = this.mapOptions.tileCountY;
	
	let canvasBGColor = this.mapOptions.canvasBGColor;
	if (this.mapOptions.canvasBGColorFunction !== null) canvasBGColor = this.mapOptions.canvasBGColorFunction(worldName, this.displayState);
			
	for (var y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		this.canvasImageMap[y] = {};
		
		for (var x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			let tileX = x + this.startTileCanvasX;
			let tileY = y + this.startTileCanvasY;
			
			let imageURL = this.mapOptions.getMapTileFunction(tileX, tileY, this.zoomLevel, worldName, this.displayState);
			let newImage = new Image();
			let canvasX = tileX * this.mapOptions.tileSize;
			let canvasY = tileY * this.mapOptions.tileSize;
			
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
				
				if (newImage.showTile)
				{
					self.mapContext.fillStyle = canvasBGColor;
					self.mapContext.fillRect(canvasX, canvasY, self.mapOptions.tileSize, self.mapOptions.tileSize);
					self.triggerCanvasRedraw();
				}
				
				newImage.isError = true;
			}
			
			newImage.onload = function () {
				
				if (newImage.showTile)
				{
					self.mapContext.drawImage(newImage, canvasX, canvasY, self.mapOptions.tileSize, self.mapOptions.tileSize);
					self.triggerCanvasRedraw();
				}
				
				newImage.isLoaded = true;
			};
			
			if (tileX < 0 || tileY < 0)
			{
				newImage.onerror();
			}
			else
			{
				newImage.src = imageURL;
			}
		}
	}

}


uesp.gamemap.Map.prototype.loadMapTilesCanvasRowCol = function(left, right, top, bottom)
{
	if (uesp.gamemap.isNullorUndefined(this.mapOptions.getMapTileFunction)) return;
	
	if (!(this.currentWorldId in this.mapWorlds))
	{
		uesp.logError("Unknown worldID " + this.currentWorldId + "!");
		return;
	}
	
	let ix = this.startTileCanvasX - this.origStartTileCanvasX;
	let iy = this.startTileCanvasY - this.origStartTileCanvasY;
	
	if (left) 
	{
		this.startTileCanvasX -= 1;
		this.canvasTileCountX++;
		this.loadMapTilesCanvasRowColPriv(ix - 1, iy, left, this.canvasTileCountY)
	}
	
	if (right) 
	{
		this.canvasTileCountX++;
		this.loadMapTilesCanvasRowColPriv(ix + this.canvasTileCountX - 1, iy, right, this.canvasTileCountY)
	}
	
	if (top) 
	{
		this.startTileCanvasY -= 1;
		this.canvasTileCountY++;
		this.loadMapTilesCanvasRowColPriv(ix, iy - 1, this.canvasTileCountX, top)
	}
	
	if (bottom) 
	{
		this.canvasTileCountY++;
		this.loadMapTilesCanvasRowColPriv(ix, iy + this.canvasTileCountY - 1, this.canvasTileCountX, bottom)
	}
	
	
}


uesp.gamemap.Map.prototype.loadMapTilesCanvasRowColPriv = function(startX, startY, dx, dy)
{
	let worldName = this.mapWorlds[this.currentWorldId].name;
	let maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	let self = this;
	
	let canvasBGColor = this.mapOptions.canvasBGColor;
	if (this.mapOptions.canvasBGColorFunction !== null) canvasBGColor = this.mapOptions.canvasBGColorFunction(worldName, this.displayState);
	
	for (y = startY; y < startY + dy; ++y)
	{
		if (this.canvasImageMap[y] == null)	this.canvasImageMap[y] = {};
		
		for (x = startX; x < startX + dx; ++x)
		{
			if (this.canvasImageMap[y][x] != null) continue;
			
			let tileX = x + this.origStartTileCanvasX;
			let tileY = y + this.origStartTileCanvasY;			
			
			let imageURL = this.mapOptions.getMapTileFunction(tileX, tileY, this.zoomLevel, worldName, this.displayState);
			let newImage = new Image();
			let canvasX = tileX * this.mapOptions.tileSize;
			let canvasY = tileY * this.mapOptions.tileSize;
			
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
				
				if (newImage.showTile)
				{
					self.mapContext.fillStyle = canvasBGColor;
					self.mapContext.fillRect(canvasX, canvasY, self.mapOptions.tileSize, self.mapOptions.tileSize);
				}
				
				newImage.isError = true;
			}
			
			newImage.onload = function () {
				
				if (newImage.showTile)
				{
					self.mapContext.drawImage(newImage, canvasX, canvasY, self.mapOptions.tileSize, self.mapOptions.tileSize);
				}
	            
	            newImage.isLoaded = true;
			};
			
			if (tileX < 0 || tileY < 0)
			{
				newImage.onerror();
			}
			else
			{
				newImage.src = imageURL;
			}
			
		}
	}
	
}


uesp.gamemap.Map.prototype.loadMapTilesRowCol = function(xIndex, yIndex)
{
	if (uesp.gamemap.isNullorUndefined(this.mapOptions.getMapTileFunction)) return;
	
	if (!(this.currentWorldId in this.mapWorlds))
	{
		uesp.logError("Unknown worldID " + this.currentWorldId + "!");
		return;
	}
	
	var world = this.mapWorlds[this.currentWorldId];
	var worldName = world.name;
	var worldName = this.mapWorlds[this.currentWorldId].name;
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	var isFakeMaxZoom = false;
	
	var missingTile = this.mapOptions.missingMapTile;
	if (this.mapOptions.missingMapTileFunction !== null) missingTile = this.mapOptions.missingMapTileFunction(worldName, this.displayState);
	
	if (this.zoomLevel == world.maxZoom && this.mapOptions.useFakeMaxZoom)
	{
		isFakeMaxZoom = true;
	}
	
	for (y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		for (x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			if (xIndex >= 0 && this.mapTiles[y][x].deltaTileX != xIndex) continue;
			if (yIndex >= 0 && this.mapTiles[y][x].deltaTileY != yIndex) continue;
			
			var tileX = this.mapTiles[y][x].deltaTileX + this.startTileX;
			var tileY = this.mapTiles[y][x].deltaTileY + this.startTileY;
			
			//if (tileX < 0 || tileY < 0 || tileX >= maxTiles || tileY >= maxTiles)
			if (tileX < 0 || tileY < 0)
			{
				this.mapTiles[y][x].element.css("background-image", "url(" + missingTile + ")");
				continue;
			}
			
			var imageURL = this.mapOptions.getMapTileFunction(tileX, tileY, this.zoomLevel, worldName, this.displayState);
			var element  = this.mapTiles[y][x].element;
			
			if (isFakeMaxZoom)
			{
				var xPos = "left";
				var yPos = "top";
				
				if (tileX % 2 == 1) xPos = "right";
				if (tileY % 2 == 1) yPos = "bottom";
				
				element.css("background-size", "200%");
				element.css("background-position", xPos + " " + yPos);
				
				imageURL = this.mapOptions.getMapTileFunction(Math.floor(tileX/2), Math.floor(tileY/2), this.zoomLevel-1, worldName, this.displayState);
				
				$('<img/>').attr('src', imageURL)
					.load( uesp.gamemap.onMapTileLoadFunction(element, imageURL))
					.error(uesp.gamemap.onMapTileLoadFunction(element, missingTile));
			}
			else
			{
				element.css("background-size", "");
				element.css("background-position", "");
				
				$('<img/>').attr('src', imageURL)
					.load( uesp.gamemap.onMapTileLoadFunction(element, imageURL))
					.error(uesp.gamemap.onMapTileLoadFunction(element, missingTile));
			}			

		}
	}
}


uesp.gamemap.Map.prototype.createEditNoticeDiv = function()
{
	this.editNoticeDiv = $('<div />').attr('id', 'gmMapEditNotice')
								.attr('class', '')
								.appendTo(this.mapContainer);
}


uesp.gamemap.Map.prototype.displayEditNotice = function(Notice, FinishButton, CancelButton)
{
	var self = this;
	
	if (!this.editNoticeDiv) this.createEditNoticeDiv();
	
	if (CancelButton != null && CancelButton.length > 0)
	{
		Notice += "<button id='gmMapEditNoticeCancel'>" + CancelButton + "</button>";
	}
	
	if (FinishButton != null && FinishButton.length > 0) 
	{
		Notice += "<button id='gmMapEditNoticeFinish'>" + FinishButton + "</button>";
	}
	
	this.editNoticeDiv.html(Notice);
	this.editNoticeDiv.show();
	
	$('#gmMapEditNoticeCancel').bind("touchstart click", function(event) {
		self.onCancelEditMode(event);
		return false;
	});
	
	$('#gmMapEditNoticeFinish').bind("touchstart click", function(event) {
		self.onFinishEditMode(event);
		return false;
	});
}


uesp.gamemap.Map.prototype.hideEditNotice = function()
{
	if (this.editNoticeDiv)
	{
		this.editNoticeDiv.hide();
		this.editNoticeDiv.html('');
	}
}


uesp.gamemap.Map.prototype.onCancelEditMode = function(event)
{
	if (this.currentEditMode == '') return true;
	
	this.removeEditClickWall();
	this.hideEditNotice();
	
	if (this.currentEditMode == 'edithandles')
	{
		this.currentEditLocation.editPathHandles = false;
		
		if (this.currentEditLocation.pathElement)
		{
			this.currentEditLocation.pathElement.css('z-index', '');
		}
		
		this.currentEditLocation.displayData.points = this.currentEditPathPoints;
		this.currentEditLocation.computePathSize();
		this.currentEditLocation.updateFormPosition();
		this.currentEditLocation.computeOffset();
		this.currentEditLocation.updatePath();
		
		this.currentEditLocation.showPopup();
	}
	else if (this.currentEditMode == 'draglocation')
	{
		this.currentEditLocation.displayData.points = this.currentEditPathPoints;
		this.currentEditLocation.computePathSize();
		this.currentEditLocation.updateFormPosition();
		this.currentEditLocation.computeOffset();
		
		this.currentEditLocation.update();
		this.currentEditLocation.showPopup();
	}
	else if (this.currentEditMode == 'editworld')
	{
		this.hideWorldEditForm();
	}
	else if (this.currentEditMode == 'addpath' || this.currentEditMode == 'addarea')
	{
		delete this.locations[this.currentEditLocation.id];
		this.currentEditLocation.removeElements();
	}
	
	this.currentEditLocation = null;
	this.currentEditPathPoints = null;
	this.currentEditMode = '';
	this.currentEditWorld = null;
	
	this.redrawCanvas(true);
	
	return true;
}


uesp.gamemap.Map.prototype.onFinishEditMode = function(event)
{
	if (this.currentEditMode == '') return true;
	
	this.removeEditClickWall();
	this.hideEditNotice();
	
	if (this.currentEditMode == 'addpath')
	{
		this.onFinishedAddPath();
	}
	else if (this.currentEditMode == 'addarea')
	{
		this.onFinishedAddArea();
	}
	else if (this.currentEditMode == 'edithandles')
	{
		this.onFinishedEditHandles();
	}
	else if (this.currentEditMode == 'draglocation')
	{
		this.onFinishedEditDragLocation();
	}
	
	this.currentEditMode = '';
	
	this.redrawCanvas(true);
	
	return true;
}


uesp.gamemap.Map.prototype.onAddLocationStart = function()
{
	if (!this.canEdit()) return false;
	if (this.currentEditMode != '') return false;
	
	this.addEditClickWall();
	this.currentEditMode = 'addlocation';
	this.displayEditNotice("Click on the map to add a location...", '', 'Cancel');
	
	return true;
}


uesp.gamemap.Map.prototype.onFinishedAddPath = function()
{
	this.displayLocation(this.currentEditLocation);
	this.currentEditLocation.showPopup();
	
	this.currentEditLocation = null;
	return true;
}


uesp.gamemap.Map.prototype.onFinishedAddArea = function()
{
	this.onFinishedAddPath();
	return true;
}


uesp.gamemap.Map.prototype.onAddPathStart = function()
{
	if (!this.canEdit()) return false;
	if (this.currentEditMode != '') return false;
	
	this.addEditClickWall();
	this.currentEditMode = 'addpath';
	this.displayEditNotice("Click on the map to add points to the path. Click 'Finish' when done...", 'Finish', 'Cancel');
	
	this.currentEditLocation = new uesp.gamemap.Location(this);
	this.currentEditLocation.locType = uesp.gamemap.LOCTYPE_PATH;
	this.currentEditLocation.id = this.createNewLocationId();
	this.currentEditLocation.worldId = this.currentWorldId;
	this.currentEditLocation.name = 'New Path';
	this.currentEditLocation.displayLevel = this.zoomLevel - 1;
	this.currentEditLocation.visible = true;
	this.currentEditLocation.useEditPopup = true;
	this.currentEditLocation.displayData.labelPos = 0;
	this.currentEditLocation.displayData.points = [];
	this.currentEditLocation.displayData.hover = { };
	this.currentEditLocation.displayData.hover.fillStyle = "rgba(255,255,255,0.25)";
	this.currentEditLocation.displayData.hover.strokeStyle = "rgba(0,0,0,1)";
	this.currentEditLocation.displayData.hover.lineWidth = 2;
	this.currentEditLocation.displayData.fillStyle = "rgba(255,255,255,0.05)";
	this.currentEditLocation.displayData.strokeStyle = "rgba(0,0,0,0.5)";
	this.currentEditLocation.displayData.lineWidth = 1;
	this.currentEditLocation.iconType = 0;
	this.currentEditLocation.isFirstEdit = true;
	
	this.locations[this.currentEditLocation.id] = this.currentEditLocation;
	return true;
}


uesp.gamemap.Map.prototype.onAddAreaStart = function()
{
	if (!this.canEdit()) return false;
	
	this.onAddPathStart();
	
	this.currentEditLocation.locType = uesp.gamemap.LOCTYPE_AREA;
	this.currentEditMode = 'addarea';
	
	this.displayEditNotice("Click on the map to add points to the area. Click 'Finish' when done...", 'Finish', 'Cancel');
}


uesp.gamemap.Map.prototype.createNewLocationId = function ()
{
	NewId = this.nextNewLocationId;
	this.nextNewLocationId -= 1;
	return NewId;
}


uesp.gamemap.Map.prototype.createNewLocation = function (gamePos)
{
	if (!this.canEdit()) return null;
	
	var location = new uesp.gamemap.Location(this);
	
	location.id = this.createNewLocationId();
	location.worldId = this.currentWorldId;
	location.name = 'New Location';
	location.x = Math.round(gamePos.x);
	location.y = Math.round(gamePos.y);
	location.locType = uesp.gamemap.LOCTYPE_POINT;
	location.displayLevel = this.zoomLevel - 1;
	location.visible = true;
	location.useEditPopup = true;
	location.isFirstEdit = true;
	location.displayData = {};
	location.displayData.points = [];
	location.displayData.labelPos = 0;
	
	location.displayData.labelPos = 6;
	location.iconType = 1;
	
	this.locations[location.id] = location;
	
	this.displayLocation(location);
	location.showPopup();
	
	return location;
}


uesp.gamemap.Map.prototype.onDragLocationClick = function(event)
{
	event.preventDefault();
	if (this.currentEditLocation == null) return false;
	
	gamePos = this.convertWindowPixelToGamePos(event.pageX, event.pageY);
	this.currentEditLocation.x = gamePos.x;
	this.currentEditLocation.y = gamePos.y;
	this.currentEditLocation.displayData.points[0] = gamePos.x;
	this.currentEditLocation.displayData.points[1] = gamePos.y;
	
	this.currentEditLocation.computeOffset();
	this.currentEditLocation.update();
	
	this.redrawCanvas(true);
	
	return true;
}


uesp.gamemap.Map.prototype.onAddLocationClick = function (event)
{
	this.removeEditClickWall();
	this.hideEditNotice();
	this.currentEditMode = '';
	
	if (!this.canEdit()) return false;
	
	gamePos = this.convertWindowPixelToGamePos(event.pageX, event.pageY);
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onAddLocationClick()", gamePos);
	
	this.createNewLocation(gamePos);
	this.redrawCanvas(true);
	
	return true;
}


uesp.gamemap.Map.prototype.onAddPathClick = function (event)
{
	if (!this.canEdit()) return false;
	if (this.currentEditLocation == null) return false;
	
	gamePos = this.convertWindowPixelToGamePos(event.pageX, event.pageY);
	
	this.currentEditLocation.displayData.points.push(gamePos.x);
	this.currentEditLocation.displayData.points.push(gamePos.y);
	
	xMin = this.currentEditLocation.displayData.points[0];
	yMin = this.currentEditLocation.displayData.points[1];
	xMax = this.currentEditLocation.displayData.points[0];
	yMax = this.currentEditLocation.displayData.points[1];
	numPoints = this.currentEditLocation.displayData.points.length;
	
	for (i = 0; i < numPoints; i += 2)
	{
		x = this.currentEditLocation.displayData.points[i];
		y = this.currentEditLocation.displayData.points[i+1];
		
		if (x < xMin) xMin = x;
		if (y < yMin) yMin = y;
		if (x > xMax) xMax = x;
		if (y > yMax) yMax = y;
	}
	
		//TODO: Proper handling of inverse coordinate systems
	this.currentEditLocation.x = xMin;
	this.currentEditLocation.y = yMax;
	
	this.currentEditLocation.width  = xMax - xMin;
	this.currentEditLocation.height = yMax - yMin;
	
	this.displayLocation(this.currentEditLocation);
	this.redrawCanvas(true);
	
	return true;
}


uesp.gamemap.Map.prototype.onAddAreaClick = function (event)
{
	this.onAddPathClick(event);
	return true;
}


uesp.gamemap.Map.prototype.onDragEnd = function(event)
{
	if (this.USE_CANVAS_DRAW) return this.onDragEndCanvas(event);
	
	this.isDragging = false;
	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;
	
	this.draggingObject = null;
	this.checkTileEdges();
	
	deltaX = event.pageX - this.dragStartEventX;
	deltaY = event.pageY - this.dragStartEventY;
	
	if (deltaX != 0 || deltaY != 0) this.updateLocations();
}


uesp.gamemap.Map.prototype.onDragEndCanvas = function(event)
{
	this.isDragging = false;
	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;
	
	this.draggingObject = null;
	this.checkTileEdgesCanvas();
	
	deltaX = event.pageX - this.dragStartEventX;
	deltaY = event.pageY - this.dragStartEventY;
	
	if (deltaX != 0 || deltaY != 0) this.updateLocationsCanvas();
}


uesp.gamemap.Map.prototype.onDragMove = function(event)
{
	if (this.draggingObject == null) return;
	if (this.USE_CANVAS_DRAW) return this.onDragMoveCanvas(event);
	
	this.mapRoot.offset({
			left: event.pageX - this.dragStartLeft,
			top:  event.pageY - this.dragStartTop
	});

	if (this.checkTilesOnDrag) this.checkTileEdges();
}


uesp.gamemap.Map.prototype.onDragMoveCanvas = function(event)
{
	if (this.draggingObject == null) return;

	let x = event.pageX - this.dragStartLeftCanvas;
	let y = event.pageY - this.dragStartTopCanvas;
	let diffX = x - this.canvasLastDragX;
	let diffY = y - this.canvasLastDragY;
	
	this.translateCanvas(diffX, diffY);
	
	if (this.checkTilesOnDrag) this.checkTileEdgesCanvas();
	
	this.canvasLastDragX = x;
	this.canvasLastDragY = y;
	
	/* this.mapRoot.offset({
		left: event.pageX - this.dragStartLeft,
		top:  event.pageY - this.dragStartTop
	}); //*/
	
	this.redrawCanvas(true);

}


uesp.gamemap.Map.prototype.redrawCanvas = function(redrawGrid)
{
	if (!this.USE_CANVAS_DRAW) return;
	
	var startTime = 0;
	if (window.performance && window.performance.now) startTime = window.performance.now();
	
	this.redrawImages();
	if (this.isDrawGrid) this.canvasDrawGrid();
	this.drawCellResources();
	
	this.redrawLocations();
	
	if (window.performance && window.performance.now) {
		var diffTime = window.performance.now() - startTime;
		//console.log("redrawCanvas time", diffTime);
	}
}


uesp.gamemap.Map.prototype.redrawImages = function()
{
	let worldName = this.mapWorlds[this.currentWorldId].name;
	
	let canvasBGColor = this.mapOptions.canvasBGColor;
	if (this.mapOptions.canvasBGColorFunction !== null) canvasBGColor = this.mapOptions.canvasBGColorFunction(worldName, this.displayState);
	
	for (var i in this.canvasImages)
	{
		let image = this.canvasImages[i];
		
		if (image.image.isLoaded)
		{
			this.mapContext.drawImage(image.image, image.canvasX, image.canvasY, this.mapOptions.tileSize, this.mapOptions.tileSize);
		}
		else
		{
			this.mapContext.fillStyle = canvasBGColor;
			this.mapContext.fillRect(image.canvasX, image.canvasY, this.mapOptions.tileSize, this.mapOptions.tileSize);
		}
	}
}

	/* For Testing Only */
uesp.gamemap.Map.prototype.shiftCanvas = function(dx, dy)
{
	this.mapContext.globalCompositeOperation = "copy";
	this.mapContext.drawImage(this.mapContext.canvas, dx, dy);

	this.mapContext.globalCompositeOperation = "source-over"
}


uesp.gamemap.Map.prototype.onDragStart = function(event)
{
	if (this.USE_CANVAS_DRAW) return this.onDragStartCanvas(event);
		
	let mapOffset = this.mapRoot.offset();
	
	this.dragStartLeft = event.pageX - mapOffset.left;
	this.dragStartTop = event.pageY - mapOffset.top;
	
	this.dragStartEventX = event.pageX;
	this.dragStartEventY = event.pageY;
	
	this.draggingObject = $(event.target);
	this.isDragging = true;

	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Drag Start Offset: " + this.dragStartLeft + ", " + this.dragStartTop);
}


uesp.gamemap.Map.prototype.onDragStartCanvas = function(event)
{
	let mapOffset = this.mapRoot.offset();
	
	this.dragStartLeft = event.pageX - mapOffset.left;
	this.dragStartTop = event.pageY - mapOffset.top;
	
	this.dragStartLeftCanvas = event.pageX;
	this.dragStartTopCanvas = event.pageY;
		
	this.dragStartEventX = event.pageX;
	this.dragStartEventY = event.pageY;
		
	this.canvasLastDragX = 0;
	this.canvasLastDragY = 0;
	
	this.draggingObject = $(event.target);
	this.isDragging = true;

	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Drag Start Offset: " + this.dragStartLeft + ", " + this.dragStartTop);
}


uesp.gamemap.Map.prototype.onRightClick = function(event)
{
	var self = event.data.self;
	
	//uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onRightClick");
	
	if (self.currentEditMode != '') return true;
	
		/* Don't zoom out if right click in popup */
	if ($(event.target).parents('.gmMapPopupRoot').length > 0) return true;
	if ($(event.target).parents('.gmMapSearchRoot').length > 0) return true;
	
	event.preventDefault();
	self.onZoomOutWorld();
	return false;
}


uesp.gamemap.Map.prototype.onClick = function(event)
{
	var self = event.data.self;
	
	if (event.which == 3)
		return self.onRightClick(event);
	else if (event.which != 1)
		return false;
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onClick");
	
	if (self.currentEditMode == 'addlocation')
		self.onAddLocationClick(event);
	else if (self.currentEditMode == 'addpath')
		self.onAddPathClick(event);
	else if (self.currentEditMode == 'addarea')
		self.onAddAreaClick(event);
	else if (self.currentEditMode == 'draglocation')
		self.onDragLocationClick(event);
	else if (self.currentEditMode != '' )
		return false;
	else if (self.USE_CANVAS_DRAW)
		return self.onCanvasClick(event);
	
	return true;
}


uesp.gamemap.Map.prototype.onDblClickCanvas = function(event)
{
	var self = event.data.self;
	
	if (!self.USE_CANVAS_DRAW) return false;
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onDblClickCanvas");
	
	var foundLoc = self.findLocationAt(event.pageX, event.pageY);
	
	if (foundLoc == null) 
	{
		return self.onDoubleClick(event);
	}
	
	foundLoc.onLabelDblClick(event);
}


uesp.gamemap.Map.prototype.onMouseDown = function(event)
{
	var self = event.data.self;
	
	if (self.USE_CANVAS_DRAW) return self.onMouseDownCanvas(event);
	
	event.preventDefault();
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseDown");
	
	if (event.which != 1) return false;
	
	if (self.currentEditMode == 'edithandles')
		self.currentEditLocation.onPathEditHandlesMouseDown(event);
	else if (self.currentEditMode == '')
		self.onDragStart(event);

}


uesp.gamemap.Map.prototype.onMouseDownCanvas = function(event)
{
	var self = event.data.self;
	event.preventDefault();
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseDownCanvas");
	
	if (event.which != 1) return false;
	
	if (self.currentEditMode == 'edithandles')
		self.currentEditLocation.onPathEditHandlesMouseDown(event);
	else if (self.currentEditMode == '')
		self.onDragStart(event);
	
}


uesp.gamemap.Map.prototype.onTouchStart = function(event)
{
	var self = event.data.self;
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onTouchStart");
	
	if (event.originalEvent == null) return;
	if (event.originalEvent.touches == null) return;
	if (event.originalEvent.touches[0] == null) return;
	
	var touch = event.originalEvent.touches[0];
	
	event.pageX = touch.pageX;
	event.pageY = touch.pageY;
	event.which = 1;
	self.isPinching = false;
	
	if (event.originalEvent.touches.length === 2)
	{
		self.isPinching = true;
		event.pinchDistance = Math.hypot(
				event.originalEvent.touches[0].pageX - event.originalEvent.touches[1].pageX,
				event.originalEvent.touches[0].pageY - event.originalEvent.touches[1].pageY);
		self.onPinchStart(event);
		return;
	}
	
	self.onMouseDown(event);
}


uesp.gamemap.Map.prototype.onTouchEnd = function(event)
{
	var self = event.data.self;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onTouchEnd");
	
	if (event.originalEvent == null) return;
	if (event.originalEvent.touches == null) return;
	
	if (event.originalEvent.touches[0] != null)
	{
		var touch = event.originalEvent.touches[0];
		event.pageX = touch.pageX;
		event.pageY = touch.pageY;
		event.which = 1;
	}
	else
	{
		var offset = self.mapRoot.offset();
		event.pageX = offset.left + self.dragStartLeft;
		event.pageY = offset.top + self.dragStartTop;
		event.which = 1;
	}
	
	if (self.isPinching)
	{
		if (event.originalEvent.touches.length === 2)
		{
			event.pinchDistance = Math.hypot(
					event.originalEvent.touches[0].pageX - event.originalEvent.touches[1].pageX,
					event.originalEvent.touches[0].pageY - event.originalEvent.touches[1].pageY);
		}
		else
		{
			event.pinchDistance = -1;
		}
		
		self.onPinchEnd(event);
		return;
	}
	
	self.onMouseUp(event);
}


uesp.gamemap.Map.prototype.onPinchStart = function(event)
{
	self.lastPinchDistance = event.pinchDistance;
}


uesp.gamemap.Map.prototype.onPinchMove = function(event)
{
	
	if (event.pinchDistance >= 0)
	{
		if (event.pinchDistance > self.lastPinchDistance) this.onPinchZoomIn(); 
		if (event.pinchDistance < self.lastPinchDistance) this.onPinchZoomOut();
	}
	
	if (event.pinchDistance >= 0)
	{
		this.lastPinchDistance = event.pinchDistance;
	}
}


uesp.gamemap.Map.prototype.onPinchZoomOut = function(event)
{
	this.zoomOut();
}


uesp.gamemap.Map.prototype.onPinchZoomIn = function(event)
{
	this.zoomIn();
}


uesp.gamemap.Map.prototype.onPinchEnd = function(event)
{
}


uesp.gamemap.Map.prototype.onDoubleClick = function(event)
{
	var self = event.data.self;
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onDoubleClick");
	
	gamePos = self.convertWindowPixelToGamePos(event.pageX, event.pageY);
	
	self.panToGamePos(gamePos.x, gamePos.y);
}


uesp.gamemap.Map.prototype.onMouseMove = function(event)
{
	var self = event.data.self;
	
	if (self.USE_CANVAS_DRAW) return self.onMouseMoveCanvas(event);
	
	if (self.isDragging)
	{
		self.onDragMove(event);
		event.preventDefault();
	}
	else if (self.currentEditMode == 'edithandles')
	{
		self.currentEditLocation.onPathMouseMove(event);
	}
	
}


uesp.gamemap.Map.prototype.onMouseMoveCanvas = function(event)
{
	var self = event.data.self;
	
	if (self.isDragging)
	{
		self.onDragMove(event);
		event.preventDefault();
	}
	else if (self.currentEditMode == 'edithandles')
	{
		self.currentEditLocation.onPathMouseMoveCanvas(event);
	}
	else
	{
		self.checkCanvasHover(event);
	}
}


uesp.gamemap.Map.prototype.findLocationAt = function(pageX, pageY)
{
		// Look for icons first
	for (key in this.locations)
	{
		var location = this.locations[key];
		
		if (location.locType >= uesp.gamemap.LOCTYPE_PATH) continue;
		if (location.worldId != this.currentWorldId) continue;
		if (!location.visible && !this.isShowHidden()) continue;
		if (location.displayLevel > this.zoomLevel || (this.isShowHidden() && this.zoomLevel == this.mapOptions.maxZoomLevel)) continue;
		
		const rect = this.mapCanvas.getBoundingClientRect();
		const x = pageX - rect.left;
		const y = pageY - rect.top;
		
		if (location.isMouseHoverCanvas(x, y)) return location;
	}
	
		// Check paths/areas next
	for (key in this.locations)
	{
		var location = this.locations[key];
		
		if (location.locType < uesp.gamemap.LOCTYPE_PATH) continue;
		if (location.worldId != this.currentWorldId) continue;
		if (!location.visible && !this.isShowHidden()) continue;
		if (location.displayLevel > this.zoomLevel || (this.isShowHidden() && this.zoomLevel == this.mapOptions.maxZoomLevel)) continue;
		
		const rect = this.mapCanvas.getBoundingClientRect();
		const x = pageX - rect.left;
		const y = pageY - rect.top;
		
		if (location.isMouseHoverCanvas(x, y)) return location;
	}
	
	return null;
}


uesp.gamemap.Map.prototype.checkCanvasHover = function(event)
{
	var needsUpdate = false;
	
	var hoverLocation = this.findLocationAt(event.pageX, event.pageY);
	if (hoverLocation == this.lastCanvasHoverLocation) return;
	
	if (hoverLocation) 
	{
		hoverLocation.isHoverCanvas = true;
		needsUpdate = true;
	}
	
	if (this.lastCanvasHoverLocation)
	{
		this.lastCanvasHoverLocation.isHoverCanvas = false;
		this.lastCanvasHoverLocation.hideTooltip();
		this.lastCanvasHoverLocation = null;
		needsUpdate = true;
	}
	
	if (needsUpdate)
	{
		this.lastCanvasHoverLocation = hoverLocation;
		this.redrawCanvas();
		
		if (this.lastCanvasHoverLocation)
		{
			this.mapCanvasGridElement.css('cursor', 'pointer')
			if (this.lastCanvasHoverLocation.shouldShowTooltip()) this.lastCanvasHoverLocation.showTooltip();
		}
		else
		{
			this.mapCanvasGridElement.css('cursor', "url(grab.cur) 8 8, default")
		}
	}
}


uesp.gamemap.Map.prototype.onTouchMove = function(event)
{
	var self = event.data.self;
	event.preventDefault();
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onTouchMove");
	
	if (event.originalEvent == null) return;
	if (event.originalEvent.touches == null) return;
	if (event.originalEvent.touches[0] == null) return;
	
	var touch = event.originalEvent.touches[0];
	
	event.pageX = touch.pageX;
	event.pageY = touch.pageY;
	
	if (self.isPinching)
	{
		if (event.originalEvent.touches.length === 2)
		{
			event.pinchDistance = Math.hypot(
					event.originalEvent.touches[0].pageX - event.originalEvent.touches[1].pageX,
					event.originalEvent.touches[0].pageY - event.originalEvent.touches[1].pageY);
		}
		else
		{
			event.pinchDistance = -1;
		}
		
		self.onPinchMove(event);
		return;
	}
	
	self.onMouseMove(event);
}


uesp.gamemap.Map.prototype.onKeyDown = function(event)
{
	var self = event.data.self;
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, 'onKeyDown');
	
	if (self.currentEditLocation != null && self.currentEditLocation.editPathHandles)
	{
		self.currentEditLocation.onPathEditHandlesKeyDown(event);
	}
	else
	{
	}
}


uesp.gamemap.Map.prototype.onKeyUp = function(event)
{
	var self = event.data.self;
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, 'onKeyUp');
	
	if (self.currentEditLocation != null && self.currentEditLocation.editPathHandles)
	{
		self.currentEditLocation.onPathEditHandlesKeyUp(event);
	}
}


uesp.gamemap.Map.prototype.onMouseScroll = function(event)
{
	var self = event.data.self;
	var rootOffset = self.mapContainer.offset();
	
	if (uesp.gamemap.isNullorUndefined(event.pageX)) event.pageX = event.originalEvent.pageX;
	if (uesp.gamemap.isNullorUndefined(event.pageY)) event.pageY = event.originalEvent.pageY;
	
	var zoomX = event.pageX - rootOffset.left;
	var zoomY = event.pageY - rootOffset.top;
	
	if (event.originalEvent.detail > 0 || event.originalEvent.wheelDelta < 0)
	{
		self.zoomOut(zoomX, zoomY);
	} else {
		self.zoomIn(zoomX, zoomY);
	}
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseScroll");
	
	event.preventDefault();
}


uesp.gamemap.Map.prototype.onMouseScrollCanvas = function(event)
{
	var self = event.data.self;
	var rootOffset = self.mapContainer.offset();
	
	if (uesp.gamemap.isNullorUndefined(event.pageX)) event.pageX = event.originalEvent.pageX;
	if (uesp.gamemap.isNullorUndefined(event.pageY)) event.pageY = event.originalEvent.pageY;
	
	var zoomX = event.pageX - rootOffset.left;
	var zoomY = event.pageY - rootOffset.top;
	
	if (event.originalEvent.detail > 0 || event.originalEvent.wheelDelta < 0)
	{
		self.zoomOut(zoomX, zoomY);
	} else {
		self.zoomIn(zoomX, zoomY);
	}
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseScroll");
	event.preventDefault();
}


uesp.gamemap.Map.prototype.onMouseUp = function(event)
{
	var self = event.data.self;
	
	if (self.USE_CANVAS_DRAW) return self.onMouseUpCanvas(event);
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseUp");
	
	if (event.which != 1) return false;
	
	if (self.isDragging)
	{
		//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseUp::EndDrag");
		self.onDragEnd(event);
		event.preventDefault();
	}
	else if (self.currentEditLocation != null && self.currentEditLocation.draggingPathHandle >= 0)
	{
		self.currentEditLocation.onPathEditHandlesDragEnd(event);
	}
}


uesp.gamemap.Map.prototype.onMouseUpCanvas = function(event)
{
	var self = event.data.self;
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseUpCanvas");
	
	if (event.which != 1) return false;
	
	if (self.isDragging)
	{
		//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onMouseUpCanvas::EndDrag");
		self.onDragEnd(event);
		event.preventDefault();
	}
	else if (self.currentEditLocation != null && self.currentEditLocation.draggingPathHandle >= 0)
	{
		self.currentEditLocation.onPathEditHandlesDragEnd(event);
	}
	
}


uesp.gamemap.Map.prototype.onCanvasClick = function(event)
{
	var self = event.data.self;
	
	if (!self.USE_CANVAS_DRAW) return false;
	
	//uesp.logDebug(uesp.LOG_LEVEL_INFO, "onCanvasClick", event);
	
	var foundLoc = self.findLocationAt(event.pageX, event.pageY);
	if (foundLoc == null) return false;
	
	foundLoc.onLabelClick(event);
	
	return true;
}



uesp.gamemap.Map.prototype.mergeLocationData = function (locations, displayLocation)
{
	if (locations == null) return;
	if (displayLocation == null) displayLocation = false;
	
	for (key in locations)
	{
		var location = locations[key];
		if (location.id == null) continue;
		
		if ( !(location.id in this.locations))
		{
			this.locations[location.id] = uesp.gamemap.createLocationFromJson(location, this);
		}
		else
		{
			this.locations[location.id].mergeFromJson(location);
		}
		
		if (displayLocation && !this.USE_CANVAS_DRAW) this.displayLocation(this.locations[location.id]);
	}
	
	if (displayLocation && this.USE_CANVAS_DRAW) this.redrawCanvas();
}


uesp.gamemap.Map.prototype.onReceiveCenterOnLocationData = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Received centeron location data");
	uesp.logDebug(uesp.LOG_LEVEL_INFO, data);
	
	if (data.isError === true || data.locations == null || data.locations.length === 0)
	{
		if (data.worlds == null || data.worlds.length === 0)
		{
			this.changeWorld(this.mapOptions.homeWorldId);
			this.centerOnError = true;
		}
		else
		{
			this.mergeWorldData(data.worlds);
			this.changeWorld(data.worlds[0].id);
			this.centerOnError = true;
		}
		
		return false;
	}
	
	this.mergeLocationData(data.locations, true);
	var worldId = 0;
	
	if (data.worlds == null || data.worlds.length === 0)
	{
		worldId = data.locations[0].worldId;
	}
	else
	{
		this.mergeWorldData(data.worlds);
		worldId = data.worlds[0].id
	}
	
	if (this.mapWorlds[worldId] == null) 
	{
		this.changeWorld(this.mapOptions.homeWorldId);
		this.centerOnError = true;
		return true;
	}
	
	var mapState = new uesp.gamemap.MapState();
	mapState.worldId = worldId;
	mapState.zoomLevel = this.mapWorlds[worldId].maxZoom;
	mapState.gamePos.x = data.locations[0].x + data.locations[0].width/2;
	mapState.gamePos.y = data.locations[0].y - data.locations[0].height/2;
	
	this.showPopupOnLoadLocationId = data.locations[0].id;
	
	this.changeWorld(data.worlds[0].id, mapState);
	
	return true;
}


uesp.gamemap.Map.prototype.onReceiveLocationData = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Received location data");
	uesp.logDebug(uesp.LOG_LEVEL_INFO, data);
	
	if (!uesp.gamemap.isNullorUndefined(data.isError))  return uesp.logError("Error retrieving location data!", data.errorMsg);
	if (uesp.gamemap.isNullorUndefined(data.locations)) return uesp.logError("Location data not found in JSON response!", data);
	
	this.mergeLocationData(data.locations, true);
	
	if (this.showPopupOnLoadLocationId > 0 && this.locations[this.showPopupOnLoadLocationId] != null)
	{
		this.locations[this.showPopupOnLoadLocationId].showPopup();
		this.showPopupOnLoadLocationId = -1;
	}
	
	return true;
}


uesp.gamemap.Map.prototype.mergeWorldData = function (worlds)
{
	if (worlds == null) return;
	
	for (key in worlds)
	{
		var world = worlds[key];
		
		if (world.id < this.mapOptions.minValidWorldId) continue;
		if (world.id > this.mapOptions.maxValidWorldId) continue;
		
		if (uesp.gamemap.isNullorUndefined(world.name)) continue;
		
		if (world.id in this.mapWorlds)
		{
			this.mapWorlds[world.id].mergeFromJson(world);
			this.mapWorldNameIndex[world.name] = world.id;
			this.mapWorldDisplayNameIndex[world.displayName] = world.id;
		}
		else
		{
			this.addWorld(world.name, this.defaultMapOptions, world.id, world.displayName);
			this.mapWorlds[world.id].mergeFromJson(world);
			this.mapWorldNameIndex[world.name] = world.id;
			this.mapWorldDisplayNameIndex[world.displayName] = world.id;
		}
	}
	
}


uesp.gamemap.Map.prototype.onReceiveWorldData = function (data)
{
	if (!uesp.gamemap.isNullorUndefined(data.isError)) return uesp.logError("Error retrieving world data!", data.errorMsg);
	if (uesp.gamemap.isNullorUndefined(data.worlds))   return uesp.logError("World data not found in JSON response!", data);
	
	this.mergeWorldData(data.worlds);
	
	this.mapWorldsLoaded = true;
	if (this.userEvents.onMapWorldsLoaded != null) this.userEvents.onMapWorldsLoaded.call(this);
	this.fillWorldList('#gmMapListAlphaSelect');
	
	if (this.queryParams.search != null)
	{
		this.doSearch(this.queryParams.search, false);
	}
	
	if (this.autoGenerateWorldGroupList)
	{
		var html = this.createGroupListHtml();
		$("#gmMapList").html(html);
		this.setEventsForMapGroupList();
	}
	
	return true;
}


uesp.gamemap.Map.prototype.removeExtraLocations = function()
{
	var mapBounds = this.getMapRootBounds();
	
		// Remove locations in this world that are out of the current bounds
	for (key in this.locations)
	{
		if (this.locations[key].worldId != this.currentWorldId) continue;
		if (this.locations[key].isInBounds(mapBounds)) continue;
		
		this.locations[key].removeElements();
		delete this.locations[key];
	}
	
}


uesp.gamemap.Map.prototype.onReceivePermissions = function (data)
{
	if (data.canEdit != null) this.enableEdit = data.canEdit;
	
	if (this.userEvents.onPermissionsLoaded != null)
	{
		this.userEvents.onPermissionsLoaded.call(this);
	}
}


uesp.gamemap.Map.prototype.requestPermissions = function ()
{
	var self = this;
	
	var queryParams = {};
	queryParams.action = "get_perm";
	queryParams.db = this.mapOptions.dbPrefix;
	
	if (this.mapOptions.isOffline)
	{
		setTimeout(	function() { self.onReceivePermissions({ action: "get_perm", canEdit: false }); }, 10);
	}
	else
	{
		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
			self.onReceivePermissions(data); 
			//if ( !(onLoadFunction == null) ) onLoadFunction.call(self, eventData);
		});
	}
}


uesp.gamemap.Map.prototype.retrieveLocation = function(locId, onLoadFunction, eventData)
{
	if (locId <= 0) return;
	
	var self = this;
	var queryParams = {};
	queryParams.action = "get_loc";
	queryParams.locid  = locId;
	queryParams.db = this.mapOptions.dbPrefix; 
		
	if (this.isShowHidden()) queryParams.showhidden = 1;
	
	if (this.mapOptions.isOffline)
	{
		setTimeout(	function() { ugmLoadOfflineLocation(self, queryParams, onLoadFunction, eventData); }, 10);
	}
	else
	{
		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
				self.onReceiveLocationData(data); 
				if ( !(onLoadFunction == null) ) onLoadFunction.call(self, eventData, data);
			});
	}
	
	return true;
	
}


uesp.gamemap.Map.prototype.retrieveCenterOnLocation = function(world, locationName)
{
	var self = this;
	
	var queryParams = {};
	queryParams.action = "get_centeron";
	if (world != null) queryParams.world  = world;
	queryParams.centeron = locationName;
	queryParams.db = this.mapOptions.dbPrefix;
	if (this.isShowHidden()) queryParams.showhidden = 1;
	
	//if (!this.hasWorld(this.worldId)) queryParams.incworld = 1;
	//if (queryParams.world <= 0) return uesp.logError("Unknown worldId " + this.currentWorldId + "!");
	
	if (this.mapOptions.isOffline)
	{
		setTimeout(	function() { ugmLoadOfflineCenterOnLocation(self, queryParams); }, 10);
	}
	else
	{
		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) { self.onReceiveCenterOnLocationData(data); });
	}
	
}


uesp.gamemap.Map.prototype.retrieveLocations = function()
{
	var self = this;
	var mapBounds = this.getMapBounds();
	
	var queryParams = {};
	queryParams.action = "get_locs";
	queryParams.world  = this.currentWorldId;
	queryParams.top    = mapBounds.top;
	queryParams.bottom = mapBounds.bottom;
	queryParams.left   = mapBounds.left;
	queryParams.right  = mapBounds.right;
	queryParams.zoom   = this.zoomLevel;
	if (this.isShowHidden()) queryParams.showhidden = 1;
	if (!this.hasWorld(this.currentWorldId)) queryParams.incworld = 1;
	queryParams.db = this.mapOptions.dbPrefix;
	
	if (queryParams.world <= 0) return uesp.logError("Unknown worldId for current world " + this.currentWorldId + "!");
	
	if (this.mapOptions.isOffline)
	{
		setTimeout( function() { ugmLoadOfflineLocations(self, queryParams); }, 10);
	}
	else
	{
		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) { self.onReceiveLocationData(data); });
	}
	
	return true;
}


uesp.gamemap.Map.prototype.retrieveWorldData = function()
{
	var queryParams = {};
	var self = this;
	queryParams.action = "get_worlds";
	queryParams.db = this.mapOptions.dbPrefix;
	if (this.isShowHidden()) queryParams.showhidden = 1;
	
	if (this.mapOptions.isOffline)
	{
		setTimeout( function() { ugmLoadOfflineWorlds(self, queryParams); }, 10);
	}
	else
	{
		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) { self.onReceiveWorldData(data); });
	}
}


uesp.gamemap.Map.prototype.setGamePos = function(x, y, zoom, updateMap)
{
	this.setGamePosNoUpdate(x, y, zoom);
	
	if (updateMap == null || updateMap === true)
	{
		this.redrawCanvas();
		this.updateLocations();
		this.loadMapTiles();
		if (this.isDrawGrid) this.drawGrid();
		this.updateCellGridLabel();
		this.updateCellResourceLabel();
		this.updateDisplayStateLabel();
		
		if (this.cellResource != "") this.getCellResourceData(this.cellResource);
	}
}


uesp.gamemap.Map.prototype.panToGamePos = function(x, y)
{
		// TODO: Needs Canvas version
	if (this.USE_CANVAS_DRAW) return this.panToGamePosCanvas(x, y);
	
	var mapOffset = this.mapContainer.offset();
	
	var tilePos = this.convertGameToTilePos(x, y);
	tilePos.x -= this.mapOptions.tileCountX/2;
	tilePos.y -= this.mapOptions.tileCountY/2;
	
	var tileX = Math.floor(tilePos.x);
	var tileY = Math.floor(tilePos.y);
	
	var newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - tilePos.x) * this.mapOptions.tileSize);
	var newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - tilePos.y) * this.mapOptions.tileSize);
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	var self = this;
	
	this.mapRoot.animate({ left: newOffsetX, top: newOffsetY}, {
				complete: function() { 
					self.checkTileEdges();
					self.loadMapTiles();
					self.updateLocations();
				}
			});
}


uesp.gamemap.Map.prototype.panToGamePosCanvas = function(x, y)
{
	var mapOffset = this.mapContainer.offset();
	var pixelPos = this.convertGameToPixelPos(x, y);
	var tilePos = this.convertGameToTilePos(x, y);
	
	tilePos.x -= this.mapOptions.tileCountX/2;
	tilePos.y -= this.mapOptions.tileCountY/2;
	
	var tileX = Math.floor(tilePos.x);
	var tileY = Math.floor(tilePos.y);
	
	var newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - tilePos.x) * this.mapOptions.tileSize);
	var newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - tilePos.y) * this.mapOptions.tileSize);
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	this.resetTranslateCanvas();
	this.translateCanvas(newOffsetX, newOffsetY);
	this.redrawCanvas(true);
}


uesp.gamemap.Map.prototype.getWorldId = function (world)
{
	if (world == null) return 0;
	
	if (isNaN(world))
	{
		worldName = decodeURIComponent(world);
		
		if (worldName in this.mapWorldDisplayNameIndex) return this.mapWorldDisplayNameIndex[worldName];
		
		worldName = worldName.toLowerCase();
		if ( !(worldName in this.mapWorldNameIndex) ) return 0;
		worldId = this.mapWorldNameIndex[worldName];
	}
	else
	{
		worldId = parseInt(world);
		if ( !(worldId in this.mapWorlds)) return 0;
	}
	
	return worldId; 
}


uesp.gamemap.Map.prototype.setMapOptions = function (world, mapOptions)
{
	var worldId = this.getWorldId(world);
	if ( !(worldId in this.mapWorlds) ) return uesp.logError("Unknown world #" + worldId + " received!");
	
	this.mapWorlds[worldId].mergeMapOptions(mapOptions);
	
	if (this.currentWorldId == worldId) this.mapOptions.mergeOptions(mapOptions);
}


uesp.gamemap.Map.prototype.setGamePosNoUpdate = function(x, y, zoom)
{
	var mapOffset = this.mapContainer.offset();
	
	if (this.isValidZoom(zoom)) 
	{
		this.zoomLevel = zoom;
	}
	
	var tilePos = this.convertGameToTilePos(x, y);
	tilePos.x -= this.mapOptions.tileCountX/2;
	tilePos.y -= this.mapOptions.tileCountY/2;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "setGamePos(): tilePos = ", x, y, tilePos.x, tilePos.y);
	
	this.startTileX = Math.floor(tilePos.x);
	this.startTileY = Math.floor(tilePos.y);
	this.startTileCanvasX = this.startTileX;
	this.startTileCanvasY = this.startTileY;
	this.origStartTileCanvasX = this.startTileX;
	this.origStartTileCanvasY = this.startTileY;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "setGamePos(): startTile = " + this.startTileX + ", " + this.startTileY);
	
	newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - tilePos.x) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - tilePos.y) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	if (this.USE_CANVAS_DRAW)
	{
		this.startTileX = 0;
		this.startTileY = 0;
		
		tilePos = this.convertGameToTilePos(x, y);
		
		newOffsetX = Math.round(this.mapCanvas.width/2 - tilePos.x * this.mapOptions.tileSize);
		newOffsetY = Math.round(this.mapCanvas.height/2 - tilePos.y * this.mapOptions.tileSize);
		uesp.logDebug(uesp.LOG_LEVEL_INFO, "newOffsetCanvas = " + newOffsetX + ", " + newOffsetY, tilePos.x, tilePos.y);
		
		this.resetTranslateCanvas();
		this.translateCanvas(newOffsetX, newOffsetY);
	}
	else
	{
		this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
	}
}


uesp.gamemap.Map.prototype.setGameZoom = function(zoom)
{
	var newTileX = 0;
	var newTileY = 0;
	
	if (!this.isValidZoom(zoom)) return;
	
	var curGamePos = this.getGamePositionOfCenter();
	var curTilePos = this.convertGameToTilePos(curGamePos.x, curGamePos.y);
	var mapOffset = this.mapContainer.offset();
	var zoomSize = Math.pow(2, zoom - this.zoomLevel);
	
	newTileX = curTilePos.x * zoomSize - this.mapOptions.tileCountX/2;
	newTileY = curTilePos.y * zoomSize - this.mapOptions.tileCountY/2;
	
	this.zoomLevel = zoom;
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	this.startTileCanvasX = this.startTileX;
	this.startTileCanvasY = this.startTileY;
	this.origStartTileCanvasX = this.startTileX;
	this.origStartTileCanvasY = this.startTileY;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "setGameZoom(): startTile = " + this.startTileX + ", " + this.startTileY);
	
	newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(LOG_LEVEL_INFO.top  + this.mapContainer.height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	if (this.USE_CANVAS_DRAW)
	{
		this.startTileX = 0;
		this.startTileY = 0;
		
		newOffsetX = -Math.round(this.mapCanvas.width/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - tilePos.x) * this.mapOptions.tileSize);
		newOffsetY = -Math.round(this.mapCanvas.height/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - tilePos.y) * this.mapOptions.tileSize);
		uesp.logDebug(uesp.LOG_LEVEL_INFO, "newOffsetCanvas = " + newOffsetX + ", " + newOffsetY);
		
		this.resetTranslateCanvas();
		this.translateCanvas(newOffsetX, newOffsetY);
	}
	else
	{
		this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
	}
	
	this.updateLocations();
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.setMapState = function (newState, updateMap)
{
	if (newState == null) return;
	if (updateMap == null) updateMap = true;
	
	this.isDrawGrid = newState.grid;
	this.cellResource = newState.cellResource;
	this.displayState = newState.displayState;
	
	if (this.currentWorldId != newState.worldId)
	{
		this.changeWorld(newState.worldId, newState, updateMap);
	}
	else
	{
		this.setGamePos(newState.gamePos.x, newState.gamePos.y, newState.zoomLevel, updateMap);
	}

}


uesp.gamemap.Map.prototype.shiftMapTiles = function(deltaX, deltaY)
{
	var curOffset = this.mapRoot.offset();
	var targetXIndex = -1;
	var targetYIndex = -1;
	
	if (deltaX >= 1)
	{
		targetXIndex = 0;
		deltaX = 1;
	}
	else if (deltaX <= -1)
	{
		targetXIndex = this.mapOptions.tileCountX - 1;
		deltaX = -1;
	}
	
	if (deltaY >= 1)
	{
		targetYIndex = 0;
		deltaY = 1;
	}
	else if (deltaY <= -1)
	{
		targetYIndex = this.mapOptions.tileCountY - 1;
		deltaY = -1;
	}
	
	for (var y = 0; y < this.mapOptions.tileCountY; y++)
	{
		for(var x = 0; x < this.mapOptions.tileCountX; x++)
		{
			var tileOffset = this.mapTiles[y][x].element.offset();
			
			if (this.mapTiles[y][x].deltaTileX == targetXIndex)
			{
				this.mapTiles[y][x].deltaTileX += (this.mapOptions.tileCountX - 1) * deltaX;
				tileLeft = tileOffset.left + this.mapOptions.tileSize * (this.mapOptions.tileCountX - 1) * deltaX;
			}
			else
			{
				this.mapTiles[y][x].deltaTileX -= deltaX;
				tileLeft = tileOffset.left - this.mapOptions.tileSize * deltaX;
			}
			
			if (this.mapTiles[y][x].deltaTileY == targetYIndex)
			{
				this.mapTiles[y][x].deltaTileY += (this.mapOptions.tileCountY - 1) * deltaY;
				tileTop = tileOffset.top + this.mapOptions.tileSize * (this.mapOptions.tileCountY - 1) * deltaY;
			}
			else
			{
				this.mapTiles[y][x].deltaTileY -= deltaY;
				tileTop = tileOffset.top - this.mapOptions.tileSize * deltaY;
			}
			
			this.mapTiles[y][x].element.offset({
				left: tileLeft,
				top:  tileTop
			});
		}
	}
	
	this.mapRoot.offset({
		left: curOffset.left + this.mapOptions.tileSize * deltaX,
		top : curOffset.top  + this.mapOptions.tileSize * deltaY
	});
	
	this.shiftLocations(deltaX, deltaY);
	
	this.dragStartLeft -= this.mapOptions.tileSize * deltaX;
	this.dragStartTop  -= this.mapOptions.tileSize * deltaY;
	
	this.startTileX += deltaX;
	this.startTileY += deltaY;
	
	this.loadMapTilesRowCol(targetXIndex + (this.mapOptions.tileCountX - 1) * deltaX, targetYIndex + (this.mapOptions.tileCountY - 1) * deltaY);
}


uesp.gamemap.Map.prototype.shiftLocations = function (deltaX, deltaY)
{
	var shiftX = deltaX * this.mapOptions.tileSize;
	var shiftY = deltaY * this.mapOptions.tileSize;
	
	for (key in this.locations)
	{
		this.locations[key].shiftElements(shiftX, shiftY);
	}
}


uesp.gamemap.Map.prototype.updateLocations = function(animate)
{
	if (this.USE_CANVAS_DRAW) return this.updateLocationsCanvas(animate);
	
	this.updateMapLink();
	
	this.removeExtraLocations();
	this.updateLocationDisplayLevels();
	this.updateLocationOffsets(animate);
	
	this.redrawLocations();
	
	this.retrieveLocations();
	
}


uesp.gamemap.Map.prototype.updateLocationsCanvas = function(animate)
{
	this.updateMapLink();
	
	this.removeExtraLocations();
	this.updateLocationDisplayLevels();
	this.updateLocationOffsets(animate);
	
	this.redrawCanvas();
	//this.redrawLocations();
	
	this.retrieveLocations();
	
}


uesp.gamemap.Map.prototype.redrawLocationPaths = function()
{
	for (key in this.locations)
	{
		if (this.locations[key].locType >= uesp.gamemap.LOCTYPE_PATH) this.locations[key].updatePathSize();
	}
}


uesp.gamemap.Map.prototype.redrawLocations = function()
{
	if (this.USE_CANVAS_DRAW) return this.redrawLocationsCanvas();
	
	for (key in this.locations)
	{
		var location = this.locations[key];
		
		if (location.worldId != this.currentWorldId) continue;
		if (!location.visible && !this.isShowHidden()) continue;
		if (location.displayLevel > this.zoomLevel || (this.isShowHidden() && this.zoomLevel == this.mapOptions.maxZoomLevel)) continue;
		if (location.locType >= uesp.gamemap.LOCTYPE_PATH) location.updatePathSize(false);
		
		this.displayLocation(location);
	}
}


uesp.gamemap.Map.prototype.redrawLocationsCanvas = function()
{
	var displayedLocations = {};
	
	for (key in this.locations)
	{
		var location = this.locations[key];
		
		if (location.worldId != this.currentWorldId) continue;
		if (!location.visible && !this.isShowHidden()) continue;
		if (location.displayLevel > this.zoomLevel || (this.isShowHidden() && this.zoomLevel == this.mapOptions.maxZoomLevel)) continue;
		if (location.locType >= uesp.gamemap.LOCTYPE_PATH) location.updatePathSize(false);
		
		displayedLocations[key] = 1;
		location.computeOffset();
		location.updatePopupOffset();
		
		if (location.locType >= uesp.gamemap.LOCTYPE_PATH) location.updatePath();
	}
	
	for (key in displayedLocations)
	{
		var location = this.locations[key];
		location.updateIcon();
	}
	
	for (key in displayedLocations)
	{
		var location = this.locations[key];
		location.updateLabel();
	}
	

}


uesp.gamemap.Map.prototype.updateLocationDisplayLevels = function()
{
	for (key in this.locations)
	{
		if (this.zoomLevel < this.locations[key].displayLevel)
			this.locations[key].hideElements(0);
		else
			this.locations[key].showElements(0);
	}
}


uesp.gamemap.Map.prototype.updateLocationOffset = function (location, animate)
{
	/*
	tilePos = this.convertGameToTilePos(location.x, location.y);
	
	mapOffset  = this.mapRoot.offset();
	xPos = (tilePos.x - this.startTileX) * this.mapOptions.tileSize + mapOffset.left;
	yPos = (tilePos.y - this.startTileY) * this.mapOptions.tileSize + mapOffset.top;
			
	location.updateOffset(xPos, yPos, animate); */
	
	location.computeOffset();
	location.updateOffset();
	
	return true;
}


uesp.gamemap.Map.prototype.updateLocationOffsets = function (animate)
{
	for (key in this.locations)
	{
		this.updateLocationOffset(this.locations[key], animate);
	}
}


uesp.gamemap.Map.prototype.updateMap = function()
{
	this.updateLocations();
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.updateMapStateFromQuery = function (updateMap)
{
	var newState = this.getMapStateFromQuery();
	this.setMapState(newState, updateMap);
}


uesp.gamemap.Map.prototype.updateZoomControlButtons = function(newZoomLevel)
{
	var isMaxZoom = newZoomLevel >= this.mapOptions.maxZoomLevel;
	var isMinZoom = newZoomLevel <= this.mapOptions.minZoomLevel;
	
	if (isMaxZoom)
	{
		this.mapControlZoomIn.removeClass('gmMapControlZoomHover');
		this.mapControlZoomIn.addClass('gmMapControlZoomDisable');
	}
	else
	{
		this.mapControlZoomIn.addClass('gmMapControlZoomHover');
		this.mapControlZoomIn.removeClass('gmMapControlZoomDisable');
	}
	
	if (isMinZoom)
	{
		this.mapControlZoomOut.removeClass('gmMapControlZoomHover');
		this.mapControlZoomOut.addClass('gmMapControlZoomDisable');
	}
	else
	{
		this.mapControlZoomOut.addClass('gmMapControlZoomHover');
		this.mapControlZoomOut.removeClass('gmMapControlZoomDisable');
	}
	
}


uesp.gamemap.Map.prototype.translateCanvas = function(dx, dy, animate)
{
	dx = Math.floor(dx);
	dy = Math.floor(dy);
	
	this.mapTransformX += dx;
	this.mapTransformY += dy;
	
		/* TODO: Animate optionally
		 *  	window.requestAnimationFrame()
		 */
	this.mapContext.translate(dx, dy);
	this.mapContextGrid.translate(dx, dy);
}


uesp.gamemap.Map.prototype.zoomIn = function(x, y)
{
	if (this.USE_CANVAS_DRAW) return this.zoomInCanvas(x, y);
	
	this.updateZoomControlButtons(this.zoomLevel + 1);
	if (this.zoomLevel >= this.mapOptions.maxZoomLevel) return;
	
	var curPos = this.getGamePositionOfCenter();
	
	this.zoomLevel++;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoom In (" + x + ", " + y + ") = " + this.zoomLevel);
	
	if (x == null) x = this.mapContainer.width() /2;
	if (y == null) y = this.mapContainer.height()/2;
	
	var mapOffset  = this.mapContainer.offset();
	var rootOffset = this.mapRoot.offset();
	
	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapOptions.tileSize;
	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin tile = " + tileX + ", " + tileY);
	
	newTileX = tileX*2 - this.mapOptions.tileCountX/2;
	newTileY = tileY*2 - this.mapOptions.tileCountY/2;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newTile = " + newTileX + ", " + newTileY);
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	
	newOffsetX = Math.round(mapOffset.left + x - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + y - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newOffset = " + newOffsetX + ", " + newOffsetY, mapOffset, this.startTileX);
	this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
	
	this.updateLocations(true);
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.zoomInCanvas = function(x, y)
{
	this.updateZoomControlButtons(this.zoomLevel + 1);
	if (this.zoomLevel >= this.mapOptions.maxZoomLevel) return;
	
	var curPos = this.getGamePositionOfCenter();
	
	this.zoomLevel++;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoom In (" + x + ", " + y + ") = " + this.zoomLevel);
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin OrigOffset = " + this.mapTransformX + ", " + this.mapTransformY);
	
	if (x == null) x = this.mapCanvas.width/2;
	if (y == null) y = this.mapCanvas.height/2;
	
	let tileX = (x - this.mapTransformX) / this.mapOptions.tileSize;
	let tileY = (y - this.mapTransformY) / this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin tile = " + tileX + ", " + tileY);
	
	let newOffsetX = x - tileX * 2 * this.mapOptions.tileSize;
	let newOffsetY = y - tileY * 2 * this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newOffset = " + newOffsetX + ", " + newOffsetY);
	
	let origTileX = tileX*2 - this.mapOptions.tileCountX/2;
	let origTileY = tileY*2 - this.mapOptions.tileCountY/2;
	
	var mapOffset  = this.mapContainer.offset();
	var rootOffset = this.mapRoot.offset();
	
	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapOptions.tileSize;
	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin tile = " + tileX + ", " + tileY);
	
	let newTileX = tileX*2 - this.mapOptions.tileCountX/2;
	let newTileY = tileY*2 - this.mapOptions.tileCountY/2;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newTile = " + newTileX + ", " + newTileY);
	
	this.startTileX = Math.floor(origTileX);
	this.startTileY = Math.floor(origTileY);
	this.startTileCanvasX = this.startTileX;
	this.startTileCanvasY = this.startTileY;
	this.origStartTileCanvasX = this.startTileX;
	this.origStartTileCanvasY = this.startTileY;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin startTile = " + this.startTileX + ", " + this.startTileY);
	
	this.startTileX = 0;
	this.startTileY = 0;
	
	let newOffsetX1 = (mapOffset.left + x - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	let newOffsetY1 = (mapOffset.top  + y - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Zoomin newOffset1 = " + newOffsetX1 + ", " + newOffsetY1, mapOffset, this.startTileX);
	
		/* Fix for slow drift when zooming in/out multiple times */
	let diffX = newOffsetX - newOffsetX1;
	let diffY = newOffsetY - newOffsetY1;
	let newOffsetX2 = newOffsetX - Math.round(diffX / this.mapOptions.tileSize) * this.mapOptions.tileSize + mapOffset.left;
	let newOffsetY2 = newOffsetY - Math.round(diffY / this.mapOptions.tileSize) * this.mapOptions.tileSize + mapOffset.top;
	
	//this.mapRoot.offset({ left: newOffsetX2, top: newOffsetY2});
	
	this.resetTranslateCanvas();
	this.translateCanvas(newOffsetX, newOffsetY);
	
	this.mapContext.scale(2, 2);
	this.clearMapCanvas();
	this.redrawCanvas(false);
	
	this.resetTranslateCanvas();
	this.translateCanvas(newOffsetX, newOffsetY);
	
	this.updateLocationsCanvas(true);
	this.loadMapTiles();
	
	this.redrawCanvas(false);
}


uesp.gamemap.Map.prototype.resetTranslateCanvas = function()
{
	this.mapContext.setTransform(1, 0, 0, 1, 0, 0);
	this.mapContextGrid.setTransform(1, 0, 0, 1, 0, 0);
	this.mapTransformX = 0;
	this.mapTransformY = 0;
}


uesp.gamemap.Map.prototype.zoomOut = function(x, y)
{
	if (this.USE_CANVAS_DRAW) return this.zoomOutCanvas(x, y);
	
	this.updateZoomControlButtons(this.zoomLevel - 1);
	if (this.zoomLevel <= this.mapOptions.minZoomLevel) return;
	
	this.zoomLevel--;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut (" + x + ", " + y + ") = " + this.zoomLevel);
	
	if (x == null) x = this.mapContainer.width() /2;
	if (y == null) y = this.mapContainer.height()/2;
	
	var mapOffset  = this.mapContainer.offset();
	var rootOffset = this.mapRoot.offset();
	
	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapOptions.tileSize;
	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut tile = " + tileX + ", " + tileY);
	
	newTileX = tileX/2 - this.mapOptions.tileCountX/2;
	newTileY = tileY/2 - this.mapOptions.tileCountY/2;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut newTile = " + newTileX + ", " + newTileY);
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	
	newOffsetX = Math.round(mapOffset.left + x - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + y - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut newOffset = " + newOffsetX + ", " + newOffsetY);
	
	this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
	
	this.updateLocations(true);
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.zoomOutCanvas = function(x, y)
{
	this.updateZoomControlButtons(this.zoomLevel - 1);
	if (this.zoomLevel <= this.mapOptions.minZoomLevel) return;
	
	this.zoomLevel--;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut (" + x + ", " + y + ") = " + this.zoomLevel);
	
	if (x == null) x = this.mapCanvas.width/2;
	if (y == null) y = this.mapCanvas.height/2;
	
	let tileX = (x - this.mapTransformX) / this.mapOptions.tileSize;
	let tileY = (y - this.mapTransformY) / this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut tile = " + tileX + ", " + tileY);
	
	let newOffsetX = x - tileX / 2 * this.mapOptions.tileSize;
	let newOffsetY = y - tileY / 2 * this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut newOffset = " + newOffsetX + ", " + newOffsetY);
	
	let origTileX = tileX/2 - this.mapOptions.tileCountX/2;
	let origTileY = tileY/2 - this.mapOptions.tileCountY/2;
	
	var mapOffset  = this.mapContainer.offset();
	var rootOffset = this.mapRoot.offset();
	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapOptions.tileSize;
	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapOptions.tileSize;
	let newTileX = tileX/2 - this.mapOptions.tileCountX/2;
	let newTileY = tileY/2 - this.mapOptions.tileCountY/2;
	
	this.startTileX = Math.floor(origTileX);
	this.startTileY = Math.floor(origTileY);
	this.startTileCanvasX = this.startTileX;
	this.startTileCanvasY = this.startTileY;
	this.origStartTileCanvasX = this.startTileX;
	this.origStartTileCanvasY = this.startTileY;
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "ZoomOut startTile = " + this.startTileX + ", " + this.startTileY);
	
	this.startTileX = 0;
	this.startTileY = 0;
	
	let newOffsetX1 = (mapOffset.left + x - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	let newOffsetY1 = (mapOffset.top  + y - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	
		/* Fix for slow drift when zooming in/out multiple times */
	let diffX = newOffsetX - newOffsetX1;
	let diffY = newOffsetY - newOffsetY1;
	let newOffsetX2 = newOffsetX - Math.round(diffX / this.mapOptions.tileSize) * this.mapOptions.tileSize + mapOffset.left;
	let newOffsetY2 = newOffsetY - Math.round(diffY / this.mapOptions.tileSize) * this.mapOptions.tileSize + mapOffset.top;
	
	//this.mapRoot.offset({ left: newOffsetX2, top: newOffsetY2});
	
	this.resetTranslateCanvas();
	this.translateCanvas(newOffsetX, newOffsetY);
	
	this.mapContext.scale(0.5, 0.5);
	this.clearMapCanvas();
	this.redrawCanvas(false);
	
	this.resetTranslateCanvas();
	this.translateCanvas(newOffsetX, newOffsetY);
	
	this.updateLocationsCanvas(true);
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.updateLocationId = function(oldId, newId)
{
	if (oldId in this.locations) 
	{
		var location = this.locations[oldId];
		delete this.locations[oldId];
		location.id = newId;
		this.locations[newId] = location;
	}
}


uesp.gamemap.Map.prototype.addEditClickWall = function(cursor)
{
	
	if (this.editClickWall == null)
	{
		this.editClickWall = $('<div />')
				.attr('id', 'gmMapRootClickWall')
				.appendTo(this.mapContainer);
		
		this.editClickWall.bind("touchstart click", { self: this }, this.onClick);
		this.editClickWall.mousemove({ self: this }, this.onMouseMove);
		this.editClickWall.mouseup({ self: this }, this.onMouseUp);
		this.editClickWall.mousedown({ self: this }, this.onMouseDown);
	}
	
	if (cursor == null)
		this.editClickWall.css('cursor', '');
	else
		this.editClickWall.css('cursor', cursor);
	
	this.editClickWall.css('z-index', 101);
	this.editClickWall.show();
}


uesp.gamemap.Map.prototype.removeEditClickWall = function()
{
	if (this.editClickWall == null) return;
	
	this.editClickWall.css('cursor', '');
	this.editClickWall.css('background', '');
	this.editClickWall.css('z-index', 0);
	this.editClickWall.hide();
}


uesp.gamemap.Map.prototype.onEditDragLocationStart = function (location)
{
	this.currentEditMode = 'draglocation';
	this.currentEditLocation = location;
	this.displayEditNotice('Click to move location to a new position.<br/>Hit \'Finish\' on the right when done.', 'Finish', 'Cancel');
	this.currentEditPathPoints = uesp.cloneObject(location.displayData.points);
	
	this.addEditClickWall();
	
	this.displayLocation(this.currentEditLocation);
	this.redrawCanvas(true);
}


uesp.gamemap.Map.prototype.onFinishedEditDragLocation = function (location)
{
	this.removeEditClickWall();

	this.displayLocation(this.currentEditLocation);
	
	this.currentEditLocation.showPopup();
	this.currentEditLocation.updateFormPosition();
	this.currentEditLocation.updateOffset();
	this.currentEditLocation.updatePopupOffset();
	
	
	this.currentEditLocation = null;
	return true;
}


uesp.gamemap.Map.prototype.onEditPathHandlesStart = function (location)
{
	this.currentEditMode = 'edithandles';
	this.currentEditLocation = location;
	this.displayEditNotice('Edit path/area nodes by clicking and dragging.<br/>Hit \'Finish\' on the right when done.<br />Ctrl+Click deletes a point. Shift+Click adds a point.', 'Finish', 'Cancel');
	this.currentEditPathPoints = uesp.cloneObject(location.displayData.points);
	
	this.currentEditLocation.updateFormPosition();
	this.addEditClickWall('default');
	
	if (this.currentEditLocation.pathElement)
	{
		this.currentEditLocation.pathElement.css('z-index', '150');
	}
	
	this.displayLocation(this.currentEditLocation);
	this.redrawCanvas();
}


uesp.gamemap.Map.prototype.onFinishedEditHandles = function()
{
	this.removeEditClickWall();
	
	if (this.currentEditLocation.pathElement)
	{
		this.currentEditLocation.pathElement.css('z-index', '');
	}
	
	this.currentEditLocation.editPathHandles = false;
	this.displayLocation(this.currentEditLocation);
	
	this.currentEditLocation.showPopup();
	this.currentEditLocation.updateFormPosition();
	this.currentEditLocation.updateOffset();
	this.currentEditLocation.updatePopupOffset();
	
	this.currentEditLocation = null;
	
	this.redrawCanvas();
	
	return true;
}


uesp.gamemap.Map.prototype.onEditWorld = function()
{
	if (!this.canEdit()) return false;
	if (this.currentEditMode != '') return false;
	
	this.addEditClickWall('default');
	this.setEditClickWallBackground('rgba(0,0,0,0.5)');
	this.currentEditMode = 'editworld';
	
	this.currentEditWorld = this.mapWorlds[this.currentWorldId];
	this.showWorldEditForm();
	
	return true;
}


uesp.gamemap.Map.prototype.showWorldEditForm = function()
{
	if (this.currentEditWorld == null) return false;
	
	
	var worldEditForm =	"<form onsubmit='return false;'>" +
						"<div class='gmMapEditPopupTitle'>Editing World</div>" +
						"<div class='gmMapPopupClose'><img src='images/cancelicon.png' width='12' height='12' /></div><br />" +
						"<div class='gmMapEditPopupLabel'>Name</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='name' value=\"{name}\" size='24' maxlength='100' readonly /> <br />" +
						"<div class='gmMapEditPopupLabel'>Enabled</div>" +
							"<input type='checkbox' class='gmMapEditPopupInput' name='enabled' value='1' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Parent World ID</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='parentId' value='{parentId}' size='8'  maxlength='10' /> &nbsp; &nbsp; use a worldId<br />" +
						"<div class='gmMapEditPopupLabel'>Display Name</div>" +
							"<input type='text' class='gmMapEditPopupInput' name=\"displayName\" value=\"{displayName}\" size='24'  maxlength='100' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Wiki Page</div>" +
							"<input type='text' class='gmMapEditPopupInput' name=\"wikiPage\" value=\"{wikiPage}\" size='24'  maxlength='100' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Description</div>" +
							"<input type='text' class='gmMapEditPopupInput' name=\"description\" value=\"{description}\" size='24'  maxlength='500' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Missing Tile</div>" +
							"<input type='text' class='gmMapEditPopupInput' name=\"missingMapTile\" value=\"{missingMapTile}\" size='24'  maxlength='100' readonly /> <br />" +
						"<div class='gmMapEditPopupLabel'>Zoom Min/Max</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='minZoom' value='{minZoom}' size='8'  maxlength='10' /> &nbsp; " +
							"<input type='text' class='gmMapEditPopupInput' name='maxZoom' value='{maxZoom}' size='8'  maxlength='10' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Zoom Offset</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='zoomOffset' value='{zoomOffset}' size='8'  maxlength='10' /> " +
							"<div class='gmMapEditPopupCurrentZoom'>Current Zoom = </div> <br />" + 
						"<div class='gmMapEditPopupLabel'>Game Pos -- Left</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='posLeft' value='{posLeft}' size='8'  maxlength='10' /> &nbsp; " +
							"&nbsp;&nbsp; Right <input type='text' class='gmMapEditPopupInput' name='posRight' value='{posRight}' size='8'  maxlength='10' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Top</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='posTop' value='{posTop}' size='8'  maxlength='10' /> &nbsp; " +
							"Bottom <input type='text' class='gmMapEditPopupInput' name='posBottom' value='{posBottom}' size='8'  maxlength='10' /> <br />" +
						"<div class='gmMapEditPopupLabel'>worldId</div>" +
							"<div class='gmMapEditPopupInput'>{id}</div> &nbsp; " +
							" &nbsp;  &nbsp; Revision<div class='gmMapEditPopupInput'>{revisionId}</div> &nbsp; <br />" +
						"<div class='gmMapEditPopupStatus'></div>" +
						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonSave' value='Save' />" +
						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonClose' value='Cancel' />" +
						"</form>";
	
	if (this.worldEditPopup == null)
	{
		this.worldEditPopup = $('<div />')
				.attr('id', 'gmMapWorldEdit')
				.appendTo(this.mapContainer);
	}
	
	popupHtml = uesp.template(worldEditForm, this.currentEditWorld);
	this.worldEditPopup.html(popupHtml);
	
	this.worldEditPopup.find('input[name=enabled]').prop('checked', this.currentEditWorld.enabled);
	this.worldEditPopup.find('.gmMapEditPopupCurrentZoom').text('Current Zoom = ' + this.zoomLevel);
	
	var self = this;
	
	this.worldEditPopup.find('input[name=name]').focus();
	
	this.worldEditPopup.find('.gmMapPopupClose').bind("touchstart click", function(event) {
		self.onCloseWorldEditPopup(event);
		return false;
	});
	
	this.worldEditPopup.find('.gmMapEditPopupButtonClose').bind("touchstart click", function(event) {
		self.onCloseWorldEditPopup(event);
		return false;
	});
	
	this.worldEditPopup.find('.gmMapEditPopupButtonSave').bind("touchstart click", function(event) {
		self.onSaveWorldEditPopup(event);
		return false;
	});
	
	this.worldEditPopup.show();
}


uesp.gamemap.Map.prototype.enableWorldPopupEditButtons = function (enable)
{
	if (this.worldEditPopup == null) return;
	this.worldEditPopup.find('input[type="button"]').attr('disabled', enable ? null : 'disabled');
}



uesp.gamemap.Map.prototype.setWorldPopupEditNotice = function (Msg, MsgType)
{
	if (this.worldEditPopup == null) return;
	
	$status =this.worldEditPopup.find('.gmMapEditPopupStatus');
	if ($status == null) return;
	
	$status.html(Msg);
	$status.removeClass('gmMapEditPopupStatusOk');
	$status.removeClass('gmMapEditPopupStatusNote');
	$status.removeClass('gmMapEditPopupStatusWarning');
	$status.removeClass('gmMapEditPopupStatusError');
	
	if (MsgType == null || MsgType === 'ok')
		$status.addClass('gmMapEditPopupStatusOk');
	else if (MsgType === 'note')
		$status.addClass('gmMapEditPopupStatusNote');
	else if (MsgType === 'warning')
		$status.addClass('gmMapEditPopupStatusWarning');
	else if (MsgType === 'error')
		$status.addClass('gmMapEditPopupStatusError');
}


uesp.gamemap.Map.prototype.onCloseWorldEditPopup = function(event)
{
	this.hideWorldEditForm();
	this.removeEditClickWall();
	this.currentEditMode = '';
	this.currentEditWorld = null;
	return true;
}


uesp.gamemap.Map.prototype.onSaveWorldEditPopup = function(event)
{
	if (!this.canEdit()) return false;
	if (this.worldEditPopup == null) return false;
	
	this.setWorldPopupEditNotice('Saving world...');
	this.enableWorldPopupEditButtons(false);
	
	this.getWorldFormData();
	
	//this.update();
	
	this.doWorldSaveQuery(this.currentEditWorld);
	
	return true;
}


uesp.gamemap.Map.prototype.doWorldSaveQuery = function(world)
{
	var self = this;
	
	queryParams = world.createSaveQuery();
	queryParams.db = this.mapOptions.dbPrefix;
	
	if (this.mapOptions.isOffline)
	{
		// Do nothing
	}
	else
	{
		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
			self.onSavedWorld(data); 
		});
	}
	
	return true;
}


uesp.gamemap.Map.prototype.onSavedWorld = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Received onSavedWorld data");
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, data);
	
	if (!(data.isError == null) || data.success === false)
	{
		this.setWorldPopupEditNotice('Error saving world data!', 'error');
		this.enableWorldPopupEditButtons(true);
		return false;
	}
	
	if (data.newRevisionId != null) this.currentEditWorld.revisionId = data.newRevisionId;
	
	this.setWorldPopupEditNotice('Successfully saved location!');
	this.enableWorldPopupEditButtons(true);
	
	this.hideWorldEditForm();
	this.removeEditClickWall();
	this.currentEditMode = '';
	this.currentEditWorld = null;
	
	return true;
}


uesp.gamemap.Map.prototype.getWorldFormData = function()
{
	if (!this.canEdit()) return false;
	
	form = this.worldEditPopup.find('form');
	if (form == null) return false;
	
	formValues = uesp.getFormData(form)
	
	formValues.parentId = parseInt(formValues.parentId);
	formValues.minZoom = parseInt(formValues.minZoom);
	formValues.maxZoom = parseInt(formValues.maxZoom);
	formValues.zoomOffset = parseInt(formValues.zoomOffset);
	formValues.posLeft = parseInt(formValues.posLeft);
	formValues.posRight = parseInt(formValues.posRight);
	formValues.posTop = parseInt(formValues.posTop);
	formValues.posLeft = parseInt(formValues.posLeft);
	
	if (formValues.enabled == null)
		formValues.enabled = false;
	else
		formValues.enabled = parseInt(formValues.enabled) != 0;
	
	uesp.gamemap.mergeObjects(this.currentEditWorld, formValues);
	
	this.currentEditWorld.updateOptions();
	return true;
}


uesp.gamemap.Map.prototype.hideWorldEditForm = function()
{
	if (this.worldEditPopup != null) this.worldEditPopup.hide();
}


uesp.gamemap.Map.prototype.setEditClickWallBackground = function(background)
{
	this.editClickWall.css('background', background);
}



uesp.gamemap.Map.prototype.onZoomOutWorld = function()
{
	if ( !(this.currentWorldId in this.mapWorlds)) return false;
	
	world = this.mapWorlds[this.currentWorldId];
	if (world.parentId <= 0) return false;
	
	this.changeWorld(world.parentId);
	return true;
}


uesp.gamemap.Map.prototype.setUserEvents = function(userEvents)
{
	if (userEvents == null) return;
	uesp.mergeObjects(this.userEvents, userEvents);
}


uesp.gamemap.Map.prototype.setEventsForMapGroupList = function ()
{
	var self = this;
	
	$("#gmMapList li").bind("touchstart click", function(e) {
		if ($(this).hasClass('gmMapListHeader')) return false;
		if (self.mapListLastSelectedItem != null) self.mapListLastSelectedItem.removeClass('gmMapListSelect');
		$(this).addClass('gmMapListSelect');
		self.mapListLastSelectedItem = $(this);
		
		worldName = $(this).text();
		g_GameMap.changeWorld(worldName);
		
		self.hideMapList();
		return false;
	});
	
	$("#gmMapList li.gmMapListHeader").bind("touchstart click", function(e) {
		childList = $(this).next('ul');
		
		if (childList)
		{
			visible = !childList.is(':visible');
			childList.slideToggle(200);
			
			if (visible)
				$(this).css('background-image', 'url(images/uparrow.gif)');
			else
				$(this).css('background-image', 'url(images/downarrow.gif)');
		}
		
		return false;
	});
	
	$(document).bind("mousedown", function (e) {
		var container = $("#gmMapListRoot");
		
		if (!container.is(e.target) && container.has(e.target).length === 0)
		{
			self.hideMapList();
		}
	});
	
}


uesp.gamemap.Map.prototype.createRecentChanges = function ()
{
	if (this.recentChangesRoot != null) return;
	var self = this;
	
	this.recentChangesRoot = $('<div />')
								.addClass('gmMapRCRoot')
								.insertAfter(this.mapContainer);
}


uesp.gamemap.Map.prototype.createSearchControls = function ()
{
	if (this.mapSearchRoot != null) return;
	var self = this;
	
	this.mapSearchRoot = $('<div />')
								.addClass('gmMapSearchRoot')
								.appendTo(this.mapContainer);
	
	var searchOnlyThisMap = "<div class='gmMapSearchSmall'><input class='gmMapSearchCheck' type='checkbox' name='searchMapOnly' /> Only Search in Current Map</div>";
	if (!this.mapOptions.showSearchThisLocation) searchOnlyThisMap = "";
	
	
	
	var searchContent = "<form  onsubmit='return false;'>" +
						"<div class='gmMapSearchInputDiv'>" + 
						"<input class='gmMapSearchInput' type='text' name='search' value='' size='25' maxlength='100' autocomplete='on' />" +
						"<button class='gmMapSearchButton' title='Search the map for this text' name='button' type='submit'>" +
						"<img width='12' height='13' alt='Search' src='images/search-icon.png'>" +
						"</button>" + 
						"<button class='gmSearchResetButton' title='Reset the map search' name='button' type='reset' >" +
						"<img width='12' height='13' alt='Search' src='images/searchreseticon.png'>" +
						"</button>" +
						searchOnlyThisMap + 
						"</div>" + 
						"</form>" +
						"<div class='gmMapSearchResultsWrapper'>" + 
						"<div class='gmMapSearchResults' style='display:none;'>" +
						"</div>" +
						"<div class='gmMapSearchResultsButton'>" +
						"<img class='gmMapSearchResultsButtonImage' src='images/downarrows.gif' />" +
						"<div class='gmMapSearchResultsButtonLabel'>Show Search Results</div>" + 
						"<img class='gmMapSearchResultsButtonImage' src='images/downarrows.gif' />" +
						"</div>" + 
						"</div>";
	
	this.mapSearchRoot.html(searchContent);
	
	var mapSearchForm = this.mapSearchRoot.find('form');
	var mapSearchButton = this.mapSearchRoot.find('.gmMapSearchButton');
	var mapResetButton = this.mapSearchRoot.find('.gmSearchResetButton');
	
	this.mapSearchResults = this.mapSearchRoot.find('.gmMapSearchResults');
	
	var mapSearchResultsButton = this.mapSearchRoot.find('.gmMapSearchResultsButton');
	var mapSearchInput = $(".gmMapSearchInput");
	
	if (this.queryParams.search) mapSearchInput.val(this.queryParams.search);
	
	mapResetButton.bind("touchstart click", function (e) {
		self.onResetSearchButton(e);
		return false;
	});
	
	mapSearchButton.bind("touchstart click", function (e) {
		self.onSearchButton(e);
		return false;
	});
	
	mapSearchResultsButton.bind("touchstart click", function (e) {
		self.onSearchResultsButton(e);
		return false;
	});
	
	mapSearchInput.keypress(function(e){ 
	    if (!e) e = window.event;   
	    if (e.keyCode == '13'){
	    	mapSearchInput.blur();
	    	mapSearchInput.focus();
	    	return true;
	    }
	  });
}


uesp.gamemap.Map.prototype.onResetSearchButton = function (event)
{
	this.clearSearchResults();
	
	$(".gmMapSearchInput").val("");
	this.hideSearchResults();
	
	return false;
}


uesp.gamemap.Map.prototype.onSearchButton = function (event)
{
	var mapSearchForm = this.mapSearchRoot.find('form');
	var searchText = mapSearchForm.find('input[name=search]').val();
	var searchMapOnly = mapSearchForm.find('input[name=searchMapOnly]').is(':checked');
	
	this.doSearch(searchText, searchMapOnly);
	
	return false;
}


uesp.gamemap.Map.prototype.FindMapLocTypeString = function (locTypeString)
{
	var checkTypeString = locTypeString.trim().toLowerCase();
	
	if (this.mapOptions == null || this.mapOptions.iconTypeMap == null || checkTypeString == "") return null;
	
	for (locType in this.mapOptions.iconTypeMap)
	{
		if (checkTypeString === this.mapOptions.iconTypeMap[locType].toLowerCase()) return locType;
	}
	
	return null;

}


uesp.gamemap.Map.prototype.createSearchQuery = function (searchText, searchMapOnly)
{
	var queryParams = { };
	
	queryParams.action = 'search';
	queryParams.search = encodeURIComponent(searchText);
	if (this.isShowHidden()) queryParams.showhidden = 1;
	if (searchMapOnly === true) queryParams.world = this.currentWorldId;
	queryParams.db = this.mapOptions.dbPrefix;
	
	if (searchText.substring(0, 5) === "type:")
	{
		var locType = this.FindMapLocTypeString(searchText.substring(5));
		if (locType != null) queryParams.searchtype = locType;
	}
	
	return queryParams;
}


uesp.gamemap.Map.prototype.doSearch = function (searchText, searchMapOnly)
{
	var self = this;
	
	searchText = searchText.trim();
	
	if (searchText == null || searchText == '')
	{
		this.clearSearchResults();
		return false;
	}
	
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, 'Search for: ', searchText);
	this.searchText = searchText;
	
	var queryParams = this.createSearchQuery(searchText, searchMapOnly);
	
	if (this.mapOptions.isOffline)
	{
		setTimeout( function() { ugmSearchOfflineLocations(self, queryParams); }, 10);
	}
	else
	{
		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
			self.onReceiveSearchResults(data); 
		});
	}
	
	return true;
}


uesp.gamemap.Map.prototype.onReceiveSearchResults = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Received search data");
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, data);
	
	if (data.isError === true)  return uesp.logError("Error retrieving location data!", data.errorMsg);
	
	this.searchResults = [ ];
	
	this.mergeLocationData(data.locations, false);
	
	for (key in data.worlds)
	{
		var world = data.worlds[key];
		if (world.id == null) continue;
		
		this.searchResults.push( { worldId : world.id });
	}
	
	for (key in data.locations)
	{
		var location = data.locations[key];
		if (location.id == null) continue;
		
		this.searchResults.push( { locationId : location.id });
	}
	
	this.showSearchResults();
	this.updateSearchResults();
	return true;
}


uesp.gamemap.Map.prototype.updateSearchResults = function ()
{
	this.clearSearchResults();
	
	for (i in this.searchResults)
	{
		var searchResult = this.searchResults[i];
		
		this.addSearchResultLocation(searchResult.locationId);
		this.addSearchResultWorld(searchResult.worldId);
	}
	
}


uesp.gamemap.Map.prototype.addSearchResultLocation = function (locationId)
{
	var self = this;
	
	if (locationId == null) return;
	
	var location = this.locations[locationId];
	if (location == null) return uesp.logError('Failed to find location #' + locationId + ' data!');
	
	var world = this.mapWorlds[location.worldId];
	if (world == null) return uesp.logError('Failed to find world #' + location.worldId + ' data!');
	
	var locState = new uesp.gamemap.MapState;
	locState.zoomLevel = world.maxZoom;
	//if (locState.zoomLevel < this.zoomLevel) locState.zoomLevel = this.zoomLevel;
	locState.gamePos.x = location.x;
	locState.gamePos.y = location.y;
	locState.worldId = world.id;
	
	var searchResult = $('<div />')
							.addClass('gmMapSearchResultLocation')
							.bind("touchstart click", function (e) { self.onClickSearchResultId(locationId, locState); return false; })
							.appendTo(this.mapSearchResults);
	
	var iconURL   = this.mapOptions.iconPath + location.iconType + ".png";
	var imageContent = "<img class='gmMapSearchResultIcon' src='" + iconURL + "' />";
	
	if (location.iconType == 0) imageContent = "<div class='gmMapSearchResultIcon' />";
	
	var resultContent = imageContent +
						"<div class='gmMapSearchResultTitle'>{location.name}</div> " + 
						"<div class='gmMapSearchResultLocWorld'>(in {world.displayName})</div>";
	var data = { world: world, location: location };
	var resultHtml = uesp.template(resultContent, data);
	
	searchResult.html(resultHtml);
}


uesp.gamemap.Map.prototype.onClickSearchResult = function(location, locState)
{
	this.setMapState(locState, true);
	location.showPopup();
}


uesp.gamemap.Map.prototype.onClickSearchResultId = function(locationId, locState)
{
	this.setMapState(locState, true);
	
	var location = this.locations[locationId];
	
	if (location != null) 
	{
		location.showPopup();
		return;
	}
	
	this.showPopupOnLoadLocationId = locationId;
	//setTimeout(function() { location.showPopup(); }, 500);
	//location.showPopup();
	//this.setMapState(locState, true);
}



uesp.gamemap.Map.prototype.addSearchResultWorld = function (worldId)
{
	var self = this;
	
	if (worldId == null) return;
	
	var world = this.mapWorlds[worldId];
	if (world == null) return uesp.logError('Failed to find world #' + worldId + ' data!');
	
	var worldState = new uesp.gamemap.MapState;
	worldState.zoomLevel = this.zoomLevel;
	worldState.gamePos.x = (world.posLeft - world.posRight)/2 + world.posRight;
	worldState.gamePos.y = (world.posTop - world.posBottom)/2 + world.posBottom;
	worldState.worldId = world.id;
	
	var searchResult = $('<div />')
							.addClass('gmMapSearchResultWorld')
							.bind("touchstart click", function (e) { self.setMapState(worldState, true); return false; })
							.appendTo(this.mapSearchResults);
	
	var resultContent = "<div class='gmMapSearchResultTitle'>{displayName}</div>";
	var resultHtml = uesp.template(resultContent, world);
	
	searchResult.html(resultHtml);
}


uesp.gamemap.Map.prototype.clearSearchResults = function ()
{
	this.mapSearchResults.text('');
}


uesp.gamemap.Map.prototype.onSearchResultsButton = function (event)
{
	this.toggleSearchResults();
	return false;
}


uesp.gamemap.Map.prototype.updateSearchResultsButton = function (isVisible)
{
	if (isVisible == null) isVisible = this.mapSearchResults.is(':visible');
	
	var mapSearchResultsButton = this.mapSearchRoot.find('.gmMapSearchResultsButton');
	var mapSearchResultsImage = mapSearchResultsButton.find('.gmMapSearchResultsButtonImage');
	var mapSearchResultsLabel = mapSearchResultsButton.find('.gmMapSearchResultsButtonLabel');
	
	if (isVisible)
	{
		mapSearchResultsImage.attr('src', 'images/uparrows.gif');
		mapSearchResultsLabel.text('Hide Search Results');
	}
	else
	{
		mapSearchResultsImage.attr('src', 'images/downarrows.gif');
		mapSearchResultsLabel.text('Show Search Results');
	}
}


uesp.gamemap.Map.prototype.toggleSearchResults = function ()
{
	var isVisible = this.mapSearchResults.is(':visible');
	this.mapSearchResults.slideToggle(200);
	this.updateSearchResultsButton(!isVisible);
}


uesp.gamemap.Map.prototype.showSearchResults = function ()
{
	this.mapSearchResults.show(200);
	this.updateSearchResultsButton(true);
}


uesp.gamemap.Map.prototype.hideSearchResults = function ()
{
	this.mapSearchResults.hide(200);
	this.updateSearchResultsButton(false);
}


uesp.gamemap.Map.prototype.createMapControls = function ()
{
	if (this.mapControlRoot != null) return;
	var self = this;
	
	this.mapControlRoot = $('<div />')
								.addClass('gmMapControlRoot')
								.appendTo(this.mapContainer);
	
	if (this.mapOptions.displayStates.length > 0)
	{
		this.mapControlDisplayStateRoot = $('<div />')
												.addClass('gmMapControlDisplayStates')
												.appendTo(this.mapControlRoot);
		
		for (var i in this.mapOptions.displayStates)
		{
			let displayState = this.mapOptions.displayStates[i];
			
			$('<div />')
				.html(displayState)
				.attr("id", "gmMapControlDisplayState_" + displayState)
				.addClass('gmMapControlDisplayState')
				.bind("touchstart click", function(e) { self.onDisplayStateChange(displayState); return false; })
				.appendTo(this.mapControlDisplayStateRoot);
		}
	}
	
	this.mapControlPanUp = $('<div />')
								.html('&#x2C4;')
								.addClass('gmMapControlPan')
								.addClass('gmMapControlPanBreak')
								.bind("touchstart click", function(e) { self.panUp(); return false; })
								.appendTo(this.mapControlRoot);
	
	this.mapControlPanLeft = $('<div />')
								.html('&#x2C2;')
								.addClass('gmMapControlPan')
								.bind("touchstart click", function(e) { self.panLeft(); return false; })
								.appendTo(this.mapControlRoot);
	
	this.mapControlPanRight = $('<div />')
								.html('&#x2C3;')
								.addClass('gmMapControlPan')
								.bind("touchstart click", function(e) { self.panRight(); return false; })
								.appendTo(this.mapControlRoot);
	
	this.mapControlPanDown = $('<div />')
								.html('&#x2C5;')
								.addClass('gmMapControlPan')
								.addClass('gmMapControlPanBreak')
								.bind("touchstart click", function(e) { self.panDown(); return false; })
								.appendTo(this.mapControlRoot);
	
	this.mapControlZoomIn = $('<div />')
								.html('+')
								.addClass('gmMapControlZoom')
								.addClass('gmMapControlZoomHover')
								.bind("touchstart click", function(e) { self.zoomIn(); return false; })
								.appendTo(this.mapControlRoot);
	
	this.mapControlZoomOut = $('<div />')
								.text('-')
								.addClass('gmMapControlZoom')
								.addClass('gmMapControlZoomHover')
								.bind("touchstart click", function(e) { self.zoomOut(); return false; })
								.appendTo(this.mapControlRoot);
}


uesp.gamemap.Map.prototype.pan = function (deltaX, deltaY)
{
	if (this.USE_CANVAS_DRAW) return this.panCanvas(deltaX, deltaY);
	
	var self = this;
	
	this.mapRoot.animate({ left: '+=' + deltaX, top: '+=' + deltaY }, 500);
	
	setTimeout(function() {
		self.checkTileEdges();
		self.updateLocations();
		self.loadMapTiles();
	}, 600);

}


uesp.gamemap.Map.prototype.panCanvas = function (deltaX, deltaY)
{
	let self = this;
	
	this.translateCanvas(deltaX, deltaY);
	this.redrawCanvas(true);
	
	this.mapRoot.animate({ left: '+=' + deltaX, top: '+=' + deltaY }, 0);
	
	setTimeout(function() {
		self.checkTileEdges();
		self.updateLocations();
		self.loadMapTiles();
	}, 1);
}


uesp.gamemap.Map.prototype.panLeft = function ()
{
	this.pan(this.PANAMOUNT, 0);
}


uesp.gamemap.Map.prototype.panRight = function ()
{
	this.pan(-this.PANAMOUNT, 0);
}


uesp.gamemap.Map.prototype.panUp = function ()
{
	this.pan(0, this.PANAMOUNT);
}


uesp.gamemap.Map.prototype.panDown = function ()
{
	this.pan(0, -this.PANAMOUNT);
}


uesp.gamemap.Map.prototype.createHelpBlockElement = function()
{
	var self = this;
	
	if (this.mapOptions.isOffline)
	{
		this.helpBlockElement = $(".gmHelpBlock");
		
		self.helpBlockElement.find('.gmHelpCloseButton').bind("touchstart click", function(event) {
			self.hideHelpBlock();
			return false;
		});
		
		$(document).mousedown(function(e){
			var container = self.helpBlockElement;
			
			if (!container.is(e.target) && container.has(e.target).length === 0)
			{
				self.hideHelpBlock();
			}
		});
		
		return;
	}
	
	this.helpBlockElement = $('<div />')
				.addClass('gmHelpBlock')
				.html("Loading...")
				.appendTo(this.mapContainer);
	
	$.get( this.mapOptions.helpTemplate, function( data ) {
		self.helpBlockContents = data;
		uesp.logDebug(uesp.LOG_LEVEL_WARNING, 'Received help block contents!', data);
		$('.gmHelpBlock').html(data);
		
		self.helpBlockElement.find('.gmHelpCloseButton').bind("touchstart click", function(event) {
			self.hideHelpBlock();
			return false;
		});
		
		$(document).mousedown(function(e){
			var container = self.helpBlockElement;
			
			if (!container.is(e.target) && container.has(e.target).length === 0)
			{
				self.hideHelpBlock();
			}
		});
	});

}


uesp.gamemap.Map.prototype.hideHelpBlock = function()
{
	if (this.currentEditMode == 'showhelpblock')
	{
		this.currentEditMode = '';
		this.removeEditClickWall();
	}
	
	if (this.helpBlockElement != null) this.helpBlockElement.hide();
}


uesp.gamemap.Map.prototype.showHelpBlock = function()
{
	if (this.currentEditMode != '') return false;
	
	this.addEditClickWall('default');
	this.setEditClickWallBackground('rgba(0,0,0,0.5)');
	this.currentEditMode = 'showhelpblock';
	
	if (this.helpBlockElement == null) this.createHelpBlockElement();
	this.helpBlockElement.show();
}


uesp.gamemap.Map.prototype.hideMapKey = function()
{
	if (this.currentEditMode == 'showmapkey')
	{
		this.currentEditMode = '';
		this.removeEditClickWall();
	}
	
	if (this.mapKeyElement != null) this.mapKeyElement.hide();
}


uesp.gamemap.Map.prototype.showMapKey = function()
{
	if (this.currentEditMode != '') return false;
	
	this.addEditClickWall('default');
	this.setEditClickWallBackground('rgba(0,0,0,0.5)');
	this.currentEditMode = 'showmapkey';
	
	if (this.mapKeyElement == null) this.createMapKey();
	this.mapKeyElement.show();
}


uesp.gamemap.Map.prototype.createMapKey = function()
{
	var self = this;
	var MapKeyContent = "<div class='gmMapKeyTitle'>Map Key</div>" +
						"<button class='gmMapKeyCloseButton'>Close</button>" +
						this.createMapKeyContent() +
						"";

	this.mapKeyElement = $('<div />')
			.addClass('gmMapKey')
			.html(MapKeyContent)
			.appendTo(this.mapContainer);
	
	this.mapKeyElement.find('.gmMapKeyCloseButton').bind("touchstart click", function(event) {
		self.hideMapKey();
		return false;
	});
	
	$(document).mousedown(function(e){
		var container = self.mapKeyElement;
		
		if (!container.is(e.target) && container.has(e.target).length === 0)
		{
			self.hideMapKey();
		}
	});
	
}


uesp.gamemap.Map.prototype.createMapKeyContent = function()
{
	if (this.mapOptions.iconTypeMap == null) return 'No Map Icons Available';
	
	var reverseIconTypeMap = { };
	var sortedIconTypeArray = [ ];
	
	for (key in this.mapOptions.iconTypeMap)
	{
		var keyValue = this.mapOptions.iconTypeMap[key];
		
			// Only permit unique icon names to display
			// TODO: Check for different icon images? 	
		if (reverseIconTypeMap[keyValue] == null) sortedIconTypeArray.push(keyValue);
		
		reverseIconTypeMap[keyValue] = key;
	}
	
	sortedIconTypeArray.sort();
	
	var output = "<div class='gmMapKeyContainer'><div class='gmMapKeyColumn'>";
	var numColumns = this.mapKeyNumColumns;
	var itemsPerColumn = sortedIconTypeArray.length / numColumns;
	var itemCount = 0;
	
	for (key in sortedIconTypeArray)
	{
		iconTypeLabel = sortedIconTypeArray[key];
		iconType = reverseIconTypeMap[iconTypeLabel];
		
		output += "<div class='gmMapKeyItem'>";
		output += "<div class='gmMapKeyImageImage'><img src='" + this.mapOptions.iconPath + iconType + ".png' /></div>";
		output += "<div class='gmMapKeyItemLabel'>"+ iconTypeLabel + "</div>";
		output += "</div><br />";
		
		++itemCount;
		
		if (itemCount > itemsPerColumn)
		{
			output += "</div><div class='gmMapKeyColumn'>";
			itemCount = 0;
		}
	}
	
	output += "</div></div>"
	return output;
}


uesp.gamemap.Map.prototype.toggleMapList = function()
{
	visible = $('#gmMapListRoot').is(':visible');
	$('#gmMapListRoot').toggle();
	
	if (visible)
		$('#gmMapNameLabel').removeClass('gmMapNameLabelUpArrow');
	else
		$('#gmMapNameLabel').addClass('gmMapNameLabelUpArrow');
}


uesp.gamemap.Map.prototype.showMapList = function()
{
	$('#gmMapListRoot').show();
	$('#gmMapNameLabel').addClass('gmMapNameLabelUpArrow');
}


uesp.gamemap.Map.prototype.hideMapList = function()
{
	$('#gmMapListRoot').hide();
	$('#gmMapNameLabel').removeClass('gmMapNameLabelUpArrow');
}


uesp.gamemap.Map.prototype.testGroupMap = function()
{
	var self = this;
	var foundMaps = { };
	var count = 0;
	
	$("#gmMapList li").not('.gmMapListHeader').each (function () {
		var mapName = $(this).text();
		
		if (! (mapName in self.mapWorldDisplayNameIndex))
		{
			uesp.logError("Group map '" + mapName + "' not found!");
			count++;
		}
		else
		{
			foundMaps[mapName] = 1;
		}
	});
	
	if (count == 0)
		uesp.logError("No invalid group map names found!");
	else
		uesp.logError("Found " + count + " invalid group map names!");
	
	count = 0;
	
	for (mapName in self.mapWorldDisplayNameIndex)
	{
		if (! (mapName in foundMaps))
		{
			uesp.logError("Map '" + mapName + "' missing from group maps!");
			count++;
		}
	}
	
	if (count == 0)
		uesp.logError("No missing group map names found!");
	else
		uesp.logError("Found " + count + " missing group map names!");

}


uesp.gamemap.Map.prototype.onRecentChanges = function (element)
{
	this.isShowingRecentChanges = !this.isShowingRecentChanges;
	
	if (this.isShowingRecentChanges)
	{
		$(element).addClass('gmToggleButtonDown');
		this.recentChangesRoot.width('340px');
		this.mapContainer.css('right', '350px');
		
		this.updateRecentChanges();
	}
	else
	{
		$(element).removeClass('gmToggleButtonDown');
		this.recentChangesRoot.width('0px');
		this.mapContainer.css('right', '0px');
	}
	return false;
}


uesp.gamemap.Map.prototype.updateRecentChanges = function ()
{
	var self = this;
	
	var queryParams = {};
	queryParams.action = "get_rc";
	queryParams.db = this.mapOptions.dbPrefix;
	
	if (this.mapOptions.isOffline)
	{
		// Do nothing
	}
	else
	{
		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
			self.onReceiveRecentChanges(data); 
		});
	}
}


uesp.gamemap.Map.prototype.onReceiveRecentChanges = function (data)
{
	
	if (data == null || data.recentChanges == null)
	{
		this.clearRecentChanges();
		return false;
	}
	
	var output = "";
	
	for (key in data.recentChanges)
	{
		recentChange = data.recentChanges[key];
		
		let imageURL = this.mapOptions.iconPath + recentChange.iconType + ".png";
		
		output += "<div class='gmMapRCItem' onclick='g_GameMap.jumpToDestination(" + recentChange.locationId + ", true, true);'>";
		output += "<img src='" + imageURL + "' class='gmMapRCItemIcon' />";
		output += "<div class='gmMapRCItemName'>" + recentChange.locationName  + "</div>";
		output += " <div class='gmMapRCItemSmall'>(" + recentChange.worldDisplayName + ") -- " + recentChange.editTimestamp + "</div>";
		output += "</div>";
	}
	
	this.recentChangesRoot.html(output);
	
	return true;
}


uesp.gamemap.Map.prototype.clearRecentChanges = function ()
{
	this.recentChangesRoot.text("");
}


uesp.gamemap.Map.prototype.drawGrid = function()
{
	if (!this.USE_CANVAS_DRAW) return;
	
	this.canvasDrawGrid();
}


uesp.gamemap.Map.prototype.canvasDrawGrid = function()
{
	var deltaX = this.mapOptions.gridDeltaX;
	var deltaY = this.mapOptions.gridDeltaY;
	var gridOffsetY = this.mapOptions.gridOffsetY;
	var zoomDiff = this.zoomLevel - this.mapOptions.minZoomLevel
	
	console.log("canvasDrawGrid");
	this.clearMapGridCanvas();

	for (z = 1; z <= zoomDiff; ++z)
	{
		gridOffsetY += Math.pow(2, z + this.mapOptions.gridOffsetPowerY)
	}
	
	for (var y = this.mapOptions.gridStartY; y <= this.mapOptions.gridStopY; y += deltaY)
	{
		var pos1 = this.convertGameToPixelPos(this.mapOptions.gridStartX, y);
		var pos2 = this.convertGameToPixelPos(this.mapOptions.gridStopX, y);

		pos1.x -= this.mapTransformX;
		pos2.x -= this.mapTransformX;
		pos1.y -= this.mapTransformY + gridOffsetY;
		pos2.y -= this.mapTransformY + gridOffsetY;
		
		this.mapContextGrid.beginPath();
		this.mapContextGrid.moveTo(pos1.x, pos1.y);
		this.mapContextGrid.lineTo(pos2.x, pos2.y);
		this.mapContextGrid.lineWidth = 1;
		this.mapContextGrid.strokeStyle = this.mapOptions.gridStyle;
		this.mapContextGrid.stroke();
	}
	
	for (var x = this.mapOptions.gridStartX; x <= this.mapOptions.gridStopX; x += deltaX)
	{
		var pos1 = this.convertGameToPixelPos(x, this.mapOptions.gridStartY);
		var pos2 = this.convertGameToPixelPos(x, this.mapOptions.gridStopY);
		
		pos1.x -= this.mapTransformX;
		pos2.x -= this.mapTransformX;
		pos1.y -= this.mapTransformY + gridOffsetY;
		pos2.y -= this.mapTransformY + gridOffsetY;
		
		this.mapContextGrid.beginPath();
		this.mapContextGrid.moveTo(pos1.x, pos1.y);
		this.mapContextGrid.lineTo(pos2.x, pos2.y);
		this.mapContextGrid.lineWidth = 1;
		this.mapContextGrid.strokeStyle = this.mapOptions.gridStyle;
		this.mapContextGrid.stroke();
	}
	
	if (!this.mapOptions.gridShowLabels) return;
	if (this.zoomLevel < this.mapOptions.gridStartLabelZoom) return;
	
	var labelStartX = Math.ceil(this.mapOptions.gridStartX / this.mapOptions.gridDeltaX / this.mapOptions.gridLabelDeltaX) * this.mapOptions.gridLabelDeltaX;
	var labelStartY = Math.ceil(this.mapOptions.gridStartY / this.mapOptions.gridDeltaY / this.mapOptions.gridLabelDeltaY) * this.mapOptions.gridLabelDeltaY;
	var labelEndX = Math.floor(this.mapOptions.gridStopX / this.mapOptions.gridDeltaX / this.mapOptions.gridLabelDeltaX) * this.mapOptions.gridLabelDeltaX;
	var labelEndY = Math.floor(this.mapOptions.gridStopY / this.mapOptions.gridDeltaY / this.mapOptions.gridLabelDeltaY) * this.mapOptions.gridLabelDeltaY; 
	
	for (var cellY = labelStartY; cellY <= labelEndY; cellY += this.mapOptions.gridLabelDeltaY)
	{
		var y = cellY * this.mapOptions.gridDeltaY + this.mapOptions.gridLabelOffsetY;
		
		for (var cellX = labelStartX; cellX <= labelEndX; cellX += this.mapOptions.gridLabelDeltaX)
		{
			var x = cellX * this.mapOptions.gridDeltaX + this.mapOptions.gridLabelOffsetX;
			var pos = this.convertGameToPixelPos(x, y);
			
			pos.x += 1 - this.mapTransformX;
			pos.y += 10 - this.mapTransformY - gridOffsetY;
			
			gridText = "" + cellX + "," + cellY;
			
			//console.log(gridText, pos.x, pos.y, x, y, cellX, cellY);
			
			this.mapContextGrid.font = "8px Arial";
			this.mapContextGrid.textBaseLine = "bottom";
			this.mapContextGrid.fillStyle = this.mapOptions.gridStyle;
			this.mapContextGrid.fillText(gridText, pos.x, pos.y);
		}
		
	}
	
}


uesp.gamemap.Map.prototype.onCellGridClick = function(e)
{
	let self = e.data.self;
	
	self.isDrawGrid = !self.isDrawGrid;
	
	if (self.isDrawGrid)
	{
		self.drawGrid();
	}
	else
	{
		self.clearMapGrid();
	}
	
	self.updateCellGridLabel();
	self.updateMapLink();
	self.drawCellResources();
}


uesp.gamemap.Map.prototype.updateCellGridLabel = function()
{
		// TODO: No hard coded ID?
	if (this.isDrawGrid)
	{
		$("#gmMapCellGrid").text("Hide Cell Grid");
	}
	else
	{
		$("#gmMapCellGrid").text("Show Cell Grid");
	}
}


uesp.gamemap.Map.prototype.onCellResourceChange = function(list)
{
	var cellResource = $(list).val();
	
	if (cellResource == this.cellResource) return;
	
	this.cellResource = cellResource;
	
	this.showCellResourceGuide(cellResource != "");
	
	this.clearMapGrid();
	if (this.isDrawGrid) this.drawGrid();
		
	this.getCellResourceData(cellResource);
	
	this.updateMapLink();
}


uesp.gamemap.Map.prototype.drawCellResources = function() 
{
	if (this.cellResource == "") return;
	if (this.USE_CANVAS_DRAW) return this.drawCellResourcesCanvas();
}


uesp.gamemap.Map.prototype.drawCellResourcesCanvas = function() 
{
	var startX = this.mapOptions.cellResourceStartX;
	var startY = this.mapOptions.cellResourceStartY;
	var endX = this.mapOptions.cellResourceStopX;
	var endY = this.mapOptions.cellResourceStopY;
	var color = "white";
	var x1, y1, x2, y2;
	var zoomDiff = this.zoomLevel - this.mapOptions.minZoomLevel
	var gridOffsetY = this.mapOptions.gridOffsetY;
	
	for (var z = 1; z <= zoomDiff; ++z)
	{
		gridOffsetY += Math.pow(2, z + this.mapOptions.gridOffsetPowerY)
	}
	
	if (!this.isDrawGrid) this.clearMapGridCanvas();

	for (var x = startX; x <= endX; x++) 
	{
		let xData = this.cellResourceData.data[x - startX];
		if (xData == null) continue;
		
		for (var y = startY; y <= endY; y++)
		{
			resourceCount = xData[y - startY];
			if (resourceCount == null) continue;

			
			if (resourceCount == 0) 
			{
				continue;	//do nothing
			}
			else if (resourceCount <= 2)
			{
				color = "rgba(255,0,255,0.5)";		//TODO: No hardcode colors?
			}
			else if (resourceCount <= 5)
			{
				color = "rgba(0,0,255,0.5)";
			}
			else if (resourceCount <= 10)
			{
				color = "rgba(0,255,0,0.5)";
			}
			else if (resourceCount <= 20)
			{
				color = "rgba(255,255,0,0.5)";
			}
			else if (resourceCount <= 50) 
			{
				color = "rgba(255,102,51,0.5)";
			}
			else
			{
				color = "rgba(255,0,0,0.5)";
			}
			
			x1 = x * this.mapOptions.cellResourceDeltaX;
			y1 = y * this.mapOptions.cellResourceDeltaY;
			x2 = (x + 1) * this.mapOptions.cellResourceDeltaX;
			y2 = (y + 1) * this.mapOptions.cellResourceDeltaY;
			
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


uesp.gamemap.Map.prototype.updateCellResourceLabel = function()
{
		// TODO: No hard coded ID?
	$("#gmCellResourceList").val(this.cellResource);
	
	this.showCellResourceGuide(this.cellResource != "")
}


uesp.gamemap.Map.prototype.showCellResourceGuide = function(display)
{
		// TODO: No hard coded ID?
	$("#gmCellResourceGuide").toggle(display);
}


uesp.gamemap.Map.prototype.getCellResourceData = function(resourceEditorID) 
{
	var self = this;
	
	if (resourceEditorID === "") return;
	
	if (this.loadedCellResource == resourceEditorID) 
	{
		this.drawCellResources();
		return;
	}
	
	var queryParams = { };
	queryParams.action = "get_cellresource";
	queryParams.db = this.mapOptions.dbPrefix;
	queryParams.worldid = this.currentWorldId;
	queryParams.editorid = resourceEditorID;

	$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
		self.parseGetCellResourceRequest(data, resourceEditorID); 
	});

}


uesp.gamemap.Map.prototype.parseGetCellResourceRequest = function(data, resourceEditorID) 
{
	if (data === null || data.isError === true || data.resources === null || data.resources[0] === null)
	{
		this.showCellResourceGuide(false);
		return;
	}

	this.loadedCellResource = resourceEditorID;
	this.cellResourceData = data.resources[0];
	this.drawCellResources();
}


uesp.gamemap.Map.prototype.onDisplayStateChange = function(displayState)
{
	this.displayState = displayState;
	
	this.loadMapTiles();
	this.updateDisplayStateLabel();
	this.updateMapLink();
}


uesp.gamemap.Map.prototype.updateDisplayStateLabel = function()
{
	var label = $("#gmMapControlDisplayState_" + this.displayState);
	
	$(".gmMapControlDisplayState").removeClass("gmMapControlDisplayStateSelected");
	label.addClass("gmMapControlDisplayStateSelected");
}


uesp.gamemap.Map.prototype.triggerCanvasRedraw = function()
{
	var self = this;
	
	//console.log("triggerCanvasRedraw");
	
	setTimeout(function() { self.doCanvasRedraw(); } , 100);
	this.lastCanvasRedrawRequest = Date.now();
}


uesp.gamemap.Map.prototype.doCanvasRedraw = function()
{
	var diffTime = Date.now() - this.lastCanvasRedrawRequest;
	
	if (diffTime < 100)
	{
		//setTimeout(this.doCanvasRedraw, 100);
		return;
	}
	
	//console.log("doCanvasRedraw");
	
	this.redrawCanvas(true);
	this.lastCanvasRedrawRequest = 0;
}


uesp.gamemap.defaultGetMapTile = function(tileX, tileY, zoom, world)
{
	if (world == null)
		return "zoom" + zoom + "/maptile-" + tileX + "-" + tileY + ".jpg";
	else
		return world + "/zoom" + zoom + "/maptile-" + tileX + "-" + tileY + ".jpg"; 
}



uesp.gamemap.Map.prototype.translateGroupListToName = function(groups, depth)
{
	var groupNames = {};
	
	if (depth == null) depth = 0;
	if (depth >= this.MAX_GROUP_DEPTH) groupNames = [];
	
	for (var worldId in groups)
	{
		var subGroups = groups[worldId];
		
		var world = this.mapWorlds[worldId];
		var worldName = "";
		
		if (world == null) 
		{
			if (worldId == this.GROUP_DEV_ID)
				worldName = "Dev";
			else if (worldId == this.GROUP_BETA_ID)
				worldName = "Beta";
		}
		else
		{
			worldName = world['displayName']
		}
		
		if (worldName == "") continue;
		
		if (Array.isArray(groupNames))
		{
			groupNames.push(worldName);
		}
		else
		{
			if (subGroups === true)
				groupNames[worldName] = true;
			else
				groupNames[worldName] = this.translateGroupListToName(subGroups, depth+1);
		}
	}
	
	return groupNames;
}


uesp.gamemap.Map.prototype.createGroupSubList = function(parentGroups, groups, worldId, depth)
{
	if (this.groupCreateList[worldId] != null) return;
	this.groupCreateList[worldId] = true;
	
	if (depth == null) depth = 0;
	
	parentGroups[worldId] = true;
	
	if (groups[worldId] == null)
	{
		this.groupCreateList[worldId] = false;
		return;
	}
	
	if (depth < this.MAX_GROUP_DEPTH) parentGroups[worldId] = {};
	
	for (var i in groups[worldId])
	{
		var childWorldId = groups[worldId][i];
		
		if (depth >= this.MAX_GROUP_DEPTH || this.topLevelWorldIds[childWorldId] === true || groups[worldId].length < this.MIN_GROUP_SIZE)
			this.createGroupSubList(parentGroups, groups, childWorldId, depth+1);
		else
			this.createGroupSubList(parentGroups[worldId], groups, childWorldId, depth+1);
	}
	
	this.groupCreateList[worldId] = false;
}


uesp.gamemap.Map.prototype.createGroupList = function()
{
	var groups = {};
	var allGroups = {};
	
	this.GROUP_DEV_ID = -101;
	this.GROUP_BETA_ID = -102;
	
	for (var worldId in this.mapWorlds)
	{
		if (worldId == 0) continue;
		
		var world = this.mapWorlds[worldId];
		var parentId = world.parentId;
		var worldDisplayName = world['displayName']
		var worldName = world['name']
		
		if (parentId < 0) parentId = 0;
		
			// TODO: Other/better ways to do fixed groups? 
		if (worldDisplayName.endsWith("(Dev)"))
			parentId = this.GROUP_DEV_ID;
		else if (worldDisplayName.endsWith("(Beta)"))
			parentId = this.GROUP_BETA_ID;
		else if (worldDisplayName.endsWith("(Test)"))
			continue;
		
		if (groups[parentId] == null) groups[parentId] = [];
		groups[parentId].push(worldId);
	}
	
	this.groupCreateList = {};
	this.MAX_GROUP_DEPTH = 3;
	this.MIN_GROUP_SIZE = 5;
	
	var topLevelWorldID = 667;		// TODO: Not hardcoded for ESO?
	
	this.topLevelWorldIds = {		// TODO: Not hardcoded for ESO?
			203 : true,
			668 : true,
			1402 : true,
			1466 : true,
			2170 : true,
			2179 : true,
			2282 : true,
	};
	
	this.topLevelWorldIds[this.GROUP_DEV_ID] = true;
	this.topLevelWorldIds[this.GROUP_BETA_ID] = true;
	
	this.createGroupSubList(allGroups, groups, topLevelWorldID);
	this.createGroupSubList(allGroups, groups, this.GROUP_DEV_ID);
	this.createGroupSubList(allGroups, groups, this.GROUP_BETA_ID);
	
	return this.translateGroupListToName(allGroups);
}


uesp.gamemap.Map.prototype.createGroupListHtml = function(groups, parentWorldName)
{
	var output = "";
	
	if (groups == null) groups = this.createGroupList();
	
	var keys = Object.keys(groups);
	if (parentWorldName != null && parentWorldName != "Beta" && parentWorldName != "Dev") keys.push(parentWorldName);
	keys.sort();
	
	for (var i in keys)
	{
		var worldName = keys[i];
		var subGroups = groups[worldName];
		
		if (subGroups == null || subGroups === true || Object.keys(subGroups).length === 0)
		{
			output += "<li>" + worldName + "</li>\n";
		}
		else
		{
			output += "<li class=\"gmMapListHeader\">" + worldName + "</li>\n<ul>\n";
			output += this.createGroupListHtml(subGroups, worldName);
			output += "</ul>\n";
		}
	}
	
	return output;
}



