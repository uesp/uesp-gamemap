/*
 * gamemap.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Main source code for the game map system. 
 *
 */

var g_GameMap = null;

uesp.gamemap.map = function()
{
	this.TileCountX = 7;
	this.TileCountY = 5;
	this.TileSize   = 256;
	
	this.ZoomLevel = 15;
	this.MinZoomLevel = 9;
	this.MaxZoomLevel = 17;
	
	this.StartTileX = 0;
	this.StartTileY = 0;
	
	this.GamePosX1 = 0;
	this.GamePosX2 = 0;
	this.GamePosY1 = 0;
	this.GamePosY2 = 0;
	
	this.IsDragging = false;
	
	this.MapTiles = [];
	
	this.GetMapTileFunction = uesp.gamemap.DefaultGetMapTile;
	
	this.CreateMapContainer();
	this.CreateMapTiles();
}



uesp.gamemap.map.prototype.CreateMapContainer = function()
{
	$('<div />').attr('id', 'gmMapContainer').appendTo("#gmMap");
}


uesp.gamemap.map.prototype.CreateMapTiles = function()
{
	OffsetX = $('#gmMap').offset().left - this.TileSize;
	OffsetY = $('#gmMap').offset().top - this.TileSize;
	
	for (y = 0; y < this.TileCountY; ++y)
	{
		this.MapTiles.push([]);
		this.MapTiles[y].push( new Array(this.TileCountX));
		
		for (x = 0; x < this.TileCountX; ++x)
		{
			XPos = x * this.TileSize + OffsetX;
			YPos = y * this.TileSize + OffsetY;
			TileID = "Tile_" + x + "_" + y;
			
			this.MapTiles[y][x] = new uesp.gamemap.maptile(x, y);
			
			newdiv = $('<div />').addClass('gmMapTile').attr('id', TileID).text(TileID);
			newdiv.appendTo('#gmMapContainer');
			newdiv.offset({ top: YPos, left: XPos });
			this.MapTiles[y][x].element = newdiv;
		}
	}
	
}


uesp.gamemap.DefaultGetMapTile = function(TileX, TileY, Zoom)
{
	return "zoom" + Zoom + "/maptile_" + TileX + "_" + TileY + ".jpg"; 
}



uesp.gamemap.onDocumentLoad = function()
{
	g_GameMap = new uesp.gamemap.map();
	console.debug("Ok");
}


$( document ).ready( uesp.gamemap.onDocumentLoad );
