/*
 * mapoptions.js -- Created by Dave Humphrey (dave@uesp.net) on 22 Jan 2014
 * 		Released under the GPL v2
 *
 * Note that most of the options here are valid for the ESO map.
 */

uesp.gamemap.MapOptions = function(mapOptions)
{
	this.getMapTileFunction = uesp.gamemap.defaultGetMapTile;
	this.missingMapTile = "missingtile.jpg";
	
	this.wikiUrl       = '';
	this.wikiNamespace = '';
	
	this.mapUrl = '';
	
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
	
	this.mapLinkElement = '#gmMapLink';
	
	this.homeWorldId = 668;
	
		// Map iconTypes values to strings
	this.iconTypeMap = null;
	
		// Temporary values for the initial ESO maps
	this.initialGamePosX = 500000;
	this.initialGamePosY = 600000;
	
	this.minValidWorldId = 50;
	this.maxValidWorldId = 20000;
	
	this.isOffline = false;
	this.useFakeMaxZoom = false;

	this.mergeOptions(mapOptions);
}


uesp.gamemap.MapOptions.prototype.mergeOptions = function(mapOptions)
{
	if (!uesp.gamemap.isNullorUndefined(mapOptions))
	{
		uesp.gamemap.mergeObjects(this, mapOptions);
	}
}


