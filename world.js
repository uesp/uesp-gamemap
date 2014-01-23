/*
 * world.js -- Created by Dave Humphrey (dave@uesp.net) on 22 Jan 2014
 * 		Released under the GPL v2
 *
 */


uesp.gamemap.World = function(worldName, mapOptions)
{
	this.name = worldName.toLowerCase();
	this.displayName = worldName;
	
	this.mapOptions = new uesp.gamemap.MapOptions(mapOptions);
	this.mapState = new uesp.gamemap.MapState();
	this.mapState.worldName = this.name;
	
	this.id = -1;
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
}


uesp.gamemap.World.prototype.mergeFromJson = function(data)
{
	uesp.gamemap.mergeObjects(this, data);
	
	this.mapState.worldName = this.name;
	
	//TODO: Update limits and zoom?
}


uesp.gamemap.createWorldFromJson = function(data)
{
	var newWorld = new uesp.gamemap.World(data.name, null);
	newWorld.mergeFromJson(data);
	return newWorld;
}


