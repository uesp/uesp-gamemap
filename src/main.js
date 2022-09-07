/**
 * @name main.js
 * @author Thal-J <thal-j@uesp.net> (16th Aug 2022)
 * @summary Contains the main UI code for the gamemap.
 * 	
 * @see gamemap.js for actual map viewer implementation. 
 */

import * as Utils from "./common/utils.js";
import * as Constants from "./common/constants.js";
import Gamemap from "./map/gamemap.js";
import MapState from "./map/mapState.js";

/*================================================
				  Initialisation
================================================*/

var mapParams = null;
var mapConfig = null;
var mapType = null;

var gamemap = null;

var hasMultipleWorlds = false;

var noAnalytics = true;

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

	// listen for long-press events


	

	// $("#btn_zoom_out").addEventListener('long-press', function(e) {
	// 	e.target.setAttribute('data-editing', 'true');
  	// });

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

	loading("config");

	// get params from URL
	mapParams = Utils.getURLParams();

	// get which map we are supposed to be loading
	if (!mapParams.has("map")) { 
		showError("No map was provided.");
	} else {
		print("URL has map param!");
		mapType = mapParams.get("map");

		// load map config 
		let configURL = (Constants.CONFIG_DIR + mapType + "/" + Constants.MAP_CONFIG_FILENAME);
		print("Getting map config at "+configURL+"...");

		Utils.getJSON(configURL, function(error, object) {
			if (error !== null) {
				showError("Could not load map: " + error);
			} else {
				print("Imported map config successfully!");
				mapConfig = object;

				print("Merging with default map config...")
				let mergedMapConfig = Utils.mergeObjects(DEFAULT_MAP_CONFIG, mapConfig);

				print(mergedMapConfig);

				// load map
				loadGamemap(mergedMapConfig);
			}
		})
	}
}

function loadGamemap(mapConfig) {

	// set up infobar
	loadInfobar(mapConfig);

	// set up callbacks

	var mapCallbacks = {
		onWorldsLoaded,
		onPermissionsLoaded,
		onWorldChanged,
	};

	gamemap = new Gamemap('gamemap', mapConfig, mapCallbacks);
}

