/*
 * main.js -- Created by Thal-J (thal-j@uesp.net) on 16th Aug 2022
 * 	Released under the GPL v2
 * 	Contains main UI code for the Gamemap system.
 */

/*================================================
				  	Imports
================================================*/

import * as Utils from "./common/utils.js";
import Gamemap from "./map/gamemap.js";

/*================================================
				  Initialisation
================================================*/

var mapParams = null;
var mapConfig = null;
var mapType = null;

var g_GameMap = null;
var g_MapState = null;

var noAnalytics = true;

var uesp = uesp || {};
uesp.gamemap = uesp.gamemap || {};

// searchParams.has("name") === true; // true
// searchParams.get("age") === "1337"; // true
//gamemap.php?action=search&search=morrowind&world=2282&db=eso
//todo: change tab title to (mapname : location (UESP))

// on page load
print("Page initialising...");
$(document).ready(function() {

	// load gamemap
	print("Initialising gamemap...");
	initGamemap();

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

});

/*================================================
					  Gamemap
================================================*/

function initGamemap() {

	// get params from URL
	mapParams = Utils.getURLParams();

	// get which map we are supposed to be loading
	if (!mapParams.has("map")) { 
		showError("No map was provided.");
	} else {
		print("URL has map param!");
		mapType = mapParams.get("map");

		// load map config 
		let configURL = "configs/" + mapType + "/config.json";
		print("Getting map config at "+configURL+"...");

		Utils.getJSON(configURL, function(error, object) {
			if (error !== null) {
				showError("Could not get map config: " + error +". Please check the URL.");
			} else {
				print("Imported map config successfully!");
				print(object);
				mapConfig = object;

				// load map
				loadGamemap(mapConfig);
			}
		})
	}
}

function loadGamemap(mapConfig) {

	var mapCallbacks = {
		onMapWorldsLoaded   : onWorldLoad,
		onPermissionsLoaded : onPermLoad,
		onMapWorldChanged   : onWorldChanged
	};

	var gamemap = new Gamemap('gmMap', mapConfig, mapCallbacks);


	// // TODO: Change how map list is created
	// gamemap.createMapList($("#gmMapListRoot"));

	// // TODO: Temporary call to get the group-world list for ESO
	// $.get( 'templates/worldgrouplist.txt', function( data ) {
	// 	gamemap.worldGroupListContents = data;
	// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, 'Received world group list contents!');
	// 	$('#gmMapList').html(data);
	// 	gamemap.setEventsForMapGroupList();
	// });
}

function onWorldLoad() {
	if (this.hasCenterOnParam()) return;

	defaultMapState = new uesp.gamemap.MapState();

	defaultMapState.worldId = 668;
	defaultMapState.zoomLevel = 9;
	defaultMapState.gamePos.x = 500000;
	defaultMapState.gamePos.y = 500000;

	g_MapState = this.getMapStateFromQuery(defaultMapState);
	this.setMapState(g_MapState);
}

function onPermLoad() {
	canEdit = this.canEdit() && !isMobileDevice();

	if (canEdit) {
		$("#gmMapEditButtons").show();
		$("#addLocationButton").show();
		$("#addPathButton").show();
		$("#addAreaButton").show();
		$("#editWorldButton").show();
		$("#showRecentChangeButton").show();
	}
	else {
		$("#addLocationButton").hide();
		$("#addPathButton").hide();
		$("#addAreaButton").hide();
		$("#editWorldButton").hide();
		$("#showRecentChangeButton").hide();
	}

}

// TODO: Move into Map class
function onWorldChanged(newWorld) {
	foundListItems = $('#gmMapList li:contains("' + newWorld.displayName +'")').not('.gmMapListHeader');

	var foundListItem = null;
	var minTextLength = 1000;

	foundListItems.each(function( index ) {
		textLen = $(this).text().length;

		if (textLen < minTextLength) {
			minTextLength = textLen;
			foundListItem = $(this);
		}
	});

	if (foundListItem != null) {
		if (g_GameMap.mapListLastSelectedItem != null) g_GameMap.mapListLastSelectedItem.removeClass('gmMapListSelect');
		foundListItem.addClass('gmMapListSelect');
		g_GameMap.mapListLastSelectedItem = foundListItem;
		$(foundListItem).parents('ul:first').show();
	}

	$('#gmMapListAlphaSelect').val(newWorld.id);
	$('#current_location_label').text(newWorld.displayName);
}

function getDefaultMapTile(xPos, yPos, zoom, worldName) {
	return "//maps.uesp.net/esomap/" + worldName + "/zoom" + zoom + "/" + worldName + "-" + xPos + "-" + yPos + ".jpg";
}

/*================================================
					  Search
================================================*/

var searchText = '';
var searchResults = [ ];

function focusSearch() {
	searchbox.focus();
	M.toast({text: 'CTRL + F Pressed!'})
}

function clearSearch() {
	searchbox.value = "";
	print("cleared search.");
	btn_clear_search.style.visibility = 'hidden';
}

function updateSearch(query) {
	print("search query: " + query);

	// toggle clear button visibility
	if (query.length > 0) {
		btn_clear_search.style.visibility = 'visible';
	} else {
		btn_clear_search.style.visibility = 'hidden';
	}

	// submit search
	// do some search debouncing before submitting
}

function doSearch(searchQuery, currentMapOnly) {

	searchQuery = searchQuery.trim();

	// TODO: do some html sanitisation here

	if (searchQuery != null && searchQuery.length > 1) {

		// do search stuff

		//gamemap.php?action=search&search=morrowind&db=eso
		//gamemap.php?action=search&search=dagoth%2520ur&db=mw
		//gamemap.php?action=search&search=morrowind&world=2282&db=eso

		var queryParams = this.createSearchQuery(searchText, searchMapOnly);

		if (this.mapOptions.isOffline) {
			setTimeout( function() { ugmSearchOfflineLocations(self, queryParams); }, 10);
		}
		else {
			$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
				self.onReceiveSearchResults(data);
			});
		}

	}

}

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


function showError(reason){
	$("#error_box").show();
	$('#error_box').css('visibility','visible');
	$("#error_box_reason").text(reason);
	print("Error: " + reason);
}

/*================================================
				  	Analytics
================================================*/

if (!noAnalytics) {
	var _gaq = _gaq || [];
	_gaq.push(['_setAccount', 'UA-1386039-6']);
	_gaq.push(['_trackPageview']);

	(function() {
		var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	})();
}