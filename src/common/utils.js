/**
 * @name utils.js
 * @author Thal-J <thal-j@uesp.net> (28th August 2022)
 * @summary Contains general utility functions for the gamemap.
 */

import * as Constants from "./constants.js";

/*================================================
			Is mobile device function
================================================*/

export function isMobile() {
	return (navigator.userAgent.match(/Mobi/));
}

/*================================================
				Debug print function
================================================*/

if (isDebug) {
	// override print function to be custom console log
	let print = {};
	print = function(){};
	window.print = print;
	print = window.console.log = window.console.log.bind(window.console.log, "%c[Debug]%o", "color: black; font-weight: bold; padding: 2px; background: aqua;");
	print.warn = window.console.warn = window.console.warn.bind(window.console.warn, "%c[Warn]%o", "color: black; font-weight: bold; padding: 2px; background: yellow;");
	print.error = window.console.error = window.console.error.bind(window.console.error, "%c[Error]%o", "color: black; font-weight: bold; padding: 2px; background: palevioletred ;");
	window.print = print;
	window.print.warn = print.warn;
	window.print.error = print.error;
} else {
	// disable console logging entirely
	let console = {};
	console.log = function(){};
	window.console = console;
	let print = {};
	print = function(){};
	window.print = print;
	print = console.log.bind(console);
	window.print = print;
	window.print.warn = print;
	window.print.error = print;
}

/*================================================
			JSON object parsing function
================================================*/

export function getJSON(url, callback) {
	try {
		fetch(url)
			.then((response) => response.text())
			.then((data) => {
				try {
					// remove comments before parsing
					callback(null, JSON.parse((data.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m))));
				} catch (error) {
					console.log(error);
					callback(error, null);
				}
			});

	} catch (error){
		callback(error, null);
	}
}

/*================================================
			 Get URL parameters function
================================================*/

window.getURLParams = function(paramType) {
	let urlParams;

	if (paramType == null || paramType == Constants.PARAM_TYPE_QUERY) {

		urlParams = location.search.replace("#\?", '');
	} else {
		urlParams = location.hash.replace("#\?", '');
	}

	urlParams = urlParams.toLowerCase();
	return new URLSearchParams(urlParams); //create params array
}

/*================================================
			 String ends-with function
================================================*/

export function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/*================================================
			 String begins-with function
================================================*/

export function beginsWith(str, suffix) {
	return str.substring(0, suffix.length) === suffix;
}

/*================================================
	  Create new instance of object function
================================================*/

export function cloneObject(obj){
	// Handle the 3 simple types, and null or undefined
	if (null == obj || "object" != typeof obj) return obj;

	// Handle Date
	if (obj instanceof Date) {
		var copy = new Date();
		copy.setTime(obj.getTime());
		return copy;
	}

	// Handle Array
	if (obj instanceof Array) {
		var copy = [];
		for (var i = 0, len = obj.length; i < len; i++) {
			copy[i] = uesp.cloneObject(obj[i]);
		}
		return copy;
	}

	// Handle Object
	if (obj instanceof Object) {
		var copy = {};
		for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = cloneObject(obj[attr]);
		}
		return copy;
	}

	throw new Error("Unable to clone object! Its type is not supported.");
}

/*================================================
		    Get HTML form data function
================================================*/

export function getFormData(form) {
	formValues = {};
	if (form == null) return formValues;

	$.each(form.serializeArray(), function(i, field) {
		let fields = field.name.split('.');

		if (fields.length == 1) {
			formValues[field.name] = field.value;
		}
		else if (fields.length == 2) {
			if (formValues[fields[0]] == null) formValues[fields[0]] = { };
			formValues[fields[0]][fields[1]] = field.value;
		}
		else if (fields.length == 3) {
			if (formValues[fields[0]][fields[1]] == null) formValues[fields[0]][fields[1]] = { };
			formValues[fields[0]][fields[1]][fields[2]] = field.value;
		}
		else {
			log("Too many nested levels in form name'" + field.name + "'!");
		}
	});

	return formValues;
}

/*================================================
		      Simple square function
================================================*/

export function square(x) {
	return x * x;
}

/*================================================
		   Point square distance function
================================================*/

export function pointDistanceSquare (x1, y1, x2, y2) {
	 return square(x1 - x2) + square(y1 - y2)
}

/*================================================
		   Distance to segment function
================================================*/

