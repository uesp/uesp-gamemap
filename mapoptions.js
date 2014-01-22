/*
 * mapoptions.js -- Created by Dave Humphrey (dave@uesp.net) on 22 Jan 2014
 * 		Released under the GPL v2
 *
 */

uesp.gamemap.MapOptions = function(mapOptions)
{
	this.getMapTileFunction = uesp.gamemap.defaultGetMapTile;
	this.missingMapTile = "missingtile.jpg";
	
	this.minZoomLevel = 9;
	this.maxZoomLevel = 17;
	this.zoomOffset   = 0;
	
	this.tileCountX = 7;
	this.tileCountY = 5;
	this.tileSize   = 256;
	
	this.gamePosX1 = 0;
	this.gamePosX2 = 10000;
	this.gamePosY1 = 10000;
	this.gamePosY2 = 0;
	
	this.mapContainer = "#gmMap";
	
	this.debug = true;
	
	//console.debug("Before: " + this.gamePosX1);
	
	if (!uesp.gamemap.isNullorUndefined(mapOptions))
	{
		uesp.gamemap.mergeObjects(this, mapOptions);
	}
	
	//console.debug("Before: " + this.gamePosX1);
	//console.debug("Input: " + mapOptions.gamePosX1);
}