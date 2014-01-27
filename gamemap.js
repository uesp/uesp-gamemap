/*
 * gamemap.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Main source code for the game map system. 
 *
 */


uesp.gamemap.Map = function(worldName, mapOptions, worldId)
{
	this.mapOptions = new uesp.gamemap.MapOptions(mapOptions);
	
	this.mapWorlds = {};
	
	if (uesp.gamemap.isNullorUndefined(worldName))
	{
		this.currentWorldName = "__default";
		this.addWorld(this.currentWorldName, mapOptions, worldId);
	} else {
		this.currentWorldName = worldName.toLowerCase();
		this.addWorld(this.currentWorldName, mapOptions, worldId);
	}
	
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
	
	this.mapTiles = [];
	
	this.queryParams = uesp.parseQueryParams();
	
	this.createMapContainer();
	this.createMapTiles();
	this.createEvents();
	
	this.setGamePosNoUpdate(this.mapOptions.initialGamePosX, this.mapOptions.initialGamePosY, this.mapOptions.initialZoom);
	this.updateMapStateFromQuery(false);
}


uesp.gamemap.Map.prototype.addWorld = function (worldName, mapOptions, worldId)
{
	worldName = worldName.toLowerCase();
	this.mapWorlds[worldName] = new uesp.gamemap.World(worldName, mapOptions, worldId);
}


uesp.gamemap.Map.prototype.changeWorld = function (worldName, newState)
{
	worldName = worldName.toLowerCase();
	if (worldName == this.currentWorldName) return;
	
	if (!uesp.gamemap.isNullorUndefined(this.mapWorlds[this.currentWorldName]))
	{
		this.mapWorlds[this.currentWorldName].mapState   = this.getMapState();
		this.mapWorlds[this.currentWorldName].mapOptions = this.mapOptions;
	}
	
	if (!uesp.gamemap.isNullorUndefined(this.mapWorlds[worldName]))
	{
		this.clearLocations();
		
		this.currentWorldName = worldName;
		this.mapOptions = this.mapWorlds[this.currentWorldName].mapOptions;
		
		if (uesp.gamemap.isNullorUndefined(newState))
			this.setMapState(this.mapWorlds[this.currentWorldName].mapState);
		else
			this.setMapState(newState);
	}
	
}


uesp.gamemap.Map.prototype.checkTileEdges = function ()
{
	tilesLeft = 0;
	tilesRight = 0;
	tilesTop = 0;
	tilesBottom = 0;
	
	extraX = this.mapOptions.tileCountX * this.mapOptions.tileSize - $(this.mapOptions.mapContainer).width();
	extraY = this.mapOptions.tileCountY * this.mapOptions.tileSize - $(this.mapOptions.mapContainer).height();
	
	tilesLeft = -Math.floor($("#gmMapRoot").offset().left / this.mapOptions.tileSize) - 1; 
	tilesTop  = -Math.floor($("#gmMapRoot").offset().top  / this.mapOptions.tileSize) - 1;
	tilesRight  = Math.floor((extraX + $("#gmMapRoot").offset().left) / this.mapOptions.tileSize);
	tilesBottom = Math.floor((extraY + $("#gmMapRoot").offset().top)  / this.mapOptions.tileSize);
	
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
	for (key in this.locations)
	{
		this.locations[key].removeElements();
	}
	
	this.locations = {};
}


uesp.gamemap.Map.prototype.convertTileToGamePos = function(tileX, tileY)
{
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	var gameX = 0;
	var gameY = 0;	
	
	gameX = tileX / maxTiles * (this.mapOptions.gamePosX2 - this.mapOptions.gamePosX1) + this.mapOptions.gamePosX1;
	gameY = tileY / maxTiles * (this.mapOptions.gamePosY2 - this.mapOptions.gamePosY1) + this.mapOptions.gamePosY1;
	
	//uesp.logDebug(uesp.LOG_LEVEL_ERROR, "convertTileToGamePos() = " + gameX + ", " + gameY);
	return new uesp.gamemap.Position(gameX, gameY);
}


