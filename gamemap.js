/*
 * gamemap.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Main source code for the game map system. 
 *
 * TODO:
 * 		- Remove new location when cancelled before save
 * 		- Delete location
 * 		- Enable display of non-visible locations when editing
 * 		- Tooltips for areas/paths?
 * 		- Disable locations when adding path/area points?
 * 		- Jump to destination on path/area double-click
 *		- Help for edit fields (and in general)
 *		- Todo add padding around path div
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
	
	this.mapRoot = null;
	this.mapContainer = $('#' + mapContainerId);
	if (this.mapContainer == null) uesp.logError('The gamemap container \'' + mapContainerId + '\' was not found!');
	
	this.mapListContainer = null;
	this.mapListLastSelectedItem = null;
	
		// TODO: Better way of limiting which map worlds to show
	this.minValidWorldId = 50;
	this.maxValidWorldId = 10000;
	
	this.mapWorlds = {};
	this.mapWorldNameIndex = {};
	this.mapWorldDisplayNameIndex = {};
	this.mapWorldsLoaded = false;
	
	this.currentWorldId = 0;
	this.addWorld('__default', this.mapOptions, this.currentWorldId, '');
	
	this.locations = {};
	
	this.zoomLevel = 15;
	this.startTileX = 0;
	this.startTileY = 0;
	
	this.isDragging = false;
	this.draggingObject = null;
	this.dragStartLeft = 0;
	this.dragStartTop  = 0;
	this.dragStartEventX = 0;
	this.dragStartEventY = 0;
	this.checkTilesOnDrag = true;
	
	this.jumpToDestinationOnClick = true;
	
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
	
	this.worldGroupListContents = '';
	
	this.mapTiles = [];
	
	this.queryParams = uesp.parseQueryParams();
	
	this.requestPermissions();
	this.retrieveWorldData();
	
	this.createMapRoot();
	this.createMapTiles();
	this.createMapList();
	this.createEvents();
	
	this.setGamePosNoUpdate(this.mapOptions.initialGamePosX, this.mapOptions.initialGamePosY, this.mapOptions.initialZoom);
	this.updateMapStateFromQuery(false);
}


uesp.gamemap.Map.prototype.addWorld = function (worldName, mapOptions, worldId, displayName)
{
	this.mapWorlds[worldId] = new uesp.gamemap.World(worldName.toLowerCase(), this.defaultMapOptions, worldId);
	this.mapWorlds[worldId].mergeMapOptions(mapOptions);
	
	this.mapWorldNameIndex[worldName.toLowerCase()] = worldId;
	if (displayName != null) this.mapWorldDisplayNameIndex[displayName] = worldId;
}


uesp.gamemap.Map.prototype.createMapList = function ()
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
								.appendTo(this.mapContainer);
	
	this.mapListContainer.html(listHtml);
	
	$('#gmMapListButtonAlpha').click(function(e) {
		$('#gmMapListButtonAlpha').addClass('gmMapListButtonSelect');
		$('#gmMapListButtonGroup').removeClass('gmMapListButtonSelect');
		$('#gmMapListAlpha').show();
		$('#gmMapListGroup').hide();
		$('#gmMapListAlphaSelect').focus();
	});
	
	$('#gmMapListButtonGroup').click(function(e) {
		$('#gmMapListButtonGroup').addClass('gmMapListButtonSelect');
		$('#gmMapListButtonAlpha').removeClass('gmMapListButtonSelect');
		$('#gmMapListGroup').show();
		$('#gmMapListAlpha').hide();
		$('#gmMapListGroup').focus();
		
		selItem = $('#gmMapList li.gmMapListSelect');
		if (selItem == null) return;
			
		container = $('#gmMapListGroup');
		container.scrollTop(selItem.offset().top - container.offset().top + container.scrollTop() - 200);
	});
	
	$('#gmMapListAlphaSelect').change(function(e) {
		var result = parseInt(this.options[this.selectedIndex].value);
		self.changeWorld(result);
	});
	
	return true;
}


uesp.gamemap.Map.prototype.canEdit = function ()
{
	return this.enableEdit;
}


uesp.gamemap.Map.prototype.updateMapLink = function ()
{
		// TODO: Don't hard code link element ID (allow multiple links to be updated)
	linkElement = $('#gmMapLink');
	if (linkElement == null) return false;
	
	linkElement.attr('href', this.createMapLink());
	return true;
}


uesp.gamemap.Map.prototype.createMapLink = function (mapState)
{
	var mapLink = this.mapOptions.mapUrl;
	
	if (mapState == null) mapState = this.getMapState();
	
	mapLink += '?world=' + mapState.worldId;
	mapLink += '&x=' + mapState.gamePos.x;
	mapLink += '&y=' + mapState.gamePos.y;
	mapLink += '&zoom=' + mapState.zoomLevel;
	
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
	
	//uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Extra Tiles: " + tilesLeft + ", " + tilesTop + ", " + tilesRight + ", " + tilesBottom);
	
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


uesp.gamemap.Map.prototype.convertTileToGamePos = function(tileX, tileY)
{
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	var gameX = 0;
	var gameY = 0;	
	
	gameX = Math.round(tileX / maxTiles * (this.mapOptions.gamePosX2 - this.mapOptions.gamePosX1) + this.mapOptions.gamePosX1);
	gameY = Math.round(tileY / maxTiles * (this.mapOptions.gamePosY2 - this.mapOptions.gamePosY1) + this.mapOptions.gamePosY1);
	
	//uesp.logDebug(uesp.LOG_LEVEL_ERROR, "convertTileToGamePos() = " + gameX + ", " + gameY);
	return new uesp.gamemap.Position(gameX, gameY);
}


uesp.gamemap.Map.prototype.convertGameToTilePos = function(gameX, gameY)
{
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	var tileX = 0;
	var tileY = 0;	
	
		// Note: Tile positions are floats
	tileX = (gameX - this.mapOptions.gamePosX1) * maxTiles / (this.mapOptions.gamePosX2 - this.mapOptions.gamePosX1);
	tileY = (gameY - this.mapOptions.gamePosY1) * maxTiles / (this.mapOptions.gamePosY2 - this.mapOptions.gamePosY1);
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "convertGameToTilePos() = " + tileX + ", " + tileY);
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
	
	xPos = Math.round((tilePos.x - this.startTileX) * this.mapOptions.tileSize + mapOffset.left);
	yPos = Math.round((tilePos.y - this.startTileY) * this.mapOptions.tileSize + mapOffset.top);
	
	return new uesp.gamemap.Position(xPos, yPos);
}


uesp.gamemap.Map.prototype.convertPixelToGamePos = function(pixelX, pixelY)
{
	mapOffset = this.mapRoot.offset();
	
	tileX = (pixelX - mapOffset.left) / this.mapOptions.tileSize + this.startTileX;
	tileY = (pixelY - mapOffset.top)  / this.mapOptions.tileSize + this.startTileY;
	
	return this.convertTileToGamePos(tileX, tileY);
}


uesp.gamemap.Map.prototype.createEvents = function()
{
	$(window).on("mousemove", { self: this }, this.onMouseMove);
	$('.gmMapTile').on("mousedown", { self: this }, this.onMouseDown);
	$('.gmMapTile').on("click", { self: this }, this.onClick);
	$(window).on("mouseup", { self: this }, this.onMouseUp);
	this.mapRoot.on('DOMMouseScroll mousewheel', { self: this }, this.onMouseScroll);
	this.mapContainer.on("contextmenu", {self: this}, this.onRightClick);
	
	$(window).on("keyup", { self: this }, this.onKeyUp);
	$(window).on("keydown", { self: this }, this.onKeyDown);
	
	$('.gmMapTile').dblclick({ self: this }, this.onDoubleClick);
}


uesp.gamemap.Map.prototype.createMapRoot = function()
{
	this.mapRoot = $('<div />').attr('id', 'gmMapRoot').appendTo(this.mapContainer);
}


uesp.gamemap.Map.prototype.createMapTiles = function()
{
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
					.css('user-select', 'none')
					.on('selectstart', false);
	
	//if (uesp.debug) newDiv.text(tileID);
	newTile.element = newDiv;
	
	return newTile;
}


uesp.gamemap.onLoadIconSuccess = function()
{
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
	if (!location.visible) return;
	
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
	
	if ( !(defaultMapState == null) )
	{
		gameX   = defaultMapState.gamePos.x;
		gameY   = defaultMapState.gamePos.y;
		zoom    = defaultMapState.zoomLevel;
		worldId = defaultMapState.worldId;
	}
	
	if ( !(this.queryParams.x     == null)) gameX   = parseInt(this.queryParams.x);
	if ( !(this.queryParams.y     == null)) gameY   = parseInt(this.queryParams.y);
	if ( !(this.queryParams.zoom  == null)) zoom    = parseInt(this.queryParams.zoom);
	
	if ( ! (this.queryParams.world == null))
	{
		worldId = this.getWorldId(this.queryParams.world);
	}

	var newState = new uesp.gamemap.MapState();
	
	newState.gamePos.x = gameX;
	newState.gamePos.y = gameY;
	newState.zoomLevel = zoom;
	newState.worldId   = worldId;
	
	return newState;
}


uesp.gamemap.Map.prototype.getTilePositionOfCenter = function()
{
	var gamePos = this.getGamePositionOfCenter();
	var tilePos = this.convertGameToTilePos(gamePos.x, gamePos.y);
	
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "getTilePositionOfCenter(): " + tilePos.x + ", " + tilePos.y);
	return tilePos;
}


uesp.gamemap.Map.prototype.getMapBounds = function()
{
	var rootOffset = this.mapRoot.offset();
	var mapOffset  = this.mapContainer.offset();
	var width  =  this.mapContainer.width();
	var height =  this.mapContainer.height();
	
	leftTile = this.startTileX + (mapOffset.left - rootOffset.left)/this.mapOptions.tileSize;
	topTile  = this.startTileY + (mapOffset.top  - rootOffset.top )/this.mapOptions.tileSize;
	
	rightTile   = this.startTileX + (mapOffset.left - rootOffset.left + width )/this.mapOptions.tileSize;
	bottomTile  = this.startTileY + (mapOffset.top  - rootOffset.top  + height)/this.mapOptions.tileSize;
	
	this.startTileX + this.mapOptions.tileCountX, this.startTileY + this.mapOptions.tileCountY
		
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
	
	mapState.zoomLevel = this.zoomLevel;
	mapState.gamePos   = this.getGamePositionOfCenter();
	mapState.worldId   = this.currentWorldId;
	
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


uesp.gamemap.Map.prototype.onJumpToDestinationLoad = function (eventData)
{
	if (eventData.destId == null) return;
	this.jumpToDestination(eventData.destId);
}


uesp.gamemap.Map.prototype.jumpToDestination = function (destId)
{
	if (destId <= 0) return;
	
	if (!this.hasLocation(destId))
	{
		uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Don't have data for destination location #" + destId + "!");
		this.retrieveLocation(destId, this.onJumpToDestinationLoad, { destId: destId });
		return;
	}
	
	var newState = new uesp.gamemap.MapState;
	var destLoc  = this.locations[destId];
	
	newState.worldId = destLoc.worldId;
	newState.gamePos.x = destLoc.x;
	newState.gamePos.y = destLoc.y;
	
		//TODO: Use stored zoomLevel in world?
	newState.zoomLevel = this.zoomLevel;
	
	this.setMapState(newState);
	destLoc.showPopup();
}


uesp.gamemap.Map.prototype.loadMapTiles = function()
{
	if (this.mapOptions.getMapTileFunction == null) return;
	
	if (!(this.currentWorldId in this.mapWorlds))
	{
		uesp.logError("Unknown worldID " + this.currentWorldId + "!");
		return;
	}
	
	var worldName = this.mapWorlds[this.currentWorldId].name;
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "worldID: " + this.currentWorldId + " worldName: " + worldName);
			
	for (var y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		for (var x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			var tileX = this.mapTiles[y][x].deltaTileX + this.startTileX;
			var tileY = this.mapTiles[y][x].deltaTileY + this.startTileY;
			
			if (tileX < 0 || tileY < 0 || tileX >= maxTiles || tileY >= maxTiles)
			{
				this.mapTiles[y][x].element.css("background-image", "url(" + this.mapOptions.missingMapTile + ")");
				continue;
			}
			
			var imageURL = this.mapOptions.getMapTileFunction(tileX, tileY, this.zoomLevel, worldName);
			var element  = this.mapTiles[y][x].element;
			
			$('<img/>').attr('src', imageURL)
				.load( uesp.gamemap.onMapTileLoadFunction(element, imageURL))
				.error(uesp.gamemap.onMapTileLoadFunction(element, this.mapOptions.missingMapTile));
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
	
	var worldName = this.mapWorlds[this.currentWorldId].name;
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	
	for (y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		for (x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			if (xIndex >= 0 && this.mapTiles[y][x].deltaTileX != xIndex) continue;
			if (yIndex >= 0 && this.mapTiles[y][x].deltaTileY != yIndex) continue;
			
			var tileX = this.mapTiles[y][x].deltaTileX + this.startTileX;
			var tileY = this.mapTiles[y][x].deltaTileY + this.startTileY;
			
			if (tileX < 0 || tileY < 0 || tileX >= maxTiles || tileY >= maxTiles)
			{
				this.mapTiles[y][x].element.css("background-image", "url(" + this.mapOptions.missingMapTile + ")");
				continue;
			}
			
			var imageURL = this.mapOptions.getMapTileFunction(tileX, tileY, this.zoomLevel, worldName);
			var element  = this.mapTiles[y][x].element;
			
			$('<img/>').attr('src', imageURL)
				.load( uesp.gamemap.onMapTileLoadFunction(element, imageURL))
				.error(uesp.gamemap.onMapTileLoadFunction(element, this.mapOptions.missingMapTile));
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
	
	$('#gmMapEditNoticeCancel').click(function(event) {
		self.onCancelEditMode(event);
	});
	
	$('#gmMapEditNoticeFinish').click(function(event) {
		self.onFinishEditMode(event);
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
		this.currentEditLocation.pathElement.css('z-index', '');
		this.currentEditLocation.displayData.points = this.currentEditPathPoints;
		this.currentEditLocation.computePathSize();
		this.currentEditLocation.updateFormPosition();
		this.currentEditLocation.computeOffset();
		this.currentEditLocation.updatePath();
		
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
	
	this.currentEditMode = '';
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
	this.currentEditLocation.displayData.hover.fillStyle = "rgba(255,0,0,0.5)";
	this.currentEditLocation.displayData.hover.strokeStyle = "rgba(0,0,0,1)";
	this.currentEditLocation.displayData.hover.lineWidth = 2;
	this.currentEditLocation.displayData.fillStyle = "rgba(255,255,255,0.5)";
	this.currentEditLocation.displayData.strokeStyle = "rgba(0,0,0,0.5)";
	this.currentEditLocation.displayData.lineWidth = 1;
	this.currentEditLocation.iconType = 0;
	
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
	
	location.displayData.labelPos = 6;
	location.iconType = 1;
	
	this.locations[location.id] = location;
	
	this.displayLocation(location);
	location.showPopup();
	
	return location;
}


uesp.gamemap.Map.prototype.onAddLocationClick = function (event)
{
	this.removeEditClickWall();
	this.hideEditNotice();
	this.currentEditMode = '';
	
	if (!this.canEdit()) return false;
	
	gamePos = this.convertPixelToGamePos(event.pageX, event.pageY);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "onAddLocationClick()", gamePos);
	
	this.createNewLocation(gamePos);
	
	return true;
}


uesp.gamemap.Map.prototype.onAddPathClick = function (event)
{
	if (!this.canEdit()) return false;
	if (this.currentEditLocation == null) return false;
	
	gamePos = this.convertPixelToGamePos(event.pageX, event.pageY);
	
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
	return true;
}


uesp.gamemap.Map.prototype.onAddAreaClick = function (event)
{
	this.onAddPathClick(event);
	return true;
}


uesp.gamemap.Map.prototype.onDragEnd = function(event)
{
	this.isDragging = false;
	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;
	
	this.draggingObject = null;
	this.checkTileEdges();
	
	deltaX = event.pageX - this.dragStartEventX;
	deltaY = event.pageY - this.dragStartEventY;
	
	if (deltaX != 0 || deltaY != 0)	this.updateLocations();
}


uesp.gamemap.Map.prototype.onDragMove = function(event)
{
	if (this.draggingObject == null) return;
	
	this.mapRoot.offset({
			left: event.pageX - this.dragStartLeft,
			top:  event.pageY - this.dragStartTop
	});

	if (this.checkTilesOnDrag) this.checkTileEdges();
}


uesp.gamemap.Map.prototype.onDragStart = function(event)
{
	mapOffset = this.mapRoot.offset();
	
	this.dragStartLeft = event.pageX - mapOffset.left;
	this.dragStartTop = event.pageY - mapOffset.top;
	
	this.dragStartEventX = event.pageX;
	this.dragStartEventY = event.pageY;
	
	this.draggingObject = $(event.target);
	this.isDragging = true;

	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Drag Start Offset: " + this.dragStartLeft + ", " + this.dragStartTop);
}


uesp.gamemap.Map.prototype.onRightClick = function(event)
{
	var self = event.data.self;
	event.preventDefault();
	
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "onRightClick");
	
	if (self.currentEditMode != '') return false;
	
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
	
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onClick");
	
	if (self.currentEditMode == 'addlocation')
		self.onAddLocationClick(event);
	else if (self.currentEditMode == 'addpath')
		self.onAddPathClick(event);
	else if (self.currentEditMode == 'addarea')
		self.onAddAreaClick(event);
	else if (self.currentEditMode != '')
		return false;
	
	return true;
}


uesp.gamemap.Map.prototype.onMouseDown = function(event)
{
	var self = event.data.self;
	if (event.which != 1) return false;
	
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onMouseDown");
	
	if (self.currentEditMode == 'edithandles')
		self.currentEditLocation.onPathEditHandlesMouseDown(event);
	else if (self.currentEditMode == '')
		self.onDragStart(event);
	
	event.preventDefault();
}


uesp.gamemap.Map.prototype.onDoubleClick = function(event)
{
	var self = event.data.self;
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onDoubleClick");
	
	gamePos = self.convertPixelToGamePos(event.pageX, event.pageY);
	
	self.panToGamePos(gamePos.x, gamePos.y);
}


uesp.gamemap.Map.prototype.onMouseMove = function(event)
{
	var self = event.data.self;
	
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


uesp.gamemap.Map.prototype.onKeyDown = function(event)
{
	var self = event.data.self;
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, 'onKeyDown');
	
	if (self.currentEditLocation != null && self.currentEditLocation.editPathHandles)
	{
		self.currentEditLocation.onPathEditHandlesKeyDown(event);
	}
}


uesp.gamemap.Map.prototype.onKeyUp = function(event)
{
	var self = event.data.self;
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, 'onKeyUp');
	
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
	
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onMouseScroll");
	event.preventDefault();
}



uesp.gamemap.Map.prototype.onMouseUp = function(event)
{
	var self = event.data.self;
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onMouseUp");
	
	if (event.which != 1) return false;
	
	if (self.isDragging)
	{
		self.onDragEnd(event);
		event.preventDefault();
	}
	else if (self.currentEditLocation != null && self.currentEditLocation.draggingPathHandle >= 0)
	{
		self.currentEditLocation.onPathEditHandlesDragEnd(event);
	}
}


uesp.gamemap.Map.prototype.onReceiveLocationData = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Received location data");
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, data);
	
	if (!uesp.gamemap.isNullorUndefined(data.isError))  return uesp.logError("Error retrieving location data!", data.errorMsg);
	if (uesp.gamemap.isNullorUndefined(data.locations)) return uesp.logError("Location data not found in JSON response!", data);
	
	for (key in data.locations)
	{
		var location = data.locations[key];
		if (location.id == null) continue;
		
		if ( !(location.id in this.locations))
		{
			this.locations[location.id] = uesp.gamemap.createLocationFromJson(location, this);
		}
		else
		{
			this.locations[location.id].mergeFromJson(location);
		}
		
		this.displayLocation(this.locations[location.id]);
	}
	
	return true;
}


uesp.gamemap.Map.prototype.onReceiveWorldData = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Received world data");
	uesp.logDebug(uesp.LOG_LEVEL_INFO, data);
	
	if (!uesp.gamemap.isNullorUndefined(data.isError)) return uesp.logError("Error retrieving world data!", data.errorMsg);
	if (uesp.gamemap.isNullorUndefined(data.worlds))   return uesp.logError("World data not found in JSON response!", data);
	
	for (key in data.worlds)
	{
		var world = data.worlds[key];
		uesp.logDebug(uesp.LOG_LEVEL_WARNING, world);
		
			//TODO: Better world filter
		if (world.id < this.minValidWorldId) continue;
		if (world.id > this.maxValidWorldId) continue;
		
		if (uesp.gamemap.isNullorUndefined(world.name)) continue;
		
		if (world.id in this.mapWorlds)
		{
			this.mapWorlds[world.id].mergeFromJson(world);
			this.mapWorldNameIndex[world.name] = world.id;
			this.mapWorldDisplayNameIndex[world.displayName] = world.id;
			uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Merging to existing world " + world.name);
		}
		else
		{
			this.addWorld(world.name, this.defaultMapOptions, world.id, world.displayName);
			this.mapWorlds[world.id].mergeFromJson(world);
			this.mapWorldNameIndex[world.name] = world.id;
			this.mapWorldDisplayNameIndex[world.displayName] = world.id;
			uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Creating new world " + world.name);
		}
	}
	
	this.mapWorldsLoaded = true;
	if (this.userEvents.onMapWorldsLoaded != null) this.userEvents.onMapWorldsLoaded.call(this);
	this.fillWorldList('#gmMapListAlphaSelect');
	
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
	
	$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
		self.onReceivePermissions(data); 
		//if ( !(onLoadFunction == null) ) onLoadFunction.call(self, eventData);
	});
}


uesp.gamemap.Map.prototype.retrieveLocation = function(locId, onLoadFunction, eventData)
{
	if (locId <= 0) return;
	
	var self = this;
	var queryParams = {};
	queryParams.action = "get_loc";
	queryParams.locid  = locId;
	
	$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
			self.onReceiveLocationData(data); 
			if ( !(onLoadFunction == null) ) onLoadFunction.call(self, eventData);
		});
	
	return true;
	
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
	if (!this.hasWorld(this.currentWorldId)) queryParams.incworld = 1;
	
	if (queryParams.world <= 0) return uesp.logError("Unknown worldId for current world " + this.currentWorldId + "!");
	
	$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) { self.onReceiveLocationData(data); });
	
	return true;
}


uesp.gamemap.Map.prototype.retrieveWorldData = function()
{
	var queryParams = {};
	var self = this;
	queryParams.action = "get_worlds";
	
	$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) { self.onReceiveWorldData(data); });
}


uesp.gamemap.Map.prototype.setGamePos = function(x, y, zoom, updateMap)
{
	this.setGamePosNoUpdate(x, y, zoom);
	
	if (updateMap == null || updateMap === true)
	{
		this.updateLocations();
		this.loadMapTiles();
	}
}


uesp.gamemap.Map.prototype.panToGamePos = function(x, y)
{
	var mapOffset = this.mapContainer.offset();
	
	var tilePos = this.convertGameToTilePos(x, y);
	tilePos.x -= this.mapOptions.tileCountX/2;
	tilePos.y -= this.mapOptions.tileCountY/2;
	
	tileX = Math.floor(tilePos.x);
	tileY = Math.floor(tilePos.y);
	
	newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - tilePos.x) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - tilePos.y) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	var self = this;
	
	this.mapRoot.animate({ left: newOffsetX, top: newOffsetY}, {
				complete: function() { 
					self.checkTileEdges();
					self.loadMapTiles();
					self.updateLocations();
				}
			});
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
	
	this.startTileX = Math.floor(tilePos.x);
	this.startTileY = Math.floor(tilePos.y);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "setGamePos(): startTile = " + this.startTileX + ", " + this.startTileY);
	
	newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - tilePos.x) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - tilePos.y) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
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
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "setGameZoom(): startTile = " + this.startTileX + ", " + this.startTileY);
	
	newOffsetX = Math.round(mapOffset.left + this.mapContainer.width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + this.mapContainer.height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
	
	this.updateLocations();
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.setMapState = function (newState, updateMap)
{
	if (newState == null) return;
	if (updateMap == null) updateMap = true;
	
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
	this.updateMapLink();
	
	this.removeExtraLocations();
	this.updateLocationDisplayLevels();
	this.updateLocationOffsets(animate);
	
	this.redrawLocations();
	
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
	for (key in this.locations)
	{
		if (this.locations[key].worldId != this.currentWorldId) continue;
		
		if (this.locations[key].locType >= uesp.gamemap.LOCTYPE_PATH)
		{
			this.locations[key].updatePathSize(false);
		}
		
		this.displayLocation(this.locations[key]);
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


uesp.gamemap.Map.prototype.zoomIn = function(x, y)
{
	if (this.zoomLevel >= this.mapOptions.maxZoomLevel) return;
	
	var curPos= this.getGamePositionOfCenter();
	
	this.zoomLevel++;
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Zoom In (" + x + ", " + y + ") = " + this.zoomLevel);
	
	if (uesp.gamemap.isNullorUndefined(x) || uesp.gamemap.isNullorUndefined(y))
	{
		x = this.mapContainer.width() /2;
		y = this.mapContainer.height()/2;
	}
	
	var mapOffset  = this.mapContainer.offset();
	var rootOffset = this.mapRoot.offset();
	
	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapOptions.tileSize;
	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Zoomin tile = " + tileX + ", " + tileY);
	
	newTileX = tileX*2 - this.mapOptions.tileCountX/2;
	newTileY = tileY*2 - this.mapOptions.tileCountY/2;
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Zoomin newTile = " + newTileX + ", " + newTileY);
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	
	newOffsetX = Math.round(mapOffset.left + x - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + y - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Zoomin newOffset = " + newOffsetX + ", " + newOffsetY);
	this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
	
	this.updateLocations(true);
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.zoomOut = function(x, y)
{
	if (this.zoomLevel <= this.mapOptions.minZoomLevel) return;
	
	this.zoomLevel--;
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Zoom Out (" + x + ", " + y + ") = " + this.zoomLevel);
	
	if (uesp.gamemap.isNullorUndefined(x) || uesp.gamemap.isNullorUndefined(y))
	{
		x = this.mapContainer.width() /2;
		y = this.mapContainer.height()/2;
	}
	
	var mapOffset  = this.mapContainer.offset();
	var rootOffset = this.mapRoot.offset();
	
	tileX = this.startTileX + (x + mapOffset.left - rootOffset.left) / this.mapOptions.tileSize;
	tileY = this.startTileY + (y + mapOffset.top  - rootOffset.top)  / this.mapOptions.tileSize;
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Zoomout tile = " + tileX + ", " + tileY);
	
	newTileX = tileX/2 - this.mapOptions.tileCountX/2;
	newTileY = tileY/2 - this.mapOptions.tileCountY/2;
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Zoomout newTile = " + newTileX + ", " + newTileY);
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	
	newOffsetX = Math.round(mapOffset.left + x - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + y - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Zoomout newOffset = " + newOffsetX + ", " + newOffsetY);
	this.mapRoot.offset({ left: newOffsetX, top: newOffsetY});
		
	this.updateLocations(true);
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.testArea = function()
{
	var newPath = new uesp.gamemap.Location(this);
	
	newPath.worldId = this.currentWorldId;
	newPath.x = 30000;
	newPath.y = 10000;
	newPath.width  = 40000;
	newPath.height = 40000;
	newPath.id = 1234;
	newPath.name = "Test Area";
	newPath.iconType = 1;
	newPath.locType = uesp.gamemap.LOCTYPE_AREA;
	newPath.displayData.hover = { };
	newPath.displayData.hover.fillStyle = "rgba(255,0,0,0.5)";
	newPath.displayData.hover.strokeStyle = "rgba(0,0,0,1)";
	newPath.displayData.hover.lineWidth = 2;
	newPath.displayData.fillStyle = "rgba(255,255,255,1)";;
	newPath.displayData.strokeStyle = "rgba(255,0,0,1)";
	newPath.displayData.lineWidth = 1;
	
	newPath.displayData.points = [30000, 10000, 70000, 1000, 50863,-5304, 60000, -30000, 35000, -10000];
	
	this.locations[newPath.id] = newPath;
	
	this.displayLocation(newPath);
}


uesp.gamemap.Map.prototype.testPath = function()
{
	var newPath = new uesp.gamemap.Location(this);
	
	newPath.worldId = this.currentWorldId;
	newPath.x = 30000;
	newPath.y = 10000
	newPath.width  = 40000;
	newPath.height = 40000;
	newPath.id = 1235;
	newPath.name = "Test Path";
	newPath.iconType = 2;
	newPath.locType = uesp.gamemap.LOCTYPE_PATH;
	newPath.displayData.hover = { };
	newPath.displayData.hover.fillStyle = "rgba(0,255,0,0)";
	newPath.displayData.hover.strokeStyle = "rgba(0,0,255,0.0.5)";
	newPath.displayData.hover.lineWidth = 4;
	newPath.displayData.fillStyle = "rgba(0,255,0,0)";
	newPath.displayData.strokeStyle = "rgba(0,0,255,1)";
	newPath.displayData.lineWidth = 2;
	
	newPath.displayData.points = [30000, 10000, 70000, 1000, 50863,-5304, 60000, -30000, 35000, -10000];
	
	this.locations[newPath.id] = newPath;
	
	this.displayLocation(newPath);
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
		
		this.editClickWall.click({ self: this }, this.onClick);
		this.editClickWall.mousemove({ self: this }, this.onMouseMove);
		this.editClickWall.mouseup({ self: this }, this.onMouseUp);
		this.editClickWall.mousedown({ self: this }, this.onMouseDown);
	}
	
	if (cursor == null)
		this.editClickWall.css('cursor', '');
	else
		this.editClickWall.css('cursor', cursor);
	
	this.editClickWall.css('z-index', 101);
}


uesp.gamemap.Map.prototype.removeEditClickWall = function()
{
	if (this.editClickWall == null) return;
	
	this.editClickWall.css('cursor', '');
	this.editClickWall.css('background', '');
	this.editClickWall.css('z-index', 0);
}


uesp.gamemap.Map.prototype.onEditPathHandlesStart = function (location)
{
	this.currentEditMode = 'edithandles';
	this.currentEditLocation = location;
	this.displayEditNotice('Edit path/area nodes by clicking and dragging.<br/>Hit \'Finish\' on the right when done.<br />Ctrl+Click deletes a point. Shift+Click adds a point.', 'Finish', 'Cancel');
	this.currentEditPathPoints = uesp.cloneObject(location.displayData.points);
	
	this.addEditClickWall('default');
	this.currentEditLocation.pathElement.css('z-index', '150');
	
	this.displayLocation(this.currentEditLocation);
}


uesp.gamemap.Map.prototype.onFinishedEditHandles = function()
{
	this.removeEditClickWall();
	this.currentEditLocation.pathElement.css('z-index', '');
	
	this.currentEditLocation.editPathHandles = false;
	this.displayLocation(this.currentEditLocation);
	this.currentEditLocation.showPopup();
	
	this.currentEditLocation = null;
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
							"<input type='text' class='gmMapEditPopupInput' name='parentId' value='{parentId}' size='8'  maxlength='10' /> <br />" +
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
						"<div class='gmMapEditPopupLabel'>Internal ID</div>" +
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
	
	this.worldEditPopup.find('.gmMapPopupClose').click(function(event) {
		self.onCloseWorldEditPopup(event);
	});
	
	this.worldEditPopup.find('.gmMapEditPopupButtonClose').click(function(event) {
		self.onCloseWorldEditPopup(event);
	});
	
	this.worldEditPopup.find('.gmMapEditPopupButtonSave').click(function(event) {
		self.onSaveWorldEditPopup(event);
	});
	
	this.worldEditPopup.show();
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
	
	this.getWorldFormData();
	
	//this.update();
	
	this.doWorldSaveQuery(this.currentEditWorld);
	
	return true;
}


uesp.gamemap.Map.prototype.doWorldSaveQuery = function(world)
{
	var self = this;
	
	queryParams = world.createSaveQuery();
	
	$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
		self.onSavedWorld(data); 
	});
	
	return true;
}


uesp.gamemap.Map.prototype.onSavedWorld = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Received onSavedWorld data");
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, data);
	
	if (!(data.isError == null) || data.success === false)
	{
		this.setWorldPopupEditNotice('Error saving world data!', 'error');
		return false;
	}
	
	if (data.newRevisionId != null) this.currentEditWorld.revisionId = data.newRevisionId;
	
	this.setWorldPopupEditNotice('Successfully saved location!');
	
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
	
	$("#gmMapList li").click(function(e) {
		if ($(this).hasClass('gmMapListHeader')) return false;
		if (self.mapListLastSelectedItem != null) self.mapListLastSelectedItem.removeClass('gmMapListSelect');
		$(this).addClass('gmMapListSelect');
		self.mapListLastSelectedItem = $(this);
		
		worldName = $(this).text();
		g_GameMap.changeWorld(worldName);
	});
	
	$("#gmMapList li.gmMapListHeader").click(function(e) {
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
		
		
	});
}


uesp.gamemap.defaultGetMapTile = function(tileX, tileY, zoom)
{
	return "zoom" + zoom + "/maptile_" + tileX + "_" + tileY + ".jpg"; 
}