export function distToSegment(px, py, x1, y1, x2, y2) {

	let length2 = pointDistanceSquare(x1, y1, x2, y2);
	if (length2 == 0) return pointDistanceSquare(px, py, x1, y1);

	let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / length2;
	if (t < 0) return pointDistanceSquare(px, py, x1, y1);
	if (t > 1) return pointDistanceSquare(px, py, x2, y2);

	return Math.sqrt(pointDistanceSquare(px, py, x1 + t * (x2 - x1), y1 + t * (y2 - y1)));
}

/*================================================
		      Merge objects functions
================================================*/

export function mergeObjects(obj1, obj2) {
	let obj3 = {
		...obj1,
		...obj2
	};
	return obj3;
}

/*================================================
	  Clean duplicate entries in array function
================================================*/

export function getUniqueListFrom(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()]
}

/*================================================
	  		RGBA to hex colour function
================================================*/

export function RGBAtoHex(color) {
	if (/^rgb/.test(color)) {
		const rgba = color.replace(/^rgba?\(|\s+|\)$/g, '').split(',');

		// rgb to hex
		// eslint-disable-next-line no-bitwise
		let hex = `#${((1 << 24) + (parseInt(rgba[0], 10) << 16) + (parseInt(rgba[1], 10) << 8) + parseInt(rgba[2], 10))
		  .toString(16)
		  .slice(1)}`;

		// added alpha param if exists
		if (rgba[4]) {
		  const alpha = Math.round(0o1 * 255);
		  const hexAlpha = (alpha + 0x10000).toString(16).substr(-2).toUpperCase();
		  hex += hexAlpha;
		}

		return hex;
	  }
	  return color;
}

/*================================================
	  		Is browser firefox function
================================================*/

export function isFirefox() {
	return (navigator.userAgent.indexOf('Firefox') !== -1);
}

/*================================================
	  		Find next power of two function
================================================*/

export function nextPowerOfTwo(n) {
	// decrement `n` (to handle cases when `n` itself
	// is a power of 2)
	n = n - 1;

	// do till only one bit is left
	while ((n & n - 1) != 0) {
		n = n & n - 1;  // unset rightmost bit
	}

	// `n` is now a power of two (less than `n`)

	// return next power of 2
	return n << 1;
}

/*================================================
	  	    Sanitise string function
================================================*/

export function sanitiseString(str){
    str = str.replace(/[^a-z0-9áéíóúñü \.,_-]/gim,"");
    return str.trim();
}

/*================================================
			  Is variable null function
================================================*/

export function isNull(variable) {
	return (typeof variable === 'undefined' || variable === null);
}

/*================================================
	  	    Change FavIcon function
================================================*/

export function changeFavIcon(favIconURL) {
	let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
	link.type = 'image/x-icon';
	link.rel = 'shortcut icon';
	link.href = favIconURL;
	document.getElementsByTagName('head')[0].appendChild(link);
}

export function injectCSS(cssPath) {
	cssPath = cssPath + "?" + Math.random(); // ensure that the custom css is not cached and is redownloaded
	document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend","<link rel=\"stylesheet\" href=\"" + cssPath + "\" />");
}


/*================================================
	  			Queryify function
================================================*/

export function queryify(object) {

	//gamemap.php?action=get_perm&db=eso
	let query = "?";
	let entries = Object.entries(object);

	entries.forEach(function(entry) {
		query += (entry[0] + "=" + entry[1]);

		if ((entries.indexOf(entry) + 1) < entries.length) {
			query += "&"
		}

	})

	return query;
}

/*================================================
	  			   Set cookie
================================================*/

export function setCookie(key, value, days, recursion) {

	if (days == null) {
		days = 9999;
	}
	const d = new Date();
	d.setTime(d.getTime() + (days*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = key + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
}

/*================================================
	  			   Get cookie
================================================*/

export function getCookie(c_name) {
    var c_value = " " + document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1) {
        c_value = null;
    }
    else {
        c_start = c_value.indexOf("=", c_start) + 1;
        var c_end = c_value.indexOf(";", c_start);
        if (c_end == -1) {
            c_end = c_value.length;
        }
        c_value = unescape(c_value.substring(c_start,c_end));
    }
    return c_value;
}

/*================================================
	  			   Set prefs
================================================*/

window.setPrefs = function(key, value) {
	setCookie(key, value);
}

/*================================================
	  			   Get prefs
================================================*/

window.getPrefs = function(key) {
	// take preference over URL parms over cookies
	if (getURLParams().has(key)){
		return getURLParams().get(key);
	} else {
		let value = (getCookie(key) != null && getCookie(key) != "") ? getCookie(key) : false;

		if ((typeof value === 'string' || value instanceof String) && (value.toLowerCase() == "true" || value.toLowerCase() == "false")) {
			return JSON.parse(value);
		} else {
			return value;
		}
	}
}