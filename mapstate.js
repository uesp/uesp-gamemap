/*
 * mapstate.js -- Created by Dave Humphrey (dave@uesp.net) on 22 Jan 2014
 * 		Released under the GPL v2
 *
 */


uesp.gamemap.MapState = function()
{
	this.zoomLevel = 10;
	this.gamePos = new uesp.gamemap.Position(0, 0);
	this.worldId = 0;
}