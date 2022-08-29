import * as Utils from "./utils.js";
// import Gamemap from "./gamemap.js";

/*
 * main.js -- Created by Thal-J (thal-j@uesp.net) on 16th Aug 2022
 * 	Released under the GPL v2
 * 	Contains main UI code for the Gamemap system.
 */

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

// on page load
console.log("Map initialising...");
$(document).ready(function() {

	// get params from URL
	var url = window.location.search;
	var urlParams = url.replace("?", '');

	mapParams = new URLSearchParams(urlParams); //create params array
	// searchParams.has("name") === true; // true
	// searchParams.get("age") === "1337"; // true

	// get which map we are supposed to be loading
	if (!mapParams.has("map")) {
		showError("No map was provided.");
	} else {
		mapType = mapParams.get("map");

		//gamemap.php?action=search&search=morrowind&world=2282&db=eso
		//const obj = JSON.parse(text); 

		// load map config 

		console.log("Getting map config...");
		
		let configURL = "configs/" + mapType + "/config.json";


		alert(configURL);

		$.getJSON(configURL, function(object) {
			console.log(object);
			mapConfig = object;
		});


		if (mapConfig === null) {
			showError("Provided map doesn't exist or is invalid.");
		}
		

		
	}

	Utils.foo();

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

	var callbacks = {
		onMapWorldsLoaded   : onWorldLoad,
		onPermissionsLoaded : onPermLoad,
		onMapWorldChanged   : onWorldChanged
	};

	// var g_GameMap = new uesp.gamemap.Map('gmMap', g_DefaultMapOptions, userEvents);
	//const g_GameMap = new Gamemap('gmMap', g_DefaultMapOptions, userEvents);

	console.log(g_GameMap);

	// if (g_GameMap.mapOptions.isOffline) {
	// 	g_GameMap.worldGroupListContents = $("#gmMapListRoot").html();
	// 	g_GameMap.createMapList($("#gmMapListRoot"));
	// 	$('#gmMapList').html(g_GameMap.worldGroupListContents);
	// 	g_GameMap.setEventsForMapGroupList();
	// }
	// else { 
	// 	// TODO: Change how map list is created
	// 	g_GameMap.createMapList($("#gmMapListRoot"));

	// 	// TODO: Temporary call to get the group-world list for ESO
	// 	$.get( 'templates/worldgrouplist.txt', function( data ) {
	// 		g_GameMap.worldGroupListContents = data;
	// 		uesp.logDebug(uesp.LOG_LEVEL_INFO, 'Received world group list contents!');
	// 		$('#gmMapList').html(data);
	// 		g_GameMap.setEventsForMapGroupList();
	// 	});
	// }
});



/*================================================
					Map Utils
================================================*/

function getCurrentWorldID() {
	// implementation shim

	return e;
}


/*================================================
					  Gamemap
================================================*/

