
/*================================================
			Is mobile device function
================================================*/

export function isMobileDevice() {
	return (navigator.userAgent.match(/Mobi/));
}

/*================================================
			JSON object parsing function
================================================*/

export var getJSON = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status === 200) {
        callback(null, xhr.response);
      } else {
        callback(status, xhr.response);
      }
    };
    xhr.send();
};

/*================================================
			 Get URL parameters function
================================================*/

export function getURLParams(){
	let urlParams = window.location.search.replace("?", '');
	urlParams = urlParams.toLowerCase();
	return new URLSearchParams(urlParams); //create params array
}

/*================================================
			Debug print function
================================================*/

window.print = (function(console) {
    var canLog = !!console; // only print when devtools is open
    return function(txt) {

		if (canLog) {
			// check if payload is string
			if (typeof txt === "string" || txt instanceof String) {
				console.log("debug: " + txt);
			} else {
				console.log(txt);
			}
		}
    };
})(window.console);

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