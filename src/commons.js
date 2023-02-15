/**
 * @name commons.js
 * @author Thal-J <thal-j@uesp.net> (28th August 2022)
 * @summary Contains common functions and constants for the gamemap.
 */

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
    NONE : 0,
    POINT : 1,
    PATH : 2,
    AREA : 3,
    LABEL : 4,
}

window.PLACETYPES = {
    WORLD : 0,
    LOCATION : 1,
}

window.LABEL_POSITIONS = {
    0 : 'None',
    1 : 'Top Left',
    2 : 'Top Center',
    3 : 'Top Right',
    4 : 'Middle Left',
    5 : 'Center',
    6 : 'Middle Right',
    7 : 'Bottom Left',
    8 : 'Bottom Center',
    9 : 'Bottom Right'
};

window.COORD_TYPES = {
    XY : 0,
    NORMALISED : 1,
    WORLDSPACE : 2,
}

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
	setCookie(key, value);
}

/** Function that gets browser shared preference value from a key
 * @param {String} key - The shared preference key to search for
 * @returns {Object} value - whatever the shared preference was set to, or false if none was found
 */
window.getPrefs = function getPrefs(key) {
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