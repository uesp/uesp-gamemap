/*
 * common.js -- Created by Dave Humphrey (dave@uesp.net) on 21 Jan 2014
 * 		Released under the GPL v2
 * 		Contains common code for the GameMap system. 
 *
 */

	// Namespace definitions
var uesp = uesp || {};
uesp.gamemap = uesp.gamemap || {};

uesp.DEFAULT_DEBUG = true;

uesp.LOG_LEVEL_NONE     = 6;
uesp.LOG_LEVEL_CRITICAL = 5;
uesp.LOG_LEVEL_ERROR    = 4;
uesp.LOG_LEVEL_WARNING  = 3;
uesp.LOG_LEVEL_INFO     = 2;
uesp.LOG_LEVEL_ALL      = 1;
uesp.DEFAULT_LOG_LEVEL = uesp.LOG_LEVEL_ERROR;


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


uesp.priv_logDebug = function () {
	var args = Array.prototype.slice.call(arguments);
	uesp.priv_log.apply(this, args);
}


uesp.setDebug = function(debug)
{
	uesp.debug = debug;
	
	if (uesp.debug)
		uesp.logDebug = uesp.priv_logDebug;
	else
		uesp.logDebug = function() { };
}

uesp.setDebug(uesp.DEFAULT_DEBUG);


uesp.priv_log = function () {
	var args = Array.prototype.slice.call(arguments);
	var logLevel = args[0];
	
	if (logLevel >= uesp.LOG_LEVEL_ALL && logLevel <= uesp.LOG_LEVEL_NONE)
		args.splice(0, 1);
	else
		logLevel = uesp.logLevel;
	
	if (logLevel >= uesp.logLevel && window.console) 
	{
		if (args.length == 1)
			console.log(args[0]);
		else
			console.log(args);
	}
	
}


uesp.log = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_ALL);
	uesp.priv_log.apply(this, args);
}


uesp.priv_logCritical = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_CRITICAL);
	uesp.priv_log.apply(this, args);
}


uesp.priv_logError = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_ERROR);
	uesp.priv_log.apply(this, args);
}


uesp.priv_logWarning = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_WARNING);
	uesp.priv_log.apply(this, args);
}


uesp.priv_logInfo = function ()
{
	var args = Array.prototype.slice.call(arguments);
	args.unshift(uesp.LOG_LEVEL_INFO);
	uesp.priv_log.apply(this, args);
}


uesp.setLogLevel = function(logLevel)
{
	uesp.logLevel = logLevel;
	
	uesp.logCritical = function() { };
	uesp.logError    = function() { };
	uesp.logWarning  = function() { };
	uesp.logInfo     = function() { };
	
	if (uesp.logLevel <= uesp.LOG_LEVEL_CRITICAL) uesp.logCritical = uesp.priv_logCritical;
	if (uesp.logLevel <= uesp.LOG_LEVEL_ERROR   ) uesp.logError    = uesp.priv_logError;
	if (uesp.logLevel <= uesp.LOG_LEVEL_WARNING ) uesp.logWarning  = uesp.priv_logWarning;
	if (uesp.logLevel <= uesp.LOG_LEVEL_INFO    ) uesp.logInfo     = uesp.priv_logInfo;	
}

uesp.setLogLevel(uesp.DEFAULT_LOG_LEVEL);


	//TODO: Add more nesting levels if required
uesp.template = function (templateText, data)
{
	return templateText.replace(/{(\w*)\.?(\w*)?\.?(\w*)?}/g, function(m, key1, key2, key3) {
		if (!data.hasOwnProperty(key1)) return '';
		if (key2 == null || key2 == '') return (data[key1]);
		if (!data[key1].hasOwnProperty(key2)) return '';
		if (key3 == null || key3 == '') return (data[key1][key2]);
		if (!data[key1][key2].hasOwnProperty(key3)) return '';
		return (data[key1][key2][key3]);
	});
}


uesp.parseQueryParams = function()
{
	var queryString = location.search.substring(1).toLowerCase();
	var params = queryString.split("&");
	var resultParams = { };
	
	for (var i = 0; i < params.length; i++ )
	{
		if ( params[i].indexOf("=") >= 0 )
		{
			var paramSplit = params[i].split("=");
			resultParams[paramSplit[0]] = paramSplit[1];
		}
		else
		{
			resultParams[params[i]] = '';
		}
	}
	
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, resultParams);
	return resultParams;
}


uesp.cloneObject = function (obj)
{
		// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

		// Handle Date
	if (obj instanceof Date)
	{
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}
	
		// Handle Array
	if (obj instanceof Array)
	{
		var copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = uesp.cloneObject(obj[i]);
		}
		return copy;
	}
	
		// Handle Object
	if (obj instanceof Object)
	{
		var copy = {};
		for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = uesp.cloneObject(obj[attr]);
		}
		return copy;
	}
	
	throw new Error("Unable to clone object! Its type is not supported.");
}


uesp.square = function (x)
{
	return x * x;
}


uesp.pointDistanceSquare = function (x1, y1, x2, y2)
{
	 return uesp.square(x1 - x2) + uesp.square(y1 - y2)
}


uesp.distToSegment2 = function (px, py, x1, y1, x2, y2)
{
	var length2 = uesp.pointDistanceSquare(x1, y1, x2, y2);
	if (length2 == 0) return uesp.pointDistanceSquare(px, py, x1, y1);
	
	var t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / length2;
	if (t < 0) return uesp.pointDistanceSquare(px, py, x1, y1);
	if (t > 1) return uesp.pointDistanceSquare(px, py, x2, y2);
	
	return uesp.pointDistanceSquare(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1));
}


uesp.distToSegment = function (px, py, x1, y1, x2, y2)
{
	return Math.sqrt(uesp.distToSegment2(px, py, x1, y1, x2, y2));
}


uesp.getFormData = function (form)
{
	formValues = {};
	if (form == null) return formValues;
	
	$.each(form.serializeArray(), function(i, field) {
		fields = field.name.split('.');
		
		if (fields.length == 1)
		{
			formValues[field.name] = field.value;
		}
		else if (fields.length == 2)
		{
			if (formValues[fields[0]] == null) formValues[fields[0]] = { };
			formValues[fields[0]][fields[1]] = field.value;
		}
		else if (fields.length == 3)
		{
			if (formValues[fields[0]][fields[1]] == null) formValues[fields[0]][fields[1]] = { };
			formValues[fields[0]][fields[1]][fields[2]] = field.value;
		}
		else
		{
			uesp.logError("Too many nested levels in form name'" + field.name + "'!");
		}
	});
	
	return formValues;
}