function loadGamemap() {

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

function showError(reason){
	$("#error_box").show();
	$('#error_box').css('visibility','visible');
	$("#error_box_reason").text(reason);
	console.log(reason);
}

/*================================================
					Gamemap
================================================*/

var esoIconMap = {
	1  : "Artifact Gate",
	2  : "Bank",
	3  : "Battle",
	4  : "Border Keep",
	5  : "Caravan",
	6  : "Clothier",
	7  : "Dock",
	8  : "Elder Scroll",
	9  : "Farm",
	10 : "Forward Camp",
	11 : "Inn",
	12 : "Keep",
	13 : "Lumber Mill",
	14 : "Mine",
	15 : "Outpost",
	16 : "Smithy",
	17 : "Temple",
	18 : "Vendor",
	19 : "Wayshrine",
	20 : "Arcanist",
	21 : "Woodworker",
	22 : "Alchemist",
	23 : "Brewer",
	24 : "Armory",
	25 : "Pack Merchant",
	26 : "Banker",
	27 : "Outfitter",
	28 : "Cooking Fire",
	29 : "Enchanter",
	30 : "Fighters Guild",
	31 : "Hall Steward",
	32 : "Armorer",
	33 : "Tailor",
	34 : "Merchant",
	35 : "Mages Guild",
	36 : "Fishing Hole",
	37 : "Leatherworker",
	38 : "Perquisitor",
	39 : "Provisioner",
	40 : "Rededication Shrine",
	41 : "Stable Master",
	42 : "Weaponsmith",
	43 : "Travel NPC",
	44 : "Blacksmith",
	50 : "Area of Interest",
	51 : "Ayleid Ruin",
	52 : "Camp",
	53 : "Cave",
	54 : "Cemetary",
	55 : "City",
	56 : "Crafting Site",
	57 : "Crypt",
	58 : "Daedric Ruin",
	59 : "Delve",
	60 : "Dwemer Ruin",
	61 : "Estate",
	62 : "Quest Start",
	63 : "Group Boss",
	64 : "Group Dungeon",
	65 : "Group Delve",
	66 : "Grove",
	67 : "Lighthouse",
	68 : "Mundus Stone",
	69 : "Dark Anchor",
	70 : "Public Dungeon",
	71 : "Ruin",
	72 : "Sewer",
	73 : "Tower",
	74 : "Town",
	75 : "Skyshard",
	76 : "Lore Book",
	77 : "Quest",
	78 : "Quest Door",
	79 : "Treasure Map",
	80 : "House",
	81 : "NPC",
	82 : "Named NPC",
	83 : "Chest",
	84 : "Alchemy Station",
	85 : "Enchanting Station",
	86 : "Blacksmith Station",
	87 : "Woodworking Station",
	88 : "Clothing Station",
	89 : "Heavy Sack",
	90 : "Crafting Node",
	91 : "Container",
	92 : "Artifact Gate (AD)",
	93 : "Artifact Gate (DC)",
	94 : "Artifact Gate (EP)",
	95 : "Artifact Temple (AD)",
	96 : "Artifact Temple (DC)",
	97 : "Artifact Temple (EP)",
	98 : "Border Keep (AD)",
	99 : "Border Keep (DC)",
	100: "Border Keep (EP)",
	101: "Cemetary (AD)",
	102: "Cemetary (DC)",
	103: "Cemetary (EP)",
	104: "Farm (AD)",
	105: "Farm (DC)",
	106: "Farm (EP)",
	107: "Keep (AD)",
	108: "Keep (DC)",
	109: "Keep (EP)",
	110: "Lumber Mill (AD)",
	111: "Lumber Mill (DC)",
	112: "Lumber Mill (EP)",
	113: "Mine (AD)",
	114: "Mine (DC)",
	115: "Mine (EP)",
	116: "Outpost (AD)",
	117: "Outpost (DC)",
	118: "Outpost (EP)",
	119: "Carpenter",
	120: "Armsman",
	121: "Chef",
	122: "Grocer",
	123: "Mystic",
	124: "Magus",
	125: "Innkeeper",
	126: "Boatswain",
	127: "Stables",
	128: "Celestial Rift",
	129: "Dark Fissure",
	130: "Magister",
	131: "Ayleid Well",
	132: "Misc",
	133: "Outlaws Refuge",
	134: "Guild Trader",
	135: "Outfit Station",
	136: "Dungeon",
	137: "Solo Instance",
	138: "Raid Dungeon",
	139: "Group Instance",
	140: "World Event",
	141: "Undaunted",
	142: "Moneylender",
	143: "Safebox",
	144: "Quest (Small)",
	145: "Fence",
	146: "Quest Door (Locked)",
	147: "Survey Map",
	148: "Stylemaster",
	149: "Ladder",
	150: "Sewer (AD)",
	151: "Sewer (EB)",
	152: "Sewer (DF)",
	153: "Safehouse",
	154: "Boneshard Vault",
	155: "Dark Ether Vault",
	156: "Mark Legion Vault",
	157: "Monstrous Tooth Vault",
	158: "Planar Armor Vault",
	159: "Tiny Claw Vault",
	160: "Daedric Ember Vault",
	161: "Daedric Shackles Vault",
	162: "Solo Trial",
	163: "Trophy",
	164: "Museum",
	165: "Thieves Guild",
	166: "Guild Trader (Small)",
	167: "Thieves Trove",
	168: "Quest Door (Trespass)",
	169: "Dark Brotherhood",
	170: "Hiding Spot",
	171: "Achievement",
	172: "Town (EP)",
	173: "Town (DC)",
	174: "Town (AD)",
	175: "Sewer (Group)",
	176: "Area of Interest (Group)",
	177: "Ayleid Ruin (Group)",
	178: "Camp (Group)",
	179: "Cave (Group)",
	180: "Cemetary (Group)",
	181: "Crypt (Group)",
	182: "Dwemer Ruin (Group)",
	183: "Estate (Group)",
	184: "Gate (Group)",
	185: "Keep (Group)",
	186: "Lighthouse (Group)",
	187: "Mine (Group)",
	188: "Ruin (Group)",
	189: "Horse Race",
	190: "Quest Start (Repeatable)",
	191: "Book / Note",
	192: "Furnisher (Achievement)",
	193: "Furnisher (Prestige)",
	194: "Furnisher (Home Goods)",
	195: "Fishing Hole (Ocean)",
	196: "Fishing Hole (River)",
	197: "Fishing Hole (Lake)",
	198: "Fishing Hole (Foul)",
	199: "Mastercraft Mediator",
	200: "Navigator",
	201: "Quartermaster",
	202: "Transmute Station",
	203: "Jeweler",
	204: "Psijic Portal",
	205: "Stairs Up",
	206: "Stairs Down",
	207: "Oneway West",
	208: "Oneway Southwest",
	209: "Oneway Southeast",
	210: "Oneway South",
	211: "Oneway Northwest",
	212: "Oneway Northeast",
	213: "Oneway North",
	214: "Oneway East",
	215: "Jewelry Station",
	216: "Imperial City Entrance",
	217: "Bridge",
	218: "Milegate",
	219: "Event Merchant",
	220: "Shrine",
	221: "Dragon",
	222: "Volendrung",
	223: "Blackreach Lift",
	224: "Nord Boat",
	225: "Furnisher (Battlegrounds)",
	226: "Battleground Merchant",
	227: "Antiquity",
	228: "Furnisher",
	229: "Quest (Story)",
};

var g_DefaultMapOptions = {
	getMapTileFunction : getDefaultMapTile,
	wikiUrl: "//en.uesp.net/wiki/",
	mapUrl : "//esomap.uesp.net/esomap.html",
	missingMapTile:  "//maps.uesp.net/esomap/blacknulltile.jpg",
	iconPath: "icons/",
	wikiNamespace: "Online",
	iconTypeMap: esoIconMap,
	gamePosX1: 0,
	gamePosX2: 1000000,
	gamePosY1: 1000000,
	gamePosY2: 0,
	initialGamePosX : 400000,
	initialGamePosY : 600000,
	initialZoom : 10,
	tileCountX : 11,
	tileCountY : 9,
	homeWorldId : 668,
	minValidWorldId : 50,
	maxValidWorldId : 20000,
	dbPrefix: "eso",
	// useCanvasDraw : true,
};

if (g_DefaultMapOptions.isOffline) {
	g_DefaultMapOptions.getMapTileFunction = getDefaultMapTile_Offline;
	g_DefaultMapOptions.missingMapTile = "blacknulltile.jpg";
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

function getDefaultMapTile(xPos, yPos, zoom, worldName) {
	return "//maps.uesp.net/esomap/" + worldName + "/zoom" + zoom + "/" + worldName + "-" + xPos + "-" + yPos + ".jpg";
}

function getDefaultMapTile_Offline(xPos, yPos, zoom, worldName) {
	return "" + worldName + "/zoom" + zoom + "/" + worldName + "-" + xPos + "-" + yPos + ".jpg";
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