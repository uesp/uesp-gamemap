/*
 * mapoptions.js -- Created by Dave Humphrey (dave@uesp.net) on 22 Jan 2014
 * 		Released under the GPL v2
 *
 */

uesp.gamemap.MapOptions = function(mapOptions)
{
	this.getMapTileFunction = uesp.gamemap.defaultGetMapTile;
	this.missingMapTile = "missingtile.jpg";
	
	this.wikiUrl       = '';
	this.wikiNamespace = '';
	
	this.iconPath    = "";
	this.iconMissing = "missing.png";
	
	this.gameDataScript = "gamemap.php";
	
	this.minZoomLevel = 9;
	this.maxZoomLevel = 17;
	this.zoomOffset   = 0;
	
	this.tileCountX = 10;
	this.tileCountY = 7;
	this.tileSize   = 256;
	
	this.tileEdgeLoadCount = 1;
	
	this.gamePosX1 = 0;
	this.gamePosX2 = 10000;
	this.gamePosY1 = 10000;
	this.gamePosY2 = 0;
	
	this.initialGamePosX = 0;
	this.initialGamePosY = 0;
	this.initialZoom     = 10;

	this.mergeOptions(mapOptions);
}


uesp.gamemap.MapOptions.prototype.mergeOptions = function(mapOptions)
{
	if (!uesp.gamemap.isNullorUndefined(mapOptions))
	{
		uesp.gamemap.mergeObjects(this, mapOptions);
	}
}


