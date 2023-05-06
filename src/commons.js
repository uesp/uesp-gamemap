/**
 * @name commons.js
 * @author Thal-J <thal-j@uesp.net> (28th August 2022)
 * @summary Contains common functions and constants for the gamemap.
 */

import Point from "./map/objects/point";

/*================================================
					Constants
================================================*/

window.ASSETS_DIR = "assets/";
window.MAP_ASSETS_DIR = "assets/maps/";
window.CONFIG_DIR = ASSETS_DIR + "configs/";
window.TEMPLATES_DIR = ASSETS_DIR + "templates/";
window.ICONS_DIR = ASSETS_DIR + "icons/";
window.IMAGES_DIR = ASSETS_DIR + "images/";

window.PARAM_TYPE_QUERY = 0;
window.PARAM_TYPE_HASH = 1;

window.CSS_OVERRIDE_FILENAME = "override.css"
window.MAP_CONFIG_FILENAME = "config.json"
window.DEFAULT_MAP_CONFIG_DIR = MAP_ASSETS_DIR + "default-" + MAP_CONFIG_FILENAME;

window.GAME_DATA_SCRIPT = (isRelease) ? "db/gamemap.php" : "http://localhost:2500/db/gamemap.php"

window.LOCTYPES = {
	MARKER : 1,
	PATH : 2,
	AREA : 3,
}

window.COORD_TYPES = {
	XY : 0,
    NORMALISED : 1,
    WORLDSPACE : 2,
	PSEUDO_NORMALISED : 3,
}

// legacy positions:
// 	0 : 'None',
// 	1 : 'Top Left',
// 	2 : 'Top Center',
// 	3 : 'Top Right',
// 	4 : 'Middle Left',
// 	5 : 'Center',
// 	6 : 'Middle Right',
// 	7 : 'Bottom Left',
// 	8 : 'Bottom Center',
// 	9 : 'Bottom Right',

window.LABEL_POSITIONS = {
	0  : 'None',
	4  : 'Left',
	5  : 'Center',
	6  : 'Right',
	2  : 'Top',
	8  : 'Bottom',
	10 : 'Auto',
};

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

/*================================================
					Functions
================================================*/

/** Returns whether current device is a mobile device or not. */
window.isMobile = function isMobile() {
	return (navigator.userAgent.match(/Mobi/));
}

/** Returns whether current browser is firefox or not. */
window.isFirefox = function isFirefox() {
	return (navigator.userAgent.indexOf('Firefox') !== -1);
}

