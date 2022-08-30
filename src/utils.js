
/*================================================
	Is mobile device function
================================================*/

export function isMobileDevice() {
	return (navigator.userAgent.match(/Mobi/));
}

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

export function getURLParams(url){
	let urlParams = url.replace("?", '');
	urlParams = urlParams.toLowerCase();
	return new URLSearchParams(urlParams); //create params array
}
