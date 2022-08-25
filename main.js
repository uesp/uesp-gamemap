/*
 * main.js -- Created by Thal-J (thal-j@uesp.net) on 16th Aug 2022
 * 	Released under the GPL v2
 * 	Contains main code for the Gamemap system.
 */

window.onload = function() {

	// bind views from DOM
	var searchbox = document.getElementById("searchbox");
	var btn_clear_search = document.getElementById("btn_clear_search");

	// setup event listeners
	btn_clear_search.addEventListener("click", clearSearch);
	searchbox.addEventListener("input", function(){ updateSearch(searchbox.value); });
	M.AutoInit();

	// TODO: add event listeners to up/down and enter here as well, to control the search list selection
	// BEHAVIOUR: "Enter" selects the first item in the list, arrow keys move the selection, mouse takes priority

	// hijack ctrl + F to redirect to custom search
	$(window).keydown(function(event){
		if ((event.ctrlKey || event.metaKey) && event.keyCode === 70) {
			event.preventDefault();
			focusSearch();
		}
	});

	document.addEventListener('DOMContentLoaded', function() {
		var elems = document.querySelectorAll('.tooltipped');
		var instances = M.Tooltip.init(elems, {
		  // specify options here
		});
	  });

}

/*================================================
					  Search
================================================*/

this.searchText = '';
this.searchResults = [ ];

function focusSearch() {
	searchbox.focus();
	M.toast({text: 'CTRL + F Pressed!'})
}

function clearSearch() {
	searchbox.value = "";
	console.log("cleared search.");
	btn_clear_search.style.visibility = 'hidden';
}

function updateSearch(query) {
	console.log("search query: " + query);

	// toggle clear button visibility
	if (query.length > 0) {
		btn_clear_search.style.visibility = 'visible';
	} else {
		btn_clear_search.style.visibility = 'hidden';
	}
}

// uesp.gamemap.Map.prototype.doSearch = function (searchText, searchMapOnly)
// {
// 	var self = this;

// 	searchText = searchText.trim();

// 	if (searchText == null || searchText == '')
// 	{
// 		this.clearSearchResults();
// 		return false;
// 	}

// 	uesp.logDebug(uesp.LOG_LEVEL_WARNING, 'Search for: ', searchText);
// 	this.searchText = searchText;

// 	var queryParams = this.createSearchQuery(searchText, searchMapOnly);

// 	if (this.mapOptions.isOffline)
// 	{
// 		setTimeout( function() { ugmSearchOfflineLocations(self, queryParams); }, 10);
// 	}
// 	else
// 	{
// 		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
// 			self.onReceiveSearchResults(data);
// 		});
// 	}

// 	return true;
// }


// uesp.gamemap.Map.prototype.onReceiveSearchResults = function (data)
// {
// 	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Received search data");
// 	uesp.logDebug(uesp.LOG_LEVEL_WARNING, data);

// 	if (data.isError === true)  return uesp.logError("Error retrieving location data!", data.errorMsg);

// 	this.searchResults = [ ];

// 	this.mergeLocationData(data.locations, false);

// 	for (key in data.worlds)
// 	{
// 		var world = data.worlds[key];
// 		if (world.id == null) continue;

// 		this.searchResults.push( { worldId : world.id });
// 	}

// 	for (key in data.locations)
// 	{
// 		var location = data.locations[key];
// 		if (location.id == null) continue;

// 		this.searchResults.push( { locationId : location.id });
// 	}

// 	this.showSearchResults();
// 	this.updateSearchResults();
// 	return true;
// }


// uesp.gamemap.Map.prototype.updateSearchResults = function ()
// {
// 	this.clearSearchResults();

// 	for (i in this.searchResults)
// 	{
// 		var searchResult = this.searchResults[i];

// 		this.addSearchResultLocation(searchResult.locationId);
// 		this.addSearchResultWorld(searchResult.worldId);
// 	}

// }


// uesp.gamemap.Map.prototype.createSearchQuery = function (searchText, searchMapOnly)
// {
// 	var queryParams = { };

