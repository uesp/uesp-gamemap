/**
 * @name utils.js
 * @author Thal-J <thal-j@uesp.net> (28th August 2022)
 * @summary Contains general utility functions for the gamemap.
 */

import * as Constants from "./constants.js";

/*================================================
			Is mobile device function
================================================*/

export function isMobileDevice() {
	return (navigator.userAgent.match(/Mobi/));
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

export function getURLParams(paramType){
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
			 	Get cookie function
================================================*/

export function getCookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i <ca.length; i++) {
	  let c = ca[i];
	  while (c.charAt(0) == ' ') {
		c = c.substring(1);
	  }
	  if (c.indexOf(name) == 0) {
		return c.substring(name.length, c.length);
	  }
	}
	return null;
}

/*================================================
				Debug log function
================================================*/

window.log = function(txt) {

	// only print if debugging is enabled
	var canLog = (getCookie("debugging") == "true")
	
	if (canLog) {
		// check if payload is string
		if (typeof txt === "string" || txt instanceof String) {
			console.log("%cdebug: " + txt, 'color: aqua; font-weight: bold;');
		} else {
			console.log(txt);
		}
	}

}

/*================================================
			  Is variable null function
================================================*/

export function isNull(variable) {
	return (typeof variable === 'undefined' || variable === null);
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
		      Sanitise HTML functions
================================================*/

const ESC_MAP = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

export function escapeHTML(unsafeStr, forAttribute) {
	if (unsafeStr == null) return "";
	if (unsafeStr.replace == null) return unsafeStr;
	return unsafeStr.replace(forAttribute ? /[&<>'"]/g : /[&<>]/g, function(c) {
	    return ESC_MAP[c];
	});
}

export function escapeAttribute(unsafeStr) {
	return escapeHTML(unsafeStr, true);
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
		  Check if page exists function
================================================*/

export function doesFileExist(url) {
    var http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}


/*================================================
		  	  Force click function
================================================*/

export function fireClick(node){
    if (document.createEvent) {
        var evt = document.createEvent('MouseEvents');
        evt.initEvent('click', true, false);
        node.dispatchEvent(evt);    
    } else if (document.createEventObject) {
        node.fireEvent('onclick') ; 
    } else if (typeof node.onclick == 'function') {
        node.onclick(); 
    }
}

/*================================================
	  Clean duplicate entries in array function
================================================*/

export function getUniqueListFrom(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()]
}

/*================================================
	  	  To normalised coords function
================================================*/

export function toNormalised(coord) {
    return (coord / Constants.LEGACY_MAXIMUM_XY).toFixed(3);
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
	  	    Change FavIcon function
================================================*/

export function changeFavIcon(favIconURL) {
	let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
	link.type = 'image/x-icon';
	link.rel = 'shortcut icon';
	link.href = favIconURL;
	document.getElementsByTagName('head')[0].appendChild(link);
}


