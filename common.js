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
uesp.gamemap.Position = function (x, y)
{
	this.x = (typeof x !== 'undefined') ? x : 0;
	this.y = (typeof y !== 'undefined') ? y : 0;
}


uesp.gamemap.isNullorUndefined = function (variable)
{
	return (typeof variable === 'undefined' || variable === null);
}


uesp.gamemap.createMergedObject = function (obj1, obj2)
{
	var obj3 = {};
	for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
	for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
	return obj3;
}


uesp.gamemap.mergeObjects = function (obj1, obj2)
{
	for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
	return obj1;
}