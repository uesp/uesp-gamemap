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
	this.wiki_page ='';
	this.cell_size = -1;
	this.min_zoom = this.mapOptions.minZoomLevel;
	this.max_zoom = this.mapOptions.maxZoomLevel;
	this.pos_left = this.mapOptions.gamePosX1;
	this.pos_top = this.mapOptions.gamePosY1;
	this.pos_right = this.mapOptions.gamePosX2;
	this.pos_bottom = this.mapOptions.gamePosY2;
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
	
	//this.displayName = encodeURIComponent(this.displayName);
	
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