/** Debug print function,disabled on release */
if (isDebug || location.toString().includes("localhost") || location.toString().includes("devgame")) {
	// override print function to be custom console log

	window.addEventListener('beforeprint', function(event) {
		// Prevent the default print action from occurring
		event.preventDefault();
	});
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

/** Function to return JSON data from endpoint as JSON object
 * @param {String} url - The endpoint url, as a string
 * @param {Function} callback - The callback function to be executed on successful data return
 * @returns {Object} data - JSON object that is a result of the api call
 */
window.getJSON = function getJSON(url, callback) {
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

/** Function to parse the parameters in the current URL object
 * @param {Integer} paramType - A constant to tell the function which params to look for (hash or query)
 * @returns {URLSearchParams} urlParams - A URLSearchParams object containing the parsed parameters
 */
window.getURLParams = function getURLParams(paramType) {
	let urlParams;

	if (paramType == null || paramType == PARAM_TYPE_QUERY) {

		urlParams = location.search.replace("#\?", '');
	} else {
		urlParams = location.hash.replace("#\?", '');
	}

	urlParams = urlParams.toLowerCase();
	return new URLSearchParams(urlParams); //create params array
}

/** Function that checks if a string ends with a certain string
 * @param {String} str - The string to be checked
 * @param {String} suffix - The suffix string to be compared
 * @returns {Boolean} - Whether or not the provided suffix was at the end of the string.
 */
window.endsWith = function endsWith(str, suffix) {
	return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/** Function that checks if a string begins with a certain string
 * @param {String} str - The string to be checked
 * @param {String} prefix - The prefix string to be compared
 * @returns {Boolean} - Whether or not the provided prefix was at the beginning of the string.
 */
window.beginsWith = function beginsWith(str, prefix) {
	return str.substring(0, prefix.length) === prefix;
}

/** Function that merges two objects together.
 * @param {Object} obj1 - The base object
 * @param {Object} obj2 - The secondary object to be merged into the base
 * @returns {Object} obj3 - The final merged object
 */
window.mergeObjects = function mergeObjects(obj1, obj2) {
	let obj3 = {
		...obj1,
		...obj2
	};
	return obj3;
}

/** Simple square function.
 * @param {Integer} x - The number to be squared
 * @returns {Integer} x - The result
 */
window.square = function square(x) {
	return x * x;
}

/** Simple array atomiser function, removes duplicate items from a list
 * @param {Array} arr - The array to be de-duplicated
 * @param {Object} key - The key used in de-duplication
 * @returns {Array} The result
 */
window.getUniqueListFrom = function getUniqueListFrom(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()]
}

/** Function that converts rgba string to hex
 * @param {String} color - The original RGBA string
 * @returns {String} The provided colour, but in hex format
 */
window.RGBAtoHex = function RGBAtoHex(color) {
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

/** Function to find the next power of two given an int
 * @param {Integer} n - The number to be compared
 * @returns {Integer} n - The next power of two from that number
 */
window.nextPowerOfTwo = function nextPowerOfTwo(n) {
	// decrement `n` (to handle cases when `n` itself
	// is a power of 2)
	n = n - 1;

	// do till only one bit is left
	while ((n & n - 1) != 0) {
		n = n & n - 1;  // unset rightmost bit
	}
	return n << 1;
}

/** Check if an object is null or undefined query object into a queryable string
 * @param {Object} variable - The object to be checked
 * @returns {Boolean} - Whether or not the object was null.
 */
window.isNull = function isNull(variable) {
	return (typeof variable === 'undefined' || variable === null);
}

/** Change favIcon to provided URL
 * @param {String} favIconURL - Path to desired favIcon
 */
window.changeFavIcon = function changeFavIcon(favIconURL) {
	let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
	link.type = 'image/png';
	link.rel = 'icon';
	link.href = favIconURL;
	document.getElementsByTagName('head')[0].appendChild(link);
}

/** Inject css URL as string into DOM
 * @param {String} cssPath - Path to desired css file to be injected
 */
window.injectCSS = function injectCSS(cssPath) {
	cssPath = cssPath + "?" + Math.random(); // ensure that the custom css is not cached and is redownloaded
	document.getElementsByTagName("head")[0].insertAdjacentHTML("beforeend","<link rel=\"stylesheet\" href=\"" + cssPath + "\" />");
}

/** Convert query object into a queryable string
 * @param {Object} object - The object to be querified
 * @returns {String} query - The resulting URL query string
 */
window.queryify = function queryify(object) {

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

/** Convert query string into javascript object
 * @param {String} query - The string to be objectified
 * @returns {Object} object - The resulting javascript object
 */
window.objectify = function objectify(query) {

	const params = new URLSearchParams(query)

	const obj = {}
	for (const key of params.keys()) {
	if (params.getAll(key).length > 1) {
		obj[key] = params.getAll(key)
	} else {
		obj[key] = params.get(key)
	}
	}

	console.log(obj)

	return obj;
}

/** Set browser cookie function
 * @param {String} key - The unique key of the cookie to set
 * @param {Object} value - The unique key of the cookie to set
 * @param {Integer} days - How many days the cookie is valid for (if null, then infinite)
 */
function setCookie(key, value, days) {

	if (days == null) {
		days = 999999;
	}
	const d = new Date();
	d.setTime(d.getTime() + (days*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = key + "=" + value + ";" + expires + ";path=/;SameSite=Lax";
}

/** Get browser cookie function
 * @param {String} c_name - The name of the cookie to get
 * @returns {String} value - the value of the cookie, or null if none found
 */
function getCookie(c_name) {
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

/** Function to save a shared preference value to the browser
 * @param {String} key - The shared preference key to set
 * @param {Object} value - The desired value to set
 */
window.setPrefs = function setPrefs(key, value) {
	print(value);
	setCookie(key, value);
}

/** Function that gets browser shared preference value from a key
 * @param {String} key - The shared preference key to search for
 * @param {Object} defaultValue - The default value of this key, if it doesn't exist already
 * @returns {Object} value - whatever the shared preference was set to, or false if none was found
 */
window.getPrefs = function getPrefs(key, defaultValue) {

	print(key);
	print(defaultValue);

	// set default value
	defaultValue = (defaultValue != null) ? defaultValue : false;

	// take preference over URL parms over cookies
	if (getURLParams().has(key)){
		print("should be called")
		return getURLParams().get(key);
	} else {
		let value = (getCookie(key) != null && getCookie(key) != "") ? getCookie(key) : defaultValue;
		setPrefs(key, value);

		if ((typeof value === 'string' || value instanceof String) && (value.toLowerCase() == "true" || value.toLowerCase() == "false")) {
			return JSON.parse(value);
		} else {
			return value;
		}
	}
}

/** Function that gets whether a provided value is a string
 * @param {String} str - The value to compare
 * @returns - whether the provided value was a string or not
 */
window.isString = function isString(str) {
	return (typeof str === 'string' || str instanceof String)
}

/** Function that gets the average (centre) coordinate of an array of point objects
 * @param {Array} coords - The list to iterate through
 * @returns {Point} - the centralised coord object
 */
window.getAverageCoord = function getAverageCoord(coords) {

	print(coords);

	if (coords[0].lat != null) {
		for (let i = 0; i < coords.length; i++) {
			coords[i] = gamemap.toCoords(coords[i]);
		}
	}

	let xs = [];
	let ys = [];

	for (let i in coords) {
		xs.push(coords[i].x);
		ys.push(coords[i].y);
	}

	let finalX = 0;
	let finalY = 0;

	for (let i in xs) {
		finalX = finalX + parseFloat(xs[i]);
		finalY = finalY + parseFloat(ys[i]);
	}

	return new Point(finalX / xs.length, finalY / ys.length, null, gamemap.getMapConfig().coordType);
}

/** Function turns a date object into a relative string (4 days ago)
 * @param {Date} date - The date object to parse
 * @returns {String} timeAgo - How long ago it was
 */
window.getTimeAgo = function getTimeAgo(date) {
  const secondsAgo = Math.round((Date.now() - Number(date)) / 1000);

  if (secondsAgo < MINUTE) {
    return "Just now";
  }

  let divisor;
  let unit = "";

  if (secondsAgo < HOUR) {
    [divisor, unit] = [MINUTE, "minute"];
  } else if (secondsAgo < DAY) {
    [divisor, unit] = [HOUR, "hour"];
  } else if (secondsAgo < WEEK) {
    [divisor, unit] = [DAY, "day"];
  } else if (secondsAgo < MONTH) {
    [divisor, unit] = [WEEK, "week"];
  } else if (secondsAgo < YEAR) {
    [divisor, unit] = [MONTH, "month"];
  } else {
    [divisor, unit] = [YEAR, "year"];
  }

  const count = Math.floor(secondsAgo / divisor);
  return `${count} ${unit}${count > 1 ? "s" : ""} ago`;
}

/** Get client locale function
 * @returns {String} localeString - the user's locale string
 */
window.getClientLocale = function getClientLocale() {
	if (typeof Intl !== 'undefined') {
	  try {
		return Intl.NumberFormat().resolvedOptions().locale;
	  } catch (err) {
		console.error("Cannot get locale from Intl")
	  }
	}
}

/** Convert UTC date to local date
 * @returns {Date} date - a localised date object
 */
window.UTCtoLocalDate = function UTCtoLocalDate(date) {
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}