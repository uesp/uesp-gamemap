/*
 * gamemap.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Main source code for the game map system. 
 *
 */


uesp.gamemap.Map = function(mapOptions)
{
	this.mapOptions = new uesp.gamemap.MapOptions(mapOptions);
	
	this.mapWorlds = {};
	this.currentWorldName = "__default";
	this.addWorld(this.currentWorldName, mapOptions);
	
	this.zoomLevel = 15;
	this.startTileX = 0;
	this.startTileY = 0;
	
	this.isDragging = false;
	this.draggingObject = null;
	this.dragStartLeft = 0;
	this.dragStartTop  = 0;
	this.checkTilesOnDrag = true;
	
	this.mapTiles = [];
	
	this.createMapContainer();
	this.createMapTiles();
	this.createEvents();
	
	this.setGamePos(this.mapOptions.initialGamePosX, this.mapOptions.initialGamePosY);
	
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.addWorld = function (worldName, mapOptions)
{
	this.mapWorlds[worldName] = new uesp.gamemap.World(worldName, mapOptions);
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
	
	return new uesp.gamemap.Position(tileX, tileY);
}


uesp.gamemap.Map.prototype.createEvents = function()
{

	$(window).on("mousemove", { self: this }, this.onMouseMove);
	$('#gmMapRoot').on("mousedown", { self: this }, this.onMouseDown);
	$(window).on("mouseup", { self: this }, this.onMouseUp);
	$('#gmMapRoot').on('DOMMouseScroll mousewheel', { self: this }, this.onMouseScroll);
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
	
	newDiv = $('<div />').addClass('gmMapTile').attr('id', tileID);
	newDiv.appendTo('#gmMapRoot');
	newDiv.offset({ top: yPos, left: xPos });
	if (this.mapOptions.debug) newDiv.text(tileID);
	newTile.element = newDiv;
	
	return newTile;
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


uesp.gamemap.Map.prototype.getTilePositionOfCenter = function()
{
	var gamePos = this.getGamePositionOfCenter();
	var tilePos = this.convertGameToTilePos(gamePos.x, gamePos.y);
	
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "getTilePositionOfCenter(): " + tilePos.x + ", " + tilePos.y);
	return tilePos;
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


uesp.gamemap.Map.prototype.loadMapTiles = function()
{
	if (uesp.gamemap.isNullorUndefined(this.mapOptions.getMapTileFunction)) return;
			
	for (y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		for (x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			var gamePos = this.convertTileToGamePos(this.mapTiles[y][x].deltaTileX + this.startTileX + 0.5, this.mapTiles[y][x].deltaTileY + this.startTileY + 0.5);
			
			if (!this.isGamePosInBounds(gamePos))
			{
				this.mapTiles[y][x].element.css("background", "url(" + this.mapOptions.missingMapTile + ")");
				continue;
			}
			
			imageURL = this.mapOptions.getMapTileFunction(this.startTileX + this.mapTiles[y][x].deltaTileX, this.startTileY + this.mapTiles[y][x].deltaTileY, this.zoomLevel);
			this.mapTiles[y][x].element.css("background", "url(" + imageURL + ")");
		}
	}
}


uesp.gamemap.Map.prototype.loadMapTilesRowCol = function(xIndex, yIndex)
{
	if (uesp.gamemap.isNullorUndefined(this.mapOptions.getMapTileFunction)) return;
	
	for (y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		for (x = 0; x < this.mapOptions.tileCountX; ++x)
		{
			if (xIndex >= 0 && this.mapTiles[y][x].deltaTileX != xIndex) continue;
			if (yIndex >= 0 && this.mapTiles[y][x].deltaTileY != yIndex) continue;
			
			var gamePos = this.convertTileToGamePos(this.mapTiles[y][x].deltaTileX + this.startTileX + 0.5, this.mapTiles[y][x].deltaTileY + this.startTileY + 0.5);
			
			if (!this.isGamePosInBounds(gamePos))
			{
				this.mapTiles[y][x].element.css("background", "url(" + this.mapOptions.missingMapTile + ")");
				continue;
			}
			
			imageURL = this.mapOptions.getMapTileFunction(this.startTileX + this.mapTiles[y][x].deltaTileX, this.startTileY + this.mapTiles[y][x].deltaTileY, this.zoomLevel);
			this.mapTiles[y][x].element.css("background", "url(" + imageURL + ")");
		}
	}
}



uesp.gamemap.Map.prototype.onDragEnd = function(event)
{
	this.isDragging = false;
	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;
	
	this.draggingObject = null;
	this.checkTileEdges();
}


uesp.gamemap.Map.prototype.onDragMove = function(event)
{
	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;
	
	$("#gmMapRoot").offset({
			top:  event.pageY - this.dragStartTop,
			left: event.pageX - this.dragStartLeft
	});

	if (this.checkTilesOnDrag) this.checkTileEdges();
}


uesp.gamemap.Map.prototype.onDragStart = function(event)
{
	mapOffset = $("#gmMapRoot").offset();
	this.dragStartTop = event.pageY - mapOffset.top;
	this.dragStartLeft = event.pageX - mapOffset.left;
	
	this.draggingObject = $(event.target);
	this.isDragging = true;

	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Drag Start Offset: " + this.dragStartLeft + ", " + this.dragStartTop);
}


uesp.gamemap.Map.prototype.onMouseDown = function(event)
{
	var self = event.data.self;
	if (self.mapOptions.debug) uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onMouseDown");
	
	self.onDragStart(event);
	
	event.preventDefault();
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
	
	if (self.mapOptions.debug) uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onMouseScroll");
	event.preventDefault();
}


uesp.gamemap.Map.prototype.onMouseUp = function(event)
{
	var self = event.data.self;
	if (self.mapOptions.debug) uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onMouseUp");
	
	if (self.isDragging)
	{
		self.onDragEnd(event);
		event.preventDefault();
	}
}


uesp.gamemap.Map.prototype.setGamePos = function(x, y, zoom)
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
	
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.setGameZoom = function(zoom)
{
	var newTileX = 0;
	var newTileY = 0;
	
	if (!this.isValidZoom(zoom)) return;
	
	var curGamePos = this.getGamePositionOfCenter();
	var curTilePos = this.convertGameToTilePos(curGamePos.x, curGamePos.y);
	var mapOffset = $(this.mapOptions.mapContainer).offset();
	
	newTileX = curTilePos.x * Math.pow(2, zoom - this.zoomLevel) - this.mapOptions.tileCountX/2;
	newTileY = curTilePos.y * Math.pow(2, zoom - this.zoomLevel) - this.mapOptions.tileCountY/2;
	
	this.zoomLevel = zoom;
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "setGamePos(): startTile = " + this.startTileX + ", " + this.startTileY);
	
	newOffsetX = Math.round(mapOffset.left + $(this.mapOptions.mapContainer).width()/2  - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + $(this.mapOptions.mapContainer).height()/2 - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	
	$("#gmMapRoot").offset({ left: newOffsetX, top: newOffsetY});
	
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.setMapState = function (newState)
{
	if (uesp.gamemap.isNullorUndefined(newState)) return;
	
	this.currentWorldName = newState.worldName;
	
	this.setGamePos(newState.gamePos.x, newState.gamePos.y, newState.zoomLevel);
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
	
	this.dragStartLeft -= this.mapOptions.tileSize * deltaX;
	this.dragStartTop  -= this.mapOptions.tileSize * deltaY;
	
	this.startTileX += deltaX;
	this.startTileY += deltaY;
	
	this.loadMapTilesRowCol(targetXIndex + (this.mapOptions.tileCountX - 1) * deltaX, targetYIndex + (this.mapOptions.tileCountY - 1) * deltaY);
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
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "tile = " + tileX + ", " + tileY);
	
	newTileX = tileX*2 - this.mapOptions.tileCountX/2;
	newTileY = tileY*2 - this.mapOptions.tileCountY/2;
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newTile = " + newTileX + ", " + newTileY);
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	
	newOffsetX = Math.round(mapOffset.left + x - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + y - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	$("#gmMapRoot").offset({ left: newOffsetX, top: newOffsetY});
	
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
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "tile = " + tileX + ", " + tileY);
	
	newTileX = tileX/2 - this.mapOptions.tileCountX/2;
	newTileY = tileY/2 - this.mapOptions.tileCountY/2;
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newTile = " + newTileX + ", " + newTileY);
	
	this.startTileX = Math.floor(newTileX);
	this.startTileY = Math.floor(newTileY);
	
	newOffsetX = Math.round(mapOffset.left + x - this.mapOptions.tileCountX /2 * this.mapOptions.tileSize + (this.startTileX - newTileX) * this.mapOptions.tileSize);
	newOffsetY = Math.round(mapOffset.top  + y - this.mapOptions.tileCountY /2 * this.mapOptions.tileSize + (this.startTileY - newTileY) * this.mapOptions.tileSize);
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "newOffset = " + newOffsetX + ", " + newOffsetY);
	$("#gmMapRoot").offset({ left: newOffsetX, top: newOffsetY});
	
	this.loadMapTiles();
}


uesp.gamemap.defaultGetMapTile = function(tileX, tileY, zoom)
{
	return "zoom" + zoom + "/maptile_" + tileX + "_" + tileY + ".jpg"; 
}