uesp.gamemap.Map.prototype.convertGameToTilePos = function(gameX, gameY)
{
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
	var tileX = 0;
	var tileY = 0;	
	
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
	
	pixelW = width  * maxTiles / Math.abs(this.mapOptions.gamePosX2 - this.mapOptions.gamePosX1) * this.mapOptions.tileSize;
	pixelH = height * maxTiles / Math.abs(this.mapOptions.gamePosY2 - this.mapOptions.gamePosY1) * this.mapOptions.tileSize;
	
	return new uesp.gamemap.Position(pixelW, pixelH);
}


uesp.gamemap.Map.prototype.convertGameToPixelPos = function(gameX, gameY)
{
	mapOffset = $("#gmMapRoot").offset();
	tilePos = this.convertGameToTilePos(gameX, gameY);
	
	xPos = (tilePos.x - this.startTileX) * this.mapOptions.tileSize + mapOffset.left;
	yPos = (tilePos.y - this.startTileY) * this.mapOptions.tileSize + mapOffset.top;
	
	return new uesp.gamemap.Position(xPos, yPos);
}


uesp.gamemap.Map.prototype.convertPixelToGamePos = function(pixelX, pixelY)
{
	mapOffset = $("#gmMapRoot").offset();
	
	tileX = (pixelX - mapOffset.left) / this.mapOptions.tileSize + this.startTileX;
	tileY = (pixelY - mapOffset.top)  / this.mapOptions.tileSize + this.startTileY;
	
	return this.convertTileToGamePos(tileX, tileY);
}


uesp.gamemap.Map.prototype.createEvents = function()
{
	$(window).on("mousemove", { self: this }, this.onMouseMove);
	$('.gmMapTile').on("mousedown", { self: this }, this.onMouseDown);
	$(window).on("mouseup", { self: this }, this.onMouseUp);
	$('#gmMapRoot').on('DOMMouseScroll mousewheel', { self: this }, this.onMouseScroll);
	
	$('.gmMapTile').dblclick({ self: this }, this.onDoubleClick);
}


uesp.gamemap.Map.prototype.createMapContainer = function()
{
	$('<div />').attr('id', 'gmMapRoot').appendTo(this.mapOptions.mapContainer);
}


uesp.gamemap.Map.prototype.createMapTiles = function()
{
	offsetX = $(this.mapOptions.mapContainer).offset().left;
	offsetY = $(this.mapOptions.mapContainer).offset().top;
	
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
					.appendTo('#gmMapRoot')
					.offset({ top: yPos, left: xPos })
					.attr('unselectable', 'on')
					.css('user-select', 'none')
					.on('selectstart', false);
	
	if (uesp.debug) newDiv.text(tileID);
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
	pixelPos = this.convertGameToPixelPos(location.x, location.y);
	
	location.offsetLeft = pixelPos.x;
	location.offsetTop  = pixelPos.y;
	
	location.updateData();
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


uesp.gamemap.Map.prototype.getGamePositionOfCenter = function()
{
	var rootOffset = $("#gmMapRoot").offset();
	var mapOffset  = $(this.mapOptions.mapContainer).offset();
	
	rootCenterX = $(this.mapOptions.mapContainer).width() /2 + mapOffset.left - rootOffset.left;
	rootCenterY = $(this.mapOptions.mapContainer).height()/2 + mapOffset.top  - rootOffset.top;
	
	tileX = rootCenterX / this.mapOptions.tileSize + this.startTileX;
	tileY = rootCenterY / this.mapOptions.tileSize + this.startTileY;
	
	return this.convertTileToGamePos(tileX, tileY);
}


uesp.gamemap.Map.prototype.getWorldId = function()
{
	if (this.currentWorldName in this.mapWorlds) return this.mapWorlds[this.currentWorldName].id;
	return -1;
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
	var rootOffset = $("#gmMapRoot").offset();
	var mapOffset  = $(this.mapOptions.mapContainer).offset();
	var width  =  $(this.mapOptions.mapContainer).width();
	var height =  $(this.mapOptions.mapContainer).height();
	
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
	mapState.worldName = this.currentWorldName;
	
	return mapState;
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


uesp.gamemap.Map.prototype.loadMapTiles = function()
{
	if (uesp.gamemap.isNullorUndefined(this.mapOptions.getMapTileFunction)) return;
	
	var maxTiles = Math.pow(2, this.zoomLevel - this.mapOptions.zoomOffset);
			
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
			
			var imageURL = this.mapOptions.getMapTileFunction(tileX, tileY, this.zoomLevel);
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
			
			var imageURL = this.mapOptions.getMapTileFunction(tileX, tileY, this.zoomLevel);
			var element  = this.mapTiles[y][x].element;
			
			$('<img/>').attr('src', imageURL)
				.load( uesp.gamemap.onMapTileLoadFunction(element, imageURL))
				.error(uesp.gamemap.onMapTileLoadFunction(element, this.mapOptions.missingMapTile));
		}
	}
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
	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;
	
	$("#gmMapRoot").offset({
			left: event.pageX - this.dragStartLeft,
			top:  event.pageY - this.dragStartTop
	});

	if (this.checkTilesOnDrag) this.checkTileEdges();
}


