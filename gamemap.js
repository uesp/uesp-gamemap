/*
 * gamemap.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Main source code for the game map system. 
 *
 */


uesp.gamemap.Map = function(mapOptions)
{
	this.mapOptions = new uesp.gamemap.MapOptions(mapOptions);
	
	this.zoomLevel = 15;
	this.startTileX = 0;
	this.startTileY = 0;
	
	this.isDragging = false;
	this.draggingObject = null;
	this.dragStartLeft = 0;
	this.dragStartTop  = 0;
	
	this.mapTiles = [];
	
	this.createMapContainer();
	this.createMapTiles();
	this.createEvents();
	
	this.loadMapTiles();
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
	offsetX = $(this.mapOptions.mapContainer).offset().left - this.mapOptions.tileSize;
	offsetY = $(this.mapOptions.mapContainer).offset().top - this.mapOptions.tileSize;
	
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


uesp.gamemap.Map.prototype.loadMapTiles = function()
{
	if (uesp.gamemap.isNullorUndefined(this.mapOptions.getMapTileFunction)) return;
			
	for (y = 0; y < this.mapOptions.tileCountY; ++y)
	{
		for (x = 0; x < this.mapOptions.tileCountX; ++x)
		{
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
}


uesp.gamemap.Map.prototype.onDragMove = function(event)
{
	if (uesp.gamemap.isNullorUndefined(this.draggingObject)) return;
	
	$("#gmMapRoot").offset({
			top:  event.pageY - this.dragStartTop,
			left: event.pageX - this.dragStartLeft
	});

}


uesp.gamemap.Map.prototype.onDragStart = function(event)
{
	mapOffset = $("#gmMapRoot").offset();
	this.dragStartTop = event.pageY - mapOffset.top;
	this.dragStartLeft = event.pageX - mapOffset.left;
	
	this.draggingObject = $(event.target);
	this.isDragging = true;

	if (this.mapOptions.debug) console.debug("Drag Start Offset: " + this.dragStartLeft + ", " + this.dragStartTop);
}


uesp.gamemap.Map.prototype.onMouseDown = function(event)
{
	var self = event.data.self;
	if (self.mapOptions.debug) console.debug("onMouseDown");
	
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
	var rootOffset = $("#gmMapRoot").offset();
	var zoomX =event.pageX - rootOffset.left;
	var zoomY =event.pageY - rootOffset.top;
	
	if (event.originalEvent.detail > 0 || event.originalEvent.wheelDelta < 0)
	{
		self.zoomOut(zoomX, zoomY);
	} else {
		self.zoomIn(zoomX, zoomY);
	}
	
	if (self.mapOptions.debug) console.debug("onMouseScroll");
	event.preventDefault();
}


uesp.gamemap.Map.prototype.onMouseUp = function(event)
{
	var self = event.data.self;
	if (self.mapOptions.debug) console.debug("onMouseUp");
	
	if (self.isDragging)
	{
		self.onDragEnd(event);
		event.preventDefault();
	}
}


uesp.gamemap.Map.prototype.zoomIn = function(x, y)
{
	if (this.zoomLevel >= this.mapOptions.maxZoomLevel) return;
	
	this.zoomLevel++;
	if (this.mapOptions.debug) console.debug("Zoom (" + x + ", " + y + ") = " + this.zoomLevel);
	
	centerTileX = this.startTileX + this.mapOptions.tileCountX/2;
	centerTileY = this.startTileY + this.mapOptions.tileCountY/2;
	
	this.startTileX = Math.round(centerTileX*2 - this.mapOptions.tileCountX/2);
	this.startTileY = Math.round(centerTileY*2 - this.mapOptions.tileCountY/2);
	
	this.loadMapTiles();
}


uesp.gamemap.Map.prototype.zoomOut = function(x, y)
{
	if (this.zoomLevel <= this.mapOptions.minZoomLevel) return;
	
	this.zoomLevel--;
	if (this.mapOptions.debug) console.debug("Zoom = " + this.zoomLevel);
	
	centerTileX = this.startTileX + this.mapOptions.tileCountX/2;
	centerTileY = this.startTileY + this.mapOptions.tileCountY/2;
	
	this.startTileX = Math.round(centerTileX/2 - this.mapOptions.tileCountX/2);
	this.startTileY = Math.round(centerTileY/2 - this.mapOptions.tileCountY/2);
	
	this.loadMapTiles();
}


uesp.gamemap.defaultGetMapTile = function(tileX, tileY, zoom)
{
	return "zoom" + zoom + "/maptile_" + tileX + "_" + tileY + ".jpg"; 
}






