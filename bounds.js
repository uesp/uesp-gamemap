/*
 * bounds.js -- Created by Dave Humphrey (dave@uesp.net) on 24 Jan 2014
 * 		Released under the GPL v2
 *
 */


uesp.gamemap.Bounds = function(left, top, right, bottom)
{
	this.left   = (typeof left   === 'undefined' || left   === null) ? 0 : left;
	this.right  = (typeof right  === 'undefined' || right  === null) ? 0 : right;
	this.top    = (typeof top    === 'undefined' || top    === null) ? 0 : top;
	this.bottom = (typeof bottom === 'undefined' || bottom === null) ? 0 : bottom;
}