uesp.gamemap.Map.prototype.onDragStart = function(event)
{
	mapOffset = $("#gmMapRoot").offset();
	
	this.dragStartLeft = event.pageX - mapOffset.left;
	this.dragStartTop = event.pageY - mapOffset.top;
	
	this.dragStartEventX = event.pageX;
	this.dragStartEventY = event.pageY;
	
	this.draggingObject = $(event.target);
	this.isDragging = true;

	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Drag Start Offset: " + this.dragStartLeft + ", " + this.dragStartTop);
}


uesp.gamemap.Map.prototype.onMouseDown = function(event)
{
	var self = event.data.self;
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onMouseDown");
	
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
}


uesp.gamemap.Map.prototype.onMouseScroll = function(event)
{
	var self = event.data.self;
	var rootOffset = $(self.mapOptions.mapContainer).offset();
	
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
	
	if (self.isDragging)
	{
		self.onDragEnd(event);
		event.preventDefault();
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
		
		this.locations[location.id].updateData();
		this.displayLocation(this.locations[location.id]);
	}
	
	return true;
}


uesp.gamemap.Map.prototype.onReceiveWorldData = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Received world data");
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, data);
	
	if (!uesp.gamemap.isNullorUndefined(data.isError)) return uesp.logError("Error retrieving world data!", data.errorMsg);
	if (uesp.gamemap.isNullorUndefined(data.worlds))   return uesp.logError("World data not found in JSON response!", data);
	
	for (key in data.worlds)
	{
		var world = data.worlds[key];
		
		uesp.logDebug(uesp.LOG_LEVEL_ERROR, world);
		if (uesp.gamemap.isNullorUndefined(world.name)) continue;
		
		if (uesp.gamemap.isNullorUndefined(this.mapWorlds[world.name]))
		{
			this.mapWorlds[world.name] = uesp.gamemap.createWorldFromJson(world);
			uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Creating new world " + world.name);
		}
		else
		{
			this.mapWorlds[world.name].mergeFromJson(world);
			uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Merging to existing world " + world.name);
		}
	}
	
	return true;
}


uesp.gamemap.Map.prototype.removeExtraLocations = function()
{
	var mapBounds = this.getMapRootBounds();
	
	for (key in this.locations)
	{
		if (this.locations[key].isInBounds(mapBounds)) continue;
		
		this.locations[key].removeElements();
		delete this.locations[key];
	}
	
}


uesp.gamemap.Map.prototype.retrieveLocations = function()
{
	var self = this;
	var mapBounds = this.getMapBounds();
	
	var queryParams = {};
	queryParams.action = "get_locs";
	queryParams.world  = this.getWorldId();
	queryParams.top    = mapBounds.top;
	queryParams.bottom = mapBounds.bottom;
	queryParams.left   = mapBounds.left;
	queryParams.right  = mapBounds.right;
	queryParams.zoom   = this.zoomLevel;
	
	if (queryParams.world <= 0) return uesp.logError("Unknown worldId for current world '" + this.currentWorldName + "'!");
	
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
	var mapOffset = $(this.mapOptions.mapContainer).offset();
	
	var tilePos = this.convertGameToTilePos(x, y);
	tilePos.x -= this.mapOptions.tileCountX/2;
	tilePos.y -= this.mapOptions.tileCountY/2;
	
	tileX = Math.floor(tilePos.x);
	tileY = Math.floor(tilePos.y);
	
	newOffsetX = Math.round(mapOffset.left + $(this.mapOptions.mapContainer).width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - tilePos.x) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + $(this.mapOptions.mapContainer).height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - tilePos.y) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	var self = this;
	
	$("#gmMapRoot").animate({ left: newOffsetX, top: newOffsetY}, {
				complete: function() { 
					self.checkTileEdges();
					self.loadMapTiles();
					self.updateLocations();
				}
			});
}


