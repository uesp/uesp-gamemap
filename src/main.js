/**
 * @name main.js
 * @author Thal-J <thal-j@uesp.net> (16th Aug 2022)
 * @summary Contains the UI code for the gamemap.
 * 	
 * @see gamemap.js for actual map viewer implementation. 
 */

import * as Utils from "./common/utils.js";
import * as Constants from "./common/constants.js";
import Gamemap from "./map/gamemap.js";

/*================================================
				  Initialisation
================================================*/

var mapConfig = null;
var gamemap = null;
var currentTabID = "";
var pairings = [];

// on page load
print("Page initialising...");
$(document).ready(function() {

	// load gamemap
	print("Initialising gamemap...");
	loading("map");

	// get gamename from pathname URL
	let gameParam = window.location.pathname.replace(/\\|\//g,'')
	print(gameParam);

	if (gameParam != null && gameParam != "" && gameParam.match(/^([a-z]+)/)) {
		print("URL has game param!");

		// get map configs
		Utils.getJSON(Constants.DEFAULT_MAP_CONFIG_DIR, function(error, defaultMapConfig) {
			if (error == null) {
				window.DEFAULT_MAP_CONFIG = defaultMapConfig;

				let configURL = (Constants.CONFIG_DIR + gameParam + "/" + Constants.MAP_CONFIG_FILENAME);
				print("Getting map config at "+configURL+"...");
		
				if (Utils.doesFileExist(configURL)) {
					Utils.getJSON(configURL, function(error, object) {
						if (error !== null) {
							showError("Could not load map: " + error);
						} else {
							print("Imported map config successfully!");
							mapConfig = object;
			
							print("Merging with default map config...")
							let mergedMapConfig = Utils.mergeObjects(DEFAULT_MAP_CONFIG, mapConfig);
			
							print(mergedMapConfig);
			
							mapConfig = mergedMapConfig;
			
							// load map
							loadGamemap(mergedMapConfig);
						}
					})
				} else { showError("Provided game doesn't exist. Please check the URL.");}
			} else { showError("There was an error getting the default map config." + error);}})
	} else { showError("No valid game provided."); }

	// bind views from DOM
	var searchbox = document.getElementById("searchbox");
	var btn_clear_search = document.getElementById("btn_clear_search");

	// add click listeners on tabs
	$('#abc_tab').on('click', function(event) { onTabClicked(event.target); });
	$('#group_tab').on('click', function(event) { onTabClicked(event.target); });

	// setup event listeners
	btn_clear_search.addEventListener("click", clearSearch);
	searchbox.addEventListener("input", function(){ updateSearch(searchbox.value); });

	M.AutoInit();

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

function loadGamemap(mapConfig) {

	// set up callbacks
	var mapCallbacks = {
		onWorldsLoaded,
		onPermissionsLoaded,
		onWorldChanged,
		hideMenus,
		onMapLoaded,
	};

	gamemap = new Gamemap('gamemap', mapConfig, mapCallbacks);
}

// alt name: on gamemap loaded
function onWorldsLoaded(mapWorlds) {
	
	print("Worlds loaded!");
	print(mapWorlds);

	$("#loading_spinner").hide();
	$('#zoom_widget').css('visibility','visible');

	if (gamemap.hasMultipleWorlds) {

		// only show the location switcher if there are more than two worlds
		$("#btn_location_switcher").show();
		$("#btn_goto_article").show();

		// populate location switcher
		createWorldLists(mapWorlds);

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

function onWorldChanged(newWorld) {

	$('#current_location_label').text(newWorld.displayName);

	setWindowTitle(newWorld.displayName);

	// deselect previous location in loc switcher
	let selectedElements = document.getElementsByClassName("collection-item active");
	for (let i = 0; i < selectedElements.length; i++) {
		selectedElements[i].classList.toggle("active", false);
	}

	// select new location in loc switcher
	let elements = document.getElementsByName(newWorld.name); 
	for (let i = 0; i < elements.length; i++) {
		elements[i].classList.toggle("active", true);
	}

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

//gamemap.php?action=search&search=morrowind&world=2282&db=eso
function doSearch(searchQuery, currentMapOnly) {

	searchQuery = searchQuery.trim();

	// TODO: do some html sanitisation here

	if (searchQuery != null && searchQuery.length > 1) {

		// do search stuff

		//gamemap.php?action=search&search=morrowind&db=eso
		//gamemap.php?action=search&search=dagoth%2520ur&db=mw
		//gamemap.php?action=search&search=morrowind&world=2282&db=eso

		var queryParams = this.createSearchQuery(searchText, searchMapOnly);

		$.getJSON(this.mapOptions.gameDataScript, queryParams, function(data) {
			self.onReceiveSearchResults(data);
		});
		

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



// }

// uesp.gamemap.Map.prototype.createRecentChanges = function ()
// {
// 	if (this.recentChangesRoot != null) return;
// 	var self = this;

// 	this.recentChangesRoot = $('<div />')
// 								.addClass('gmMapRCRoot')
// 								.insertAfter(this.mapContainer);
// }

/*================================================
				Action Buttons
================================================*/

// copy link to clipboard button
window.copyMapLink = function(){
	print("copying link to clipboard...");
	navigator.clipboard.writeText(window.location)
	.then(() => {
		M.toast({text: "Map link copied to clipboard!"});
	})
	.catch(err => {
		print("Error copying link to clipboard.");
	});
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

window.resetMap = function() {
	gamemap.gotoWorld(mapConfig.defaultWorldID);
}

/*================================================
				  Zoom Buttons
================================================*/

// zoom in
window.zoomIn = function(){
	gamemap.zoomIn();

	$("#btn_zoom_out").prop("disabled",false);
	// check if we're zoomed in max, then disable button
	if (gamemap.getCurrentZoom() + mapConfig.zoomStep >= mapConfig.maxZoomLevel) {
		$("#btn_zoom_in").prop("disabled",true);
	}
}

// zoom out
window.zoomOut = function(){
	$("#btn_zoom_in").prop("disabled",false);
	gamemap.zoomOut();
	// check if we're zoomed out max, then disable button
	if (gamemap.getCurrentZoom() - mapConfig.zoomStep <= mapConfig.minZoomLevel) {
		$("#btn_zoom_out").prop("disabled",true);
	}
}

/*================================================
				Change tab title
================================================*/

function setWindowTitle(title) {

	// default dynamic map title
	document.title = ("UESP " + mapConfig.mapTitle);

	if (gamemap.hasMultipleWorlds()) { // show map world in title if there is one
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

if (!(Utils.getCookie("debugging") == "true")) {
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

/*================================================
				Location Switcher
================================================*/

const btnLocationSwitcher = document.querySelector("#btn_location_switcher");
const locationSwitcherRoot = document.querySelector("#location_switcher_root");

// disappear location switcher when clicking outside of it
document.addEventListener("click", function (event) {
	var root = document.getElementById('location_switcher_root');
	if (!root.contains(event.target) && !btnLocationSwitcher.contains(event.target) ) {
		toggleLocationSwitcher(false);
	}
}, true);

window.toggleLocationSwitcher = function(toggle){
	if (toggle || toggle == null){
		$("#location_switcher_root").show();
	} else { 
		$("#location_switcher_root").hide();
	}

	btnLocationSwitcher.classList.toggle("toggled", toggle);
	locationSwitcherRoot.classList.toggle("shown", toggle);

	reselectTabs();
}

function reselectTabs() {
	var tabs = M.Tabs.init(document.querySelector("#location_switcher_tab_bar"));
	tabs.select(currentTabID || 'tab_categories');
}

function hideMenus() {
	toggleLocationSwitcher(false);
	// one here for search and overflow as well;
}



function onTabClicked(element) {
	if (locationSwitcherRoot.classList.contains("shown")) {
		currentTabID = element.href.split("#")[1];

		if (currentTabID == "tab_alphabetical") {
			let worldName = gamemap.getWorldFromID(gamemap.getCurrentWorldID()).name;
		
			let element = document.getElementsByName(worldName)[0]; 
		
			setTimeout(function() {
				element.scrollIntoView({
					behavior: "auto",
					block: "center",
					inline: "center"
				});
			}, 10);
		}
	}
}


function createWorldLists(mapWorlds) {

	let abcWorldList = [];
	let groups = {};
	const GROUP_DEV_ID = -1337;
	const GROUP_UNSORTED_ID = -1;
	let rootID = mapConfig.rootWorldID || mapConfig.defaultWorldID;

	for (let key in mapWorlds) {
		if (mapWorlds[key].displayName[0] != '_' && key > 0) abcWorldList.push(mapWorlds[key].displayName);
	}

	abcWorldList = abcWorldList.sort(function(a, b) {
		// ignore "The" in alphabetical sort
		a = a.replace("The ", ""); 
		b = b.replace("The ", ""); 
		// make alphabetical sort case insensitive
		if (a.toLowerCase() < b.toLowerCase()) return -1;
		if (a.toLowerCase() > b.toLowerCase()) return 1;
		return 0;
	});
	
	print(abcWorldList);

	let abcHTML = "";

	for (let i = 0; i < abcWorldList.length; i++) {

		let world = gamemap.getWorldFromDisplayName(abcWorldList[i]);

		if (world != null) {
			abcHTML += createLocationRowHTML(world.id);
		}
	}

	$("#tab_alphabetical").html(abcHTML);

	

	for (let i = 0; i < abcWorldList.length; i++) {
		let displayName = abcWorldList[i];
		let world = gamemap.getWorldFromDisplayName(displayName);

		if (world != null && world.id != 0 && !displayName.endsWith("(Test)")) {
			let worldID = world.id;
			let parentID = world.parentID;
			
			if (parentID <= 0) {
				parentID = 0;

				if (worldID != rootID) {
					parentID = GROUP_UNSORTED_ID;
				}

			} 

			if (displayName.endsWith("(Dev)") || displayName.endsWith("(Beta)")) {
				parentID = GROUP_DEV_ID;
			}

			if (groups[parentID] != null) {
				groups[parentID].push(worldID);
			} else { 
				groups[parentID] = [worldID];
			}
		}
	}

	// parse location list
	parseGroupList(groups, groups, '');

	//remove duplicates from location list
	pairings = Utils.getUniqueListFrom(pairings, 'id');

	// map each location to a position in the array
	const pairMappings = pairings.reduce((obj, world, i) => {
		obj[world.id] = i;
		return obj;
	}, {});

	// create the hierarchy of locations
	pairings.forEach((world) => {
		// Handle the root element
		if (world.parentID === null) {
			groups = world;
			return;
		}
		// Use our mapping to locate the parent element in our data array
		const parentWorld = pairings[pairMappings[world.parentID]];
		// Add our current world to its parent's `children` array
		parentWorld.children = [...(parentWorld.children || []), world];
	});

	print(groups, true);

	// get HTML for group list pane
	$("#tab_categories").html(createGroupListHTML(groups));

	// init collapsers
	$('.collapsible').collapsible({
		accordion: true
	});
	

}

function createGroupListHTML(groups) {
	let output = "";
	let name;
	let displayName;
	let worldID;

	// if the passed grouplist is an array of objects
	// instead of just one object
	if (Array.isArray(groups)) {
		groups.forEach(world => {
			worldID = world.id;
			name = gamemap.getWorldNameFromID(worldID);
			displayName = gamemap.getWorldDisplayNameFromID(worldID);

			print(name);
			print(displayName);
			
			if (world["children"]) {
				output += "<ul class='collapsible'><li><div class='collapsible-header waves-effect'>" + displayName + "<i class='material-icons'>expand_more</i></div><div class='collapsible-body''>"
				output += createLocationRowHTML(worldID);
				output += createGroupListHTML(world["children"]);
				output += "</div></li></ul>";
			} else {
				output += createLocationRowHTML(worldID);
			}

		});
	} else {

		worldID = groups.id;
		name = gamemap.getWorldNameFromID(worldID);
		displayName = gamemap.getWorldDisplayNameFromID(worldID);
	
		print(name);
		print(displayName);
	
		if (groups["children"]) {
			output += "<ul class='collapsible'><li class='active'><div class='collapsible-header waves-effect'>" + displayName + "<i class='material-icons'>expand_more</i></div><div class='collapsible-body'>"
			output += createLocationRowHTML(worldID);
			output += createGroupListHTML(groups["children"]);
			output += "</div></li></ul>";
		} else {
			output += createLocationRowHTML(worldID);
		}
	}
	return output;
}


function createLocationRowHTML(worldID) {
	let world = gamemap.getWorldFromID(worldID);

	if (world != null) {
		return ("<div class='collection'><a name='" + world.name + "' onclick='gotoWorld("+worldID+")' class='collection-item waves-effect'> " + world.displayName + " </a></div>");
	}
}

function parseGroupList(root, obj, stack) {
	for (var property in obj) {
		if (obj.hasOwnProperty(property)) {
			if (typeof obj[property] == "object") {
				parseGroupList(root, obj[property], stack + '.' + property);
			} else {

				//console.log("i: " + property + "   " + obj[property]);
				if (root[obj[property]] != null) {
					parseGroupList(root, root[obj[property]], stack + '.' + obj[property]);
				} else {

					// reached the end of the location tree
					let path = stack + '.' + obj[property];
					let rootWorldID = mapConfig.rootWorldID || mapConfig.defaultWorldID;
					let pathArray = path.split('.');
					pathArray.shift();
				
					if (pathArray[0] == rootWorldID ){
						//print(path);
				
						for (let i = 0; i < pathArray.length; i++) {
							let obj;
							 
							if (i == 0) {
								obj = { id: pathArray[i], parentID: null }
							} else { 
								obj = { id: pathArray[i], parentID: pathArray[i-1] }
							}
				
							pairings.push(obj);
				
						}
					}
				}
			}
		}
	}
}



function onMapLoaded() {
	$("#map_loading_bar").hide();
}


window.gotoWorld = function(worldID, coords){
	$("#map_loading_bar").show();
	gamemap.gotoWorld(worldID, coords);
	toggleLocationSwitcher(false);
}
	
