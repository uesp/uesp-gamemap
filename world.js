/*
 * world.js -- Created by Dave Humphrey (dave@uesp.net) on 22 Jan 2014
 * 		Released under the GPL v2
 *
 */


uesp.gamemap.World = function(worldName, mapOptions, worldId)
{
	this.name = worldName.toLowerCase();
	this.displayName = worldName;
	
	this.mapOptions = new uesp.gamemap.MapOptions(mapOptions);
	
	this.id = (worldId == null) ? 0 : worldId;
	this.description = '';
	this.wikiPage ='';
	this.cellSize = -1;
	this.missingMapTile = this.mapOptions.missingMapTile;
	this.minZoom = this.mapOptions.minZoomLevel;
	this.maxZoom = this.mapOptions.maxZoomLevel;
	this.zoomOffset = this.mapOptions.zoomOffset;
	this.posLeft = this.mapOptions.gamePosX1;
	this.posTop = this.mapOptions.gamePosY1;
	this.posRight = this.mapOptions.gamePosX2;
	this.posBottom = this.mapOptions.gamePosY2;
	this.enabled = true;
	
	this.mapState = new uesp.gamemap.MapState();
	this.mapState.worldId = this.id;
	this.mapState.gamePos.x = this.mapOptions.initialGamePosX;
	this.mapState.gamePos.y = this.mapOptions.initialGamePosY;
	this.mapState.zoomLevel = this.mapOptions.initialZoom;
}


uesp.gamemap.World.prototype.mergeFromJson = function(data)
{
	uesp.gamemap.mergeObjects(this, data);
	
	this.mapState.worldId = this.id;
	
	this.mapOptions.minZoomLevel = this.minZoom;
	this.mapOptions.maxZoomLevel = this.maxZoom;
	this.mapOptions.zoomOffset   = this.zoomOffset;
	
	this.mapOptions.gamePosX1 = this.posLeft;
	this.mapOptions.gamePosX2 = this.posRight;
	this.mapOptions.gamePosY1 = this.posTop;
	this.mapOptions.gamePosY2 = this.posBottom;
	
	this.updateStateFromOptions();
}


uesp.gamemap.World.prototype.mergeMapOptions = function(mapOptions)
{
	this.mapOptions.mergeOptions(mapOptions);
	this.updateStateFromOptions();
}


uesp.gamemap.World.prototype.updateStateFromOptions = function()
{
	this.mapState.worldId = this.id;
	this.mapState.gamePos.x = this.mapOptions.initialGamePosX;
	this.mapState.gamePos.y = this.mapOptions.initialGamePosY;
	this.mapState.zoomLevel = this.mapOptions.initialZoom;
}


uesp.gamemap.createWorldFromJson = function(data)
{
	var newWorld = new uesp.gamemap.World(data.name, null);
	
	newWorld.mergeFromJson(data);
	
	return newWorld;
}