uesp.gamemap.Map.prototype.setGamePosNoUpdate = function(x, y, zoom)
{
	var mapOffset = $(this.mapOptions.mapContainer).offset();
	
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
	
	newOffsetX = Math.round(mapOffset.left + $(this.mapOptions.mapContainer).width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - tilePos.x) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + $(this.mapOptions.mapContainer).height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - tilePos.y) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	$("#gmMapRoot").offset({ left: newOffsetX, top: newOffsetY});
}


uesp.gamemap.Map.prototype.setGameZoom = function(zoom)
{
	var newTileX = 0;
	var newTileY = 0;
	
	if (!this.isValidZoom(zoom)) return;
	
	var curGamePos = this.getGamePositionOfCenter();
	var curTilePos = this.convertGameToTilePos(curGamePos.x, curGamePos.y);
	var mapOffset = $(this.mapOptions.mapContainer).offset();
	var zoomSize = Math.pow(2, zoom - this.zoomLevel);
	
	newTileX = curTilePos.x * zoomSize - this.mapOptions.tileCountX/2;
	newTileY = curTilePos.y * zoomSize - this.mapOptions.tileCountY/2;
	
	this.zoomLevel = zoom;
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "setGameZoom(): startTile = " + this.startTileX + ", " + this.startTileY);
	
	newOffsetX = Math.round(mapOffset.left + $(this.mapOptions.mapContainer).width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + $(this.mapOptions.mapContainer).height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	$("#gmMapRoot").offset({ left: newOffsetX, top: newOffsetY});
	
	this.updateLocations();
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.setMapState = function (newState, updateMap)
{
	if (uesp.gamemap.isNullorUndefined(newState)) return;
	
	if (updateMap == null) updateMap = true;
	
	if (this.currentWorldName != newState.worldName)
	{
		this.changeWorld(newState.worldName, newState, updateMap);
	}
	else
	{
		this.setGamePos(newState.gamePos.x, newState.gamePos.y, newState.zoomLevel, updateMap);
	}

}


uesp.gamemap.Map.prototype.shiftMapTiles = function(deltaX, deltaY)
{
	var curOffset = $("#gmMapRoot").offset();
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
	
	$("#gmMapRoot").offset({
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
	this.removeExtraLocations();
	this.updateLocationData();
	this.updateLocationDisplayLevels();
	this.updateLocationOffsets(animate);
	this.redrawLocationPaths();
	this.retrieveLocations();
}


uesp.gamemap.Map.prototype.redrawLocationPaths = function()
{
	for (key in this.locations)
	{
		if (this.locations[key].locType >= uesp.gamemap.LOCTYPE_PATH) this.locations[key].updatePathSize();
	}
}


uesp.gamemap.Map.prototype.updateLocationData = function()
{
	for (key in this.locations)
	{
		this.locations[key].updateData();
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
	tilePos = this.convertGameToTilePos(location.x, location.y);
	
	mapOffset  = $("#gmMapRoot").offset();
	xPos = (tilePos.x - this.startTileX) * this.mapOptions.tileSize + mapOffset.left;
	yPos = (tilePos.y - this.startTileY) * this.mapOptions.tileSize + mapOffset.top;
			
	location.updateOffset(xPos, yPos, animate);
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
	var gamePos = this.getGamePositionOfCenter();
	var gameX = gamePos.x;
	var gameY = gamePos.y;
	var zoom  = this.currentZoom;
	var world = this.currentWorldName;
	
	if ( ! (this.queryParams.x     == null)) gameX = parseInt(this.queryParams.x);
	if ( ! (this.queryParams.y     == null)) gameY = parseInt(this.queryParams.y);
	if ( ! (this.queryParams.zoom  == null)) zoom  = parseInt(this.queryParams.zoom);
	if ( ! (this.queryParams.world == null)) world = decodeURIComponent(this.queryParams.world);

	var newState = new uesp.gamemap.MapState();
	newState.gamePos.x = gameX;
	newState.gamePos.y = gameY;
	newState.zoomLevel = zoom;
	newState.worldName = world;
	
	this.setMapState(newState, updateMap);
	
	//this.setGamePosNoUpdate(gameX, gameY, zoom);
	//if (updateMap === true) this.updateMap();
}


uesp.gamemap.Map.prototype.zoomIn = function(x, y)
{
	if (this.zoomLevel >= this.mapOptions.maxZoomLevel) return;
	
	var curPos= this.getGamePositionOfCenter();
	
	this.zoomLevel++;
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Zoom In (" + x + ", " + y + ") = " + this.zoomLevel);
	
	if (uesp.gamemap.isNullorUndefined(x) || uesp.gamemap.isNullorUndefined(y))
	{
		x = $(this.mapOptions.mapContainer).width() /2;
		y = $(this.mapOptions.mapContainer).height()/2;
	}
	
	var mapOffset  = $(this.mapOptions.mapContainer).offset();
	var rootOffset = $("#gmMapRoot").offset();
	
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
	$("#gmMapRoot").offset({ left: newOffsetX, top: newOffsetY});
	
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
		x = $(this.mapOptions.mapContainer).width() /2;
		y = $(this.mapOptions.mapContainer).height()/2;
	}
	
	var mapOffset  = $(this.mapOptions.mapContainer).offset();
	var rootOffset = $("#gmMapRoot").offset();
	
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
	$("#gmMapRoot").offset({ left: newOffsetX, top: newOffsetY});
		
	this.updateLocations(true);
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.testArea = function()
{
	var newPath = new uesp.gamemap.Location(this);
	
	newPath.x = 30000;
	newPath.y = 10000
	newPath.width  = 40000;
	newPath.height = 40000;
	newPath.id = 1234;
	newPath.locType = uesp.gamemap.LOCTYPE_AREA;
	newPath.displayData.hover = { };
	newPath.displayData.hover.fillStyle = "rgba(255,0,0,0.5)";
	newPath.displayData.hover.strokeStyle = "rgba(0,0,0,1)";
	newPath.displayData.hover.lineWidth = 100;
	newPath.displayData.fillStyle = "rgba(255,0,0,0.25)";;
	newPath.displayData.strokeStyle = "rgba(255,0,0,0.15)";
	newPath.displayData.lineWidth = 50;
	
	newPath.displayData.points = [30000, 10000, 70000, 1000, 50863,-5304, 60000, -30000, 35000, -10000];
	
	this.locations[newPath.id] = newPath;
	
	this.displayLocation(newPath);
}


uesp.gamemap.Map.prototype.testPath = function()
{
	var newPath = new uesp.gamemap.Location(this);
	
	newPath.x = 30000;
	newPath.y = 10000
	newPath.width  = 40000;
	newPath.height = 40000;
	newPath.id = 1235;
	newPath.locType = uesp.gamemap.LOCTYPE_PATH;
	newPath.displayData.hover = { };
	newPath.displayData.hover.fillStyle = "rgba(0,255,0,0)";
	newPath.displayData.hover.strokeStyle = "rgba(0,0,255,0.0.5)";
	newPath.displayData.hover.lineWidth = 400;
	newPath.displayData.fillStyle = "rgba(0,255,0,0)";
	newPath.displayData.strokeStyle = "rgba(0,0,255,1)";
	newPath.displayData.lineWidth = 200;
	
	newPath.displayData.points = [30000, 10000, 70000, 1000, 50863,-5304, 60000, -30000, 35000, -10000];
	
	this.locations[newPath.id] = newPath;
	
	this.displayLocation(newPath);
}

uesp.gamemap.defaultGetMapTile = function(tileX, tileY, zoom)
{
	return "zoom" + zoom + "/maptile_" + tileX + "_" + tileY + ".jpg"; 
}






