window.onload = function() {

    // bind views from DOM
    var searchbox = document.getElementById("searchbox");
    var btn_clear_search = document.getElementById("btn_clear_search");

    // setup event listeners
    btn_clear_search.addEventListener("click", clearSearch);
    searchbox.addEventListener("input", updateSearch(searchbox.value));

}

function clearSearch() {

    console.log("teafa");

    searchbox.value = "";


}

function updateSearch(query) {

    console.log(query);

}
  
