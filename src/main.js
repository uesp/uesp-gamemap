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
var searchMenuOpen = false;

// on page load
log("Page initialising...");
$(document).ready(function() {

	// load gamemap
	log("Initialising gamemap...");
	loading("map");

	// get gamename from pathname URL
	let gameParam = window.location.pathname.replace(/\\|\//g,'')
	log("game: " +gameParam);

	if (gameParam != null && gameParam != "" && gameParam.match(/^([a-z]+)/)) {
		log("URL has game param!");

		// get map configs
		Utils.getJSON(Constants.DEFAULT_MAP_CONFIG_DIR, function(error, defaultMapConfig) {
			if (error == null) {
				window.DEFAULT_MAP_CONFIG = defaultMapConfig;

				let configURL = (Constants.CONFIG_DIR + gameParam + "/" + Constants.MAP_CONFIG_FILENAME);
				log("Getting map config at "+configURL+"...");

				if (Utils.doesFileExist(configURL)) {
					Utils.getJSON(configURL, function(error, object) {
						if (error !== null) {
							showError("Could not load map: " + error);
						} else {
							log("Imported map config successfully!");
							mapConfig = object;

							log("Merging with default map config...")
							let mergedMapConfig = Utils.mergeObjects(DEFAULT_MAP_CONFIG, mapConfig);

							log(mergedMapConfig);

							mapConfig = mergedMapConfig;

							// TODO: check if current directory has a css file, if so make customcss= true in the map config

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
	searchbox.addEventListener("input", function(){updateSearch(searchbox.value, document.querySelector('#search_current_map_checkbox').checked); });

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

function onWorldsLoaded(mapWorlds) {

	log("Worlds loaded!");
	log(mapWorlds);

	$("#loading_spinner").hide();
	$('#zoom_widget').css('visibility','visible');

	if (gamemap.hasMultipleWorlds) {

		// only show the location switcher if there are more than two worlds
		$("#btn_location_switcher").show();
		$("#btn_goto_article").show();

		// populate location switcher
		createWorldLists(mapWorlds);

	}

	$("#error_box").hide();
}

function onMapLoaded() {
	$("#map_loading_bar").hide();
}

function onPermissionsLoaded(enableEditing) {
	log("Editing permissions loaded, editing enabled is: " + enableEditing);

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


window.gotoWorld = function(worldID, coords) {
	hideMenus();
	clearSearch();
	gamemap.gotoWorld(worldID, coords);
}


function onWorldChanged(newWorld) {
	$('#current_location_label').text(newWorld.displayName);
	setWindowTitle(newWorld.displayName);
	updateWorldList(newWorld.name);
	clearSearch();
}

/*================================================
				Action Buttons
================================================*/

// copy link to clipboard button
window.copyMapLink = function(){
	log("copying link to clipboard...");
	navigator.clipboard.writeText(window.location)
	.then(() => {
		M.toast({text: "Map link copied to clipboard!"});
	})
	.catch(err => {
		log("Error copying link to clipboard.");
	});
}

// goto article button
window.gotoArticle = function(){
	if (gamemap != null) {
		log("getting article link...");

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
	log("Error: " + reason);
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
		hideSearch();
		updateWorldList(gamemap.getWorldFromID(gamemap.getCurrentWorldID()).name);
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
	hideSearch();

	if (Utils.isMobileDevice()) { 
		clearSearch();
	}

	// one here for overflow as well;
}

function onTabClicked(element) {
	if (locationSwitcherRoot.classList.contains("shown")) {

		log("tab clicked!");
		currentTabID = element.href.split("#")[1];

		setTimeout(function() {
			let worldName = gamemap.getWorldFromID(gamemap.getCurrentWorldID()).name;
			let elements = document.getElementsByName(worldName);

			for (let i = 0; elements[i]; i++) {
				let element = elements[i];

				if($(element).is(":visible")){
					setTimeout(function() {
						updateWorldList(worldName);
						element.scrollIntoView({
							behavior: "auto",
							block: "center",
							inline: "center"
						});
					}, 10);
				}
			}
		}, 10);
	}
}

function createWorldLists(mapWorlds) {

	let abcWorldList = [];
	let groups = {};
	const GROUP_DEV_ID = -1337;
	const GROUP_UNSORTED_ID = -1;
	let rootID = mapConfig.rootWorldID || mapConfig.defaultWorldID;

	let topLevelWorldIDs = [rootID, GROUP_DEV_ID, GROUP_UNSORTED_ID];

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

	let finalGroups = [];

	for (let i in topLevelWorldIDs){

		pairings = [];

		// parse location list
		parseGroupList(groups, groups, '', topLevelWorldIDs[i]);

		//remove duplicates from location list
		pairings = Utils.getUniqueListFrom(pairings, 'id');

		// map each location to a position in the array
		const pairMappings = pairings.reduce((obj, world, i) => {
			obj[world.id] = i;
			return obj;
		}, {});

		// create the hierarchy of locations
		let output = groups;
		pairings.forEach((world) => {
			// Handle the root element
			if (world.parentID === null) {
				output = world;
				return;
			}
			// Use our mapping to locate the parent element in our data array
			const parentWorld = pairings[pairMappings[world.parentID]];
			// Add our current world to its parent's `children` array
			parentWorld.children = [...(parentWorld.children || []), world];
		});

		finalGroups.push(output);

	}

	// get HTML for group list pane
	$("#tab_categories").html(createGroupListHTML(finalGroups));

	// init collapsers
	$('.collapsible').collapsible({
		accordion: true,

		onOpenStart: function(element) {
			// darken collapsible
			$(element).find(".collapsible-header:first").css("background-color", "var(--surface_variant)");
			$(element).find("i:first").css("transform", "rotate(180deg)");
		},

		onCloseStart: function(element){

			$(element).find(".collapsible-header:first").css("background-color", "var(--surface_variant_dark)");
			$(element).find("i:first").css("transform", "rotate(360deg)");

		}
	});

}

function updateWorldList(worldName) {
	// deselect previous location in loc switcher
	let selectedElements = document.getElementsByClassName("collection-item active");

	if (selectedElements != null) {
		for (let i = 0; i < selectedElements.length; i++) {

			if (selectedElements[i] != null) {
				selectedElements[i].classList.remove("active");
			}

		}
	}


	// select new location in loc switcher
	let elements = document.getElementsByName(worldName);
	for (let i = 0; i < elements.length; i++) {
		elements[i].classList.toggle("active", true);
	}
}

function parseGroupList(root, obj, stack, rootWorldID) {
	for (var property in obj) {
		if (obj.hasOwnProperty(property)) {
			if (typeof obj[property] == "object") {
				parseGroupList(root, obj[property], stack + '.' + property, rootWorldID);
			} else {

				//console.log("i: " + property + "   " + obj[property]);
				if (root[obj[property]] != null) {
					parseGroupList(root, root[obj[property]], stack + '.' + obj[property], rootWorldID);
				} else {

					// reached the end of the location tree
					let path = stack + '.' + obj[property];
					let pathArray = path.split('.');
					pathArray.shift();

					if (pathArray[0] == rootWorldID){

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

function createGroupListHTML(groups) {
	let output = "";
	let name;
	let displayName;
	let worldID;

	// if the passed grouplist is an array of objects
	if (Array.isArray(groups)) {
		groups.forEach(world => {
			worldID = world.id;
			if (worldID < 0) {
				if (worldID == -1) displayName = "Orphaned Maps";
				if (worldID == -1337) displayName = "Beta Maps";
			} else {
				name = gamemap.getWorldNameFromID(worldID);
				displayName = gamemap.getWorldDisplayNameFromID(worldID);
			}

			if (world["children"]) {

				output += "<ul class='collapsible'><li><div class='collapsible-header waves-effect'>" + displayName + "<i class='material-icons'>expand_more</i></div><div class='collapsible-body''>"
				if (worldID >= 0) output += createLocationRowHTML(worldID);
				output += createGroupListHTML(world["children"]);
				output += "</div></li></ul>";
			} else {
				output += createLocationRowHTML(worldID);
			}

		});
	}
	return output;
}

/*================================================
					  Search
================================================*/

window.focusSearch = function() {
	
	// focus search if it's not already
	if (document.activeElement.id != searchbox.id) {
		searchbox.focus();
	}

	$("#search_results_container").show();

	log("focusing search");
	let searchQuery = searchbox.value;


	if (searchQuery != null && searchQuery.length == 0) {
		// show options div
		$("#search_options_container").css("box-shadow", "0px 1.5px 4px 4px var(--shadow)");
		$("#search_results").html(""); // blank current search results
	} else if (searchQuery.length > 0) {
		toggleSearchPane(true);		
	}

	// is there a search query, if so do stuff with
}

function toggleSearchPane(toggle) {
	if (toggle) {
		$("#search_results_container").show();
		$("#search_results_container").css("background-color", "var(--surface)");
		$("#search_options_container").css("box-shadow", "none");
		$("#searchbar").css({
			BorderTopLeftRadius: 'var(--padding_small)',
			BorderTopRightRadius: 'var(--padding_small)',
			BorderBottomLeftRadius: '0px',
			BorderBottomRightRadius: '0px',
		});
		$("#search_divider").show();
		$("#search_results_container").css("box-shadow", "0px 1.5px 4px 4px var(--shadow)");
	} else {
		$("#searchbar").css({'border-radius': 'var(--padding_large)'});
		$("#search_results_container").css("background-color", "transparent");
		$("#search_results_container").css("box-shadow", "");
		$("#search_divider").hide();
	}
}

window.hideSearch = function() {
	toggleSearchPane(false);
	$("#search_results_container").hide();
	// hide the search pane without clearing search query
}

function clearSearch() {
	searchbox.value = "";
	btn_clear_search.style.visibility = 'hidden';
	$("#search_loading_bar").hide();
	$("#search_results").html("");
	$(".search_results_container").hide();
	hideSearch();
}

let timer;
const DELAY_AMOUNT = 500;

window.updateSearch = function(query, currentMapOnly) {

	if (currentMapOnly == null) {
		currentMapOnly = false;
	}

	log(query);

	// toggle clear button visibility
	if (query.length > 0) {
		btn_clear_search.style.visibility = 'visible';
		toggleSearchPane(true);	
		$("#search_progress_bar").show();
		$("#search_results").html("<b style='font-size: 1.0rem; width: 100%; text-align: center; display: inline-block; padding: var(--padding_small) '>Searching...<b>");

		// search debouncing
		if (timer != null){
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			doSearch(query, currentMapOnly);
		}, DELAY_AMOUNT)

	} else {
		clearSearch();
		toggleSearchPane(false);
	}
}

//gamemap.php?action=search&search=morrowind&world=2282&db=eso
function doSearch(searchQuery, currentMapOnly) {

	if (searchQuery != null && searchQuery.length > 0) {

		// do search stuff
		let queryParams = {};

		queryParams.action = 'search';
		queryParams.search = encodeURIComponent(searchQuery);
		log("search query: " + queryParams.search + ", search in map: " + currentMapOnly);
		if (gamemap.isHiddenLocsShown()) {
			queryParams.showhidden = 1;
		} 

		if (currentMapOnly == true) {
			queryParams.world = gamemap.getCurrentWorldID();
		}

		queryParams.db = mapConfig.database;
	
		if (searchQuery.substring(0, 5) === "type:") {
			let locType = gamemap.getLocTypeByName(searchQuery.substring(5));
			if (locType != null) {
				queryParams.searchtype = locType;
			} 
		}
	
		$.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {

			// inline search result object
			let SearchResult = class {
				constructor(name, description, icon, destinationID) {
					this.name = name;
					this.description = description;
					this.icon = icon || null;
					this.destinationID = destinationID;
				}
			};

			if (!data.isError) {
				$("#search_progress_bar").hide();
				$(".search_results_container").show();
				let searchResults = []; // SearchResults go in here

				// merge both locations and worlds into a single array
				let tempResults = [].concat(data.worlds, data.locations);

				for (let i in tempResults) {

					let result = tempResults[i];

					if (result != null) {
						let searchResult;

						if (result.tilesX != null) { // check if this is a world or a location
							// if true, then we are a world
							searchResult = new SearchResult(result.displayName, null,  null, result.id);
						} else {
							// if not, this is a location
							let world = gamemap.getWorldFromID(result.worldId);
							if (world != null) {
								searchResult = new SearchResult(result.name, world.displayName, result.iconType, -result.id);
							}
						}
	
						if (searchResult != null) {
							searchResults.push(searchResult);
						}
					}

				}

				updateSearchResults(searchResults);
				console.log(searchResults);
				
			} else {
				log("there was an error getting search results");
			}
		});
	}
}

function updateSearchResults(results){
	if (results == null) {
		//hide results menu
		clearSearch();
	} else {
		// get searchHTML

		let html = "";

		if (results.length >= 1) {
			for (let i in results) {
				if (results[i] != null) {
					html += createLocationRowHTML(results[i]);
				}
			}
		} else {
			html = "<b style='font-size: 1.0rem; width: 100%; text-align: center; display: inline-block; padding: var(--padding_small) '>No results found.<b>";
		}


		$("#search_results").html(html);
	}
}



function createLocationRowHTML(data) {

	if (!Number.isNaN(data)) {
		let worldID = data;
		let world = gamemap.getWorldFromID(worldID);

		if (world != null) {
			return ("<div class='collection'><a name='" + world.name + "' onclick='gotoWorld("+worldID+")' class='collection-item waves-effect'> " + world.displayName + " </a></div>");
		}
	} 

	if (data.name != null) {

		
		let imgHTML;
		let isWorld;
		let iconSize = 30;
		if (data.icon != null) {
			let iconURL = mapConfig.iconPath + "/" + data.icon + ".png";
			iconURL = iconURL.replace("//", "/"); // bypass bug doubling forward slashes for some reason
			imgHTML = "<img class='circle' src="+iconURL+" width='"+iconSize+"' height='"+iconSize+"'></img>";
		} else {
			if (data.icon == null && data.description == null) {
				imgHTML = "<i class='small material-icons circle'>public</i>";
				isWorld = true;
			} else {
				imgHTML = "<i class='small material-icons circle'>location_on</i>";
			}
		}


		let nameHTML = "";

		if (isWorld) { nameHTML += "<b>" }
		nameHTML += data.name;
		if (isWorld) { nameHTML += "</b>" }

		if (data.description != null) {
			nameHTML += "<br><small style='color: var(--text_low_emphasis);'>"+ data.description + "</small>";
		} 
	
		return ("<div class='collection'><a onclick='gotoWorld("+data.destinationID+")' class='collection-item search-item avatar waves-effect'> " + imgHTML + nameHTML + "</a></div>");


	// 	<li class="collection-item avatar">
	// 	<img src="images/yuna.jpg" alt="" class="circle">
	// 	<span class="title">Title</span>
	// 	<p>First Line <br>
	// 	   Second Line
	// 	</p>
	// 	<a href="#!" class="secondary-content"><i class="material-icons">grade</i></a>
	//   </li>
	
	}
}