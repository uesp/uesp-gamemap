

/*================================================
				 Initialisation
================================================*/

var currentTabID = "";
var pairings = [];

// on page load
log("Page initialising...");
$(document).ready(function() {

	// add click listeners on tabs
	$('#abc_tab').on('click', function(event) { onTabClicked(event.target); });
	$('#group_tab').on('click', function(event) { onTabClicked(event.target); });

	M.AutoInit();

});

/*================================================
				Action Buttons
================================================*/

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

window.showHelp = function() {
	M.toast({text: "TODO: not implemented yet"});
}

window.showMapKey = function() {
	M.toast({text: "TODO: not implemented yet"});
}

// reset map button
window.resetMap = function() {
	gamemap.gotoWorld(mapConfig.defaultWorldID);
}

// fullscreen toggle
window.toggleFullscreen = function() {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen();
		$("#fullscreen-toggle").text("Exit fullscreen");
	} else if (document.exitFullscreen) {
	  	document.exitFullscreen();
		$("#fullscreen-toggle").text("Fullscreen");
	}
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