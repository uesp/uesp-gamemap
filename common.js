/*
 * common.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Contains common code for the GameMap system. 
 *
 */

	// Namespace definitions
var uesp = uesp || {};
uesp.gamemap = uesp.gamemap || {};


	// Simple position/point class
uesp.gamemap.position = function (x, y)
{
	this.x = (typeof x !== 'undefined') ? x : 0;
	this.y = (typeof y !== 'undefined') ? y : 0;
}


