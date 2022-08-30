
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
			URL param splitting function
================================================*/

export function getURLParams(url){
	let urlParams = url.replace("?", '');
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
				console.log("debug:");
				console.log(txt);
			}
		}
    };
})(window.console);