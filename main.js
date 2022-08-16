/*
 * main.js -- Created by Thal-J (thal-j@uesp.net) on 16th Aug 2022
 * 		Released under the GPL v2
 * 		Contains main code for the Gamemap system.
 */

window.onload = function() {

    // bind views from DOM
    var searchbox = document.getElementById("searchbox");
    var btn_clear_search = document.getElementById("btn_clear_search");

    // setup event listeners
    btn_clear_search.addEventListener("click", clearSearch);
    searchbox.addEventListener("input", function(){ updateSearch(searchbox.value); });

    // TODO: add event listeners to up/down and enter here as well, to control the search list selection

    // hijack ctrl + F to redirect to custom search
    $(window).keydown(function(event){
        if ((event.ctrlKey || event.metaKey) && event.keyCode === 70) {
            event.preventDefault();
            focusSearch();
        }
    });
    
}

/*======================================
                Search
======================================*/

function focusSearch() {
    searchbox.focus();
}

function clearSearch() {
    searchbox.value = "";
    console.log("cleared search.");
    btn_clear_search.style.visibility = 'hidden';
}

function updateSearch(query) {
    console.log("search query: " + query);

    // control clear search button visibility
    if (query.length > 0) {
        btn_clear_search.style.visibility = 'visible';
    } else {
        btn_clear_search.style.visibility = 'hidden';
    }
}
  
