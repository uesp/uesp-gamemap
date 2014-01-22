/*
 * common.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Contains common code for the GameMap system. 
 *
 */


function uesp.gamemap.position (x, y)
{
	this.x = (typeof x !== 'undefined') ? x : 0;
	this.y = (typeof y !== 'undefined') ? y : 0;
}