// alt name: on gamemap loaded
function onWorldsLoaded(mapWorlds) {
	
	print("Worlds loaded!");
	print(mapWorlds);

	if (Object.keys(mapWorlds).length > 2) {
		hasMultipleWorlds = true;
	}

	$("#loading_spinner").hide();
	$('#zoom_widget').css('visibility','visible');

	if (hasMultipleWorlds) {
		// only show the location switcher if there are more than two worlds
		$("#btn_location_switcher").show();
		$("#btn_goto_article").show();
		// populate location switcher

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

	if (!gamemap.hasCentreOnParam()) {
		//jump to default map
		let defaultMapState = new MapState();

		defaultMapState.worldID = gamemap.mapConfig.homeWorldID;
		defaultMapState.zoomLevel = gamemap.mapConfig.zoomLevel;
		defaultMapState.gamePos.x = gamemap.mapConfig.xPos;
		defaultMapState.gamePos.y = gamemap.mapConfig.yPos;

		let mapState = gamemap.getMapStateFromQuery(defaultMapState);
		gamemap.setMapState(mapState);
	} 

}

function onPermissionsLoaded(enableEditing) {
	print("Editing permissions loaded, editing enabled is: " + enableEditing);

	// canEdit = this.canEdit() && !isMobileDevice();

	// if (canEdit) {
	// 	$("#gmMapEditButtons").show();
	// 	$("#addLocationButton").show();
	// 	$("#addPathButton").show();
	// 	$("#addAreaButton").show();
	// 	$("#editWorldButton").show();
	// 	$("#showRecentChangeButton").show();
	// }
	// else {
	// 	$("#addLocationButton").hide();
	// 	$("#addPathButton").hide();
	// 	$("#addAreaButton").hide();
	// 	$("#editWorldButton").hide();
	// 	$("#showRecentChangeButton").hide();
	// }
}

function loadInfobar(mapConfig){
	$(".infobar").show();
	$("#mapNameLink").text(mapConfig.mapTitle);
	$("#mapFeedbackLink").attr("href", mapConfig.feedbackURL);
}


function onWorldChanged(newWorld) {
	// foundListItems = $('#gmMapList li:contains("' + newWorld.displayName +'")').not('.gmMapListHeader');

	// var foundListItem = null;
	// var minTextLength = 1000;

	// foundListItems.each(function( index ) {
	// 	textLen = $(this).text().length;

	// 	if (textLen < minTextLength) {
	// 		minTextLength = textLen;
	// 		foundListItem = $(this);
	// 	}
	// });

	// if (foundListItem != null) {
	// 	if (g_GameMap.mapListLastSelectedItem != null) g_GameMap.mapListLastSelectedItem.removeClass('gmMapListSelect');
	// 	foundListItem.addClass('gmMapListSelect');
	// 	g_GameMap.mapListLastSelectedItem = foundListItem;
	// 	$(foundListItem).parents('ul:first').show();
	// }

	// $('#gmMapListAlphaSelect').val(newWorld.id);
	$('#current_location_label').text(newWorld.displayName);

	setWindowTitle(newWorld.displayName);
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

// uesp.gamemap.Map.prototype.createMapControls = function ()
// {
// 	if (this.mapControlRoot != null) return;
// 	var self = this;

// 	this.mapControlRoot = $('<div />')
// 								.addClass('gmMapControlRoot')
// 								.appendTo(this.mapContainer);

// 	if (this.mapOptions.displayStates.length > 0) {
// 		this.mapControlDisplayStateRoot = $('<div />')
// 												.addClass('gmMapControlDisplayStates')
// 												.appendTo(this.mapControlRoot);

// 		for (var i in this.mapOptions.displayStates) {
// 			let displayState = this.mapOptions.displayStates[i];

// 			$('<div />')
// 				.html(displayState)
// 				.attr("id", "gmMapControlDisplayState_" + displayState)
// 				.addClass('gmMapControlDisplayState')
// 				.bind("touchstart click", function(e) { self.onDisplayStateChange(displayState); return false; })
// 				.appendTo(this.mapControlDisplayStateRoot);
// 		}
// 	}

// this.mapControlZoomIn = $('<div />')
// 	.html('+')
// 	.addClass('gmMapControlZoom')
// 	.addClass('gmMapControlZoomHover')
// 	.bind("touchstart click", function(e) { self.zoomIn(); return false; })
// 	.appendTo(this.mapControlRoot);

// this.mapControlZoomOut = $('<div />')
// 	.text('-')
// 	.addClass('gmMapControlZoom')
// 	.addClass('gmMapControlZoomHover')
// 	.bind("touchstart click", function(e) { self.zoomOut(); return false; })
// 	.appendTo(this.mapControlRoot);

// }

// uesp.gamemap.Map.prototype.createRecentChanges = function ()
// {
// 	if (this.recentChangesRoot != null) return;
// 	var self = this;

// 	this.recentChangesRoot = $('<div />')
// 								.addClass('gmMapRCRoot')
// 								.insertAfter(this.mapContainer);
// }


// uesp.gamemap.Map.prototype.createMapList = function (parentObject)
// {
// 	var self = this;
// 	var listHtml = 	"<div id='gmMapListTitle'>" +
// 						"Map List" +
// 						"<div id='gmMapListButtonAlpha'>Alpha</div>" +
// 						"<div id='gmMapListButtonGroup' class='gmMapListButtonSelect'>Group</div>" +
// 					"</div>" +
// 					"<div id='gmMapListAlpha' style='display: none;'>" +
// 						"<form><select id='gmMapListAlphaSelect' size='4'></select></form>" +
// 					"</div>" +
// 					"<div id='gmMapListGroup'>" +
// 					"<ul id='gmMapList'>" +
// 						"<li>Loading world data...</li>" +
// 					"</ul></div>";

// 	this.mapListContainer = $('<div />')
// 								.attr('id', 'gmMapListContainer')
// 								.appendTo(parentObject);

// 	this.mapListContainer.html(listHtml);

// 	$('#gmMapListButtonAlpha').bind("touchstart click", function(e) {
// 		$('#gmMapListButtonAlpha').addClass('gmMapListButtonSelect');
// 		$('#gmMapListButtonGroup').removeClass('gmMapListButtonSelect');
// 		$('#gmMapListAlpha').show();
// 		$('#gmMapListGroup').hide();
// 		$('#gmMapListAlphaSelect').focus();
// 		return false;
// 	});

// 	$('#gmMapListButtonGroup').bind("touchstart click", function(e) {
// 		$('#gmMapListButtonGroup').addClass('gmMapListButtonSelect');
// 		$('#gmMapListButtonAlpha').removeClass('gmMapListButtonSelect');
// 		$('#gmMapListGroup').show();
// 		$('#gmMapListAlpha').hide();
// 		$('#gmMapListGroup').focus();

// 		selItem = $('#gmMapList li.gmMapListSelect');
// 		if (selItem == null) return false;

// 		container = $('#gmMapListGroup');
// 		container.scrollTop(selItem.offset().top - container.offset().top + container.scrollTop() - 200);
// 		return false;
// 	});

// 	$('#gmMapListAlphaSelect').change(function(e) {
// 		var result = parseInt(this.options[this.selectedIndex].value);
// 		self.changeWorld(result);

// 		self.hideMapList();
// 	});

// 	return true;
// }



// uesp.gamemap.Map.prototype.updateCellGridLabel = function()
// {
// 		// TODO: No hard coded ID?
// 	if (this.isDrawGrid)
// 	{
// 		$("#gmMapCellGrid").text("Hide Cell Grid");
// 	}
// 	else
// 	{
// 		$("#gmMapCellGrid").text("Show Cell Grid");
// 	}
// }

// uesp.gamemap.Map.prototype.updateCellResourceLabel = function()
// {
// 		// TODO: No hard coded ID?
// 	$("#gmCellResourceList").val(this.cellResource);

// 	this.showCellResourceGuide(this.cellResource != "")
// }


// uesp.gamemap.Map.prototype.showCellResourceGuide = function(display)
// {
// 		// TODO: No hard coded ID?
// 	$("#gmCellResourceGuide").toggle(display);
// }



/*================================================
				Action Buttons
================================================*/

// copy link to clipboard button
window.copyMapLink = function(){
	if (gamemap != null) {
		print("copying link to clipboard...");
		let link = gamemap.createMapLink();
		if (link != null && link != "") {

			navigator.clipboard.writeText(link)
			.then(() => {
				// todo: also change the url to reflect the data
				M.toast({text: "Map link copied to clipboard!"});
			})
			.catch(err => {
				print("Error copying link to clipboard.");
			});
		}
	}
}

// goto article button
window.gotoArticle = function(){
	if (gamemap != null) {
		print("getting article link...");

		let link = gamemap.getArticleLink();

		if (link != null && link != "") {
			window.open(link);
		}

	}
}

// zoom widget
window.zoomIn = function(){
	gamemap.zoomIn();
	// check if we're zoomed in max, then disable button
}

window.zoomOut = function(){
	gamemap.zoomOut();
	// check if we're zoomed out max, then disable button
}

/*================================================
				Change tab title
================================================*/

function setWindowTitle(title) {

	// default dynamic map title
	document.title = ("UESP " + mapConfig.mapTitle);

	if (hasMultipleWorlds) { // show map world in title if there is one
		document.title = document.title + " | " + title;
	} 
}

/*================================================
				   Error box
================================================*/

function showError(reason){
	$("#error_box").show();
	$('#error_box').css('visibility','visible');
	$("#error_box_reason").text(reason);
	print("Error: " + reason);
	$("#loading_spinner").hide();
}

/*================================================
				   Loading box
================================================*/

window.loading = function(reason){
	$("#loading_reason").text("Loading "+reason+"...");
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

/*================================================
				   Debug mode
================================================*/

window.enableDebugging = function(){
	document.cookie = "debugging=true"; 
	console.log("Debug mode enabled!");
}



// uesp.gamemap.Map.prototype.translateGroupListToName = function(groups, depth)
// {
// 	var groupNames = {};
	
// 	if (depth == null) depth = 0;
// 	if (depth >= this.MAX_GROUP_DEPTH) groupNames = [];
	
// 	for (var worldId in groups)
// 	{
// 		var subGroups = groups[worldId];
		
// 		var world = this.mapWorlds[worldId];
// 		var worldName = "";
		
// 		if (world == null) 
// 		{
// 			if (worldId == this.GROUP_DEV_ID)
// 				worldName = "Dev";
// 			else if (worldId == this.GROUP_BETA_ID)
// 				worldName = "Beta";
// 		}
// 		else
// 		{
// 			worldName = world['displayName']
// 		}
		
// 		if (worldName == "") continue;
		
// 		if (Array.isArray(groupNames))
// 		{
// 			groupNames.push(worldName);
// 		}
// 		else
// 		{
// 			if (subGroups === true)
// 				groupNames[worldName] = true;
// 			else
// 				groupNames[worldName] = this.translateGroupListToName(subGroups, depth+1);
// 		}
// 	}
	
// 	return groupNames;
// }


// uesp.gamemap.Map.prototype.createGroupSubList = function(parentGroups, groups, worldId, depth)
// {
// 	if (this.groupCreateList[worldId] != null) return;
// 	this.groupCreateList[worldId] = true;
	
// 	if (depth == null) depth = 0;
	
// 	parentGroups[worldId] = true;
	
// 	if (groups[worldId] == null)
// 	{
// 		this.groupCreateList[worldId] = false;
// 		return;
// 	}
	
// 	if (depth < this.MAX_GROUP_DEPTH) parentGroups[worldId] = {};
	
// 	for (var i in groups[worldId])
// 	{
// 		var childWorldId = groups[worldId][i];
		
// 		if (depth >= this.MAX_GROUP_DEPTH || this.topLevelWorldIds[childWorldId] === true || groups[worldId].length < this.MIN_GROUP_SIZE)
// 			this.createGroupSubList(parentGroups, groups, childWorldId, depth+1);
// 		else
// 			this.createGroupSubList(parentGroups[worldId], groups, childWorldId, depth+1);
// 	}
	
// 	this.groupCreateList[worldId] = false;
// }


// uesp.gamemap.Map.prototype.createGroupList = function()
// {
// 	var groups = {};
// 	var allGroups = {};
	
// 	this.GROUP_DEV_ID = -101;
// 	this.GROUP_BETA_ID = -102;
	
// 	for (var worldId in this.mapWorlds)
// 	{
// 		if (worldId == 0) continue;
		
// 		var world = this.mapWorlds[worldId];
// 		var parentId = world.parentId;
// 		var worldDisplayName = world['displayName'];
// 		var worldName = world['name'];
		
// 		if (parentId < 0) parentId = 0;
		
// 			// TODO: Other/better ways to do fixed groups? 
// 		if (worldDisplayName.endsWith("(Dev)"))
// 			parentId = this.GROUP_DEV_ID;
// 		else if (worldDisplayName.endsWith("(Beta)"))
// 			parentId = this.GROUP_BETA_ID;
// 		else if (worldDisplayName.endsWith("(Test)"))
// 			continue;
		
// 		if (groups[parentId] == null) groups[parentId] = [];
// 		groups[parentId].push(worldId);
// 	}
	
// 	this.groupCreateList = {};
// 	this.MAX_GROUP_DEPTH = 3;
// 	this.MIN_GROUP_SIZE = 5;
	
// 	var topLevelWorldID = 667;		// TODO: Not hardcoded for ESO?
	
// 	this.topLevelWorldIds = {		// TODO: Not hardcoded for ESO?
// 			203 : true,
// 			668 : true,
// 			1402 : true,
// 			1466 : true,
// 			2170 : true,
// 			2179 : true,
// 			2282 : true,
// 	};
	
// 	this.topLevelWorldIds[this.GROUP_DEV_ID] = true;
// 	this.topLevelWorldIds[this.GROUP_BETA_ID] = true;
	
// 	this.createGroupSubList(allGroups, groups, topLevelWorldID);
// 	this.createGroupSubList(allGroups, groups, this.GROUP_DEV_ID);
// 	this.createGroupSubList(allGroups, groups, this.GROUP_BETA_ID);
	
// 	return this.translateGroupListToName(allGroups);
// }


// uesp.gamemap.Map.prototype.createGroupListHtml = function(groups, parentWorldName)
// {
// 	var output = "";
	
// 	if (groups == null) groups = this.createGroupList();
	
// 	var keys = Object.keys(groups);
// 	if (parentWorldName != null && parentWorldName != "Beta" && parentWorldName != "Dev") keys.push(parentWorldName);
// 	keys.sort();
	
// 	for (var i in keys)
// 	{
// 		var worldName = keys[i];
// 		var subGroups = groups[worldName];
		
// 		if (subGroups == null || subGroups === true || Object.keys(subGroups).length === 0)
// 		{
// 			output += "<li>" + worldName + "</li>\n";
// 		}
// 		else
// 		{
// 			output += "<li class=\"gmMapListHeader\">" + worldName + "</li>\n<ul>\n";
// 			output += this.createGroupListHtml(subGroups, worldName);
// 			output += "</ul>\n";
// 		}
// 	}
	
// 	return output;
// }


