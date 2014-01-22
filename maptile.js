/*
 * maptile.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Declares the maptile private class for use in the gamemap system. 
 *
 */


uesp.gamemap.MapTile = function(x, y)
{
	this.element = null;
	this.deltaTileX = (typeof x !== 'undefined') ? x : 0;
	this.deltaTileY = (typeof y !== 'undefined') ? y : 0;
}
