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
	this.missingMapTileFunction = null;
	
	this.useCanvasDraw = false;
	
	this.useLeaflet = false;
	this.leafletTileLayer = '';
	
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
	
	this.dbPrefix = "";
	this.helpTemplate = "templates/helpblock.txt";
	this.showSearchThisLocation = true;
	
	this.defaultIconWidth = 32;
	this.defaultIconHeight = 32;
	
	this.canvasBGColor = "black";
	this.canvasBGColorFunction = null;
	
	this.gridStartX = 0;
	this.gridStartY = 0;
	this.gridStopX = 0;
	this.gridStopY = 0;
	this.gridDeltaX = 256;
	this.gridDeltaY = 256;
	this.gridLabelDeltaX = 5;
	this.gridLabelDeltaY = 5;
	this.gridStartLabelZoom = 10;
	this.gridShowLabels = true;
	this.gridLabelOffsetX = 0;
	this.gridLabelOffsetY = 0;	
	this.gridStyle = "yellow";
	
	this.gridOffsetX = 0;
	this.gridOffsetY = 0;
	this.gridOffsetPowerY = 0;
	
	this.cellResourceStartX = 0;
	this.cellResourceStartY = 0;
	this.cellResourceStopX = 0;
	this.cellResourceStopY = 0;
	this.cellResourceDeltaX = 256;
	this.cellResourceDeltaY = 256;
	
	this.displayStates = [];
	
	this.mergeOptions(mapOptions);
}

uesp.gamemap.MapOptions.prototype.mergeOptions = function(mapOptions)
{
	if (!uesp.gamemap.isNullorUndefined(mapOptions))
	{
		uesp.gamemap.mergeObjects(this, mapOptions);
	}
}