/*
 * gamemap.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Main source code for the game map system. 
 *
 */


uesp.gamemap.Map = function()
{
	this.tileCountX = 7;
	this.tileCountY = 5;
	this.tileSize   = 256;
	
	this.zoomLevel = 15;
	this.minZoomLevel = 9;
	this.maxZoomLevel = 17;
	
	this.startTileX = 0;
	this.startTileY = 0;
	
	this.gamePosX1 = 0;
	this.gamePosX2 = 0;
	this.gamePosY1 = 0;
	this.gamePosY2 = 0;
	
	this.isDragging = false;
	
	this.mapTiles = [];
	
	this.getMapTileFunction = uesp.gamemap.defaultGetMapTile;
	
	this.createMapContainer();
	this.createMapTiles();
	this.loadMapTiles();
}



uesp.gamemap.Map.prototype.createMapContainer = function()
{
	$('<div />').attr('id', 'gmMapContainer').appendTo("#gmMap");
}


uesp.gamemap.Map.prototype.createMapTiles = function()
{
	offsetX = $('#gmMap').offset().left - this.tileSize;
	offsetY = $('#gmMap').offset().top - this.tileSize;
	
	for (y = 0; y < this.tileCountY; ++y)
	{
		this.mapTiles.push([]);
		this.mapTiles[y].push( new Array(this.tileCountX));
		
		for (x = 0; x < this.tileCountX; ++x)
		{
			this.mapTiles[y][x] = this.createMapTile(x, y);
		}
	}
	
}


uesp.gamemap.Map.prototype.createMapTile = function(x, y)
{
	var newTile = new uesp.gamemap.MapTile(x, y);
	
	xPos = x * this.tileSize + offsetX;
	yPos = y * this.tileSize + offsetY;
	tileID = "Tile_" + x + "_" + y;
	
	newDiv = $('<div />').addClass('gmMapTile').attr('id', tileID).text(tileID);
	newDiv.appendTo('#gmMapContainer');
	newDiv.offset({ top: yPos, left: xPos });
	newTile.element = newDiv;
	
	return newTile;
}


uesp.gamemap.Map.prototype.loadMapTiles = function()
{
	if (this.getMapTileFunction === null) return;
			
	for (y = 0; y < this.tileCountY; ++y)
	{
		for (x = 0; x < this.tileCountX; ++x)
		{
			imageURL = this.getMapTileFunction(this.startTileX + this.mapTiles[y][x].deltaTileX, this.startTileY + this.mapTiles[y][x].deltaTileY, this.zoomLevel);
			this.mapTiles[y][x].element.css("background", "url(" + imageURL + ")");
		}
	}
}


uesp.gamemap.Map.prototype.setGetMapTileFunc = function(newFunc)
{
	this.getMapTileFunction = newFunc;
}


uesp.gamemap.defaultGetMapTile = function(tileX, tileY, zoom)
{
	return "zoom" + zoom + "/maptile_" + tileX + "_" + tileY + ".jpg"; 
}