// 	queryParams.action = 'search';
// 	queryParams.search = encodeURIComponent(searchText);
// 	if (this.isShowHidden()) queryParams.showhidden = 1;
// 	if (searchMapOnly === true) queryParams.world = this.currentWorldId;
// 	queryParams.db = this.mapOptions.dbPrefix;

// 	if (searchText.substring(0, 5) === "type:")
// 	{
// 		var locType = this.FindMapLocTypeString(searchText.substring(5));
// 		if (locType != null) queryParams.searchtype = locType;
// 	}

// 	return queryParams;
// }

// uesp.gamemap.Map.prototype.addSearchResultLocation = function (locationId)
// {
// 	var self = this;

// 	if (locationId == null) return;

// 	var location = this.locations[locationId];
// 	if (location == null) return uesp.logError('Failed to find location #' + locationId + ' data!');

// 	var world = this.mapWorlds[location.worldId];
// 	if (world == null) return uesp.logError('Failed to find world #' + location.worldId + ' data!');

// 	var locState = new uesp.gamemap.MapState;
// 	locState.zoomLevel = world.maxZoom;
// 	//if (locState.zoomLevel < this.zoomLevel) locState.zoomLevel = this.zoomLevel;
// 	locState.gamePos.x = location.x;
// 	locState.gamePos.y = location.y;
// 	locState.worldId = world.id;

// 	var searchResult = $('<div />')
// 							.addClass('gmMapSearchResultLocation')
// 							.bind("touchstart click", function (e) { self.onClickSearchResultId(locationId, locState); return false; })
// 							.appendTo(this.mapSearchResults);

// 	var iconURL   = this.mapOptions.iconPath + location.iconType + ".png";
// 	var imageContent = "<img class='gmMapSearchResultIcon' src='" + iconURL + "' />";

// 	if (location.iconType == 0) imageContent = "<div class='gmMapSearchResultIcon' />";

// 	var resultContent = imageContent +
// 						"<div class='gmMapSearchResultTitle'>{location.name}</div> " +
// 						"<div class='gmMapSearchResultLocWorld'>(in {world.displayName})</div>";
// 	var data = { world: world, location: location };
// 	var resultHtml = uesp.template(resultContent, data);

// 	searchResult.html(resultHtml);
// }


// uesp.gamemap.Map.prototype.onClickSearchResult = function(location, locState)
// {
// 	this.setMapState(locState, true);
// 	location.showPopup();
// }


// uesp.gamemap.Map.prototype.onClickSearchResultId = function(locationId, locState)
// {
// 	this.setMapState(locState, true);

// 	var location = this.locations[locationId];

// 	if (location != null)
// 	{
// 		location.showPopup();
// 		return;
// 	}

// 	this.showPopupOnLoadLocationId = locationId;
// 	//setTimeout(function() { location.showPopup(); }, 500);
// 	//location.showPopup();
// 	//this.setMapState(locState, true);
// }



// uesp.gamemap.Map.prototype.addSearchResultWorld = function (worldId)
// {
// 	var self = this;

// 	if (worldId == null) return;

// 	var world = this.mapWorlds[worldId];
// 	if (world == null) return uesp.logError('Failed to find world #' + worldId + ' data!');

// 	var worldState = new uesp.gamemap.MapState;
// 	worldState.zoomLevel = this.zoomLevel;
// 	worldState.gamePos.x = (world.posLeft - world.posRight)/2 + world.posRight;
// 	worldState.gamePos.y = (world.posTop - world.posBottom)/2 + world.posBottom;
// 	worldState.worldId = world.id;

// 	var searchResult = $('<div />')
// 							.addClass('gmMapSearchResultWorld')
// 							.bind("touchstart click", function (e) { self.setMapState(worldState, true); return false; })
// 							.appendTo(this.mapSearchResults);

// 	var resultContent = "<div class='gmMapSearchResultTitle'>{displayName}</div>";
// 	var resultHtml = uesp.template(resultContent, world);

// 	searchResult.html(resultHtml);
// }
