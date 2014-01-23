/*
 * world.js -- Created by Dave Humphrey (dave@uesp.net) on 22 Jan 2014
 * 		Released under the GPL v2
 *
 */


uesp.gamemap.World = function(worldName, mapOptions)
{
	this.worldName = worldName;
	this.mapOptions = new uesp.gamemap.MapOptions(mapOptions);
	this.mapState = new uesp.gamemap.MapState();
	this.mapState.worldName = worldName;
}


