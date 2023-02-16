<!-- @component
### Description
 Location list component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->

<script>
    // import svelte core stuff
	import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { createEventDispatcher } from "svelte";

    // import ui components
    import VirtualList from 'svelte-tiny-virtual-list';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import ListItem from './ListItem.svelte';

    // state vars
    let tabName = 'abc_tab';
    let tabBar = null;
    let locationList = null;
    let dropdownButton = null;
    let contentView = null;
    let mobile = isMobile() || window.innerWidth <= 670;
    let mapWorlds = gamemap.getWorlds();
    $: isReady = false;

    let abcWorldList = [];
    let groupedWorldList = [];
    let pairings = [];
    $: hasGroupedList = false;

    const dispatch = createEventDispatcher();

    onMount(async () => {

        // reposition menu
        reposition();

        //create world lists
        getWorldLists();

	});

    function dismiss() {
        dispatch("dismiss", "dismissed");
    }

    function initialise() {
        // initiate tabs
        let tabs = M.Tabs.init(tabBar, {});
        tabs.select(0);
        isReady = true;
    }

    // dyamically centre dropdown when not mobile
    function reposition() {
        dropdownButton = document.querySelector('#dropdown_icon').parentElement;
        mobile = (isMobile() || window.innerWidth <= 670);
        if (!mobile) {
            let dropdownX = dropdownButton.getBoundingClientRect().left;
            let offset = dropdownX + (dropdownButton.offsetWidth / 2);
            locationList.style.left = offset + "px";
            locationList.style.top = (locationList.offsetHeight / 2) + dropdownButton.offsetHeight + 16 + "px";
        }
    }


    function getWorldLists() {

        let groups = {};
    	const GROUP_DEV_ID = -1337;
    	const GROUP_UNSORTED_ID = -1;
    	let rootID = gamemap.getMapConfig().rootWorldID || gamemap.getMapConfig().defaultWorldID;
    	let topLevelWorldIDs = [rootID, GROUP_DEV_ID, GROUP_UNSORTED_ID];

        abcWorldList = [];
        groupedWorldList = [];
        pairings = [];

        // get alphabetical list
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

        // get grouped list if there's enough worlds
        if (abcWorldList.length > 3) {
            hasGroupedList = true;
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
            for (let i in topLevelWorldIDs){

                pairings = [];

                // parse location list
                parseGroupList(groups, groups, '', topLevelWorldIDs[i]);

                //remove duplicates from location list
                pairings = getUniqueListFrom(pairings, 'id');

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

                groupedWorldList.push(output);
            }
        }

        print(abcWorldList);
        print(groupedWorldList);
        initialise();
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

    // todo: if more than 5 locations, show group tab, else show abc but rename it to "locations"


    // 	// get HTML for group list pane
    // 	$("#tab_categories").html(createGroupListHTML(finalGroups));

    // 	// init collapsers
    // 	$('.collapsible').collapsible({
    // 		accordion: true,

    // 		onOpenStart: function(element) {
    // 			// darken collapsible
    // 			$(element).find(".collapsible-header:first").css("background-color", "var(--surface_variant)");
    // 			$(element).find("i:first").css("transform", "rotate(180deg)");
    // 		},

    // 		onCloseStart: function(element){
    // 			$(element).find(".collapsible-header:first").css("background-color", "var(--surface_variant_dark)");
    // 			$(element).find("i:first").css("transform", "rotate(360deg)");

    // 		}
    // 	});

    // }

    // function updateWorldList(worldName) {
    // 	// deselect previous location in loc switcher
    // 	let selectedElements = document.getElementsByClassName("collection-item active");

    // 	if (selectedElements != null) {
    // 		for (let i = 0; i < selectedElements.length; i++) {

    // 			if (selectedElements[i] != null) {
    // 				selectedElements[i].classList.remove("active");
    // 			}

    // 		}
    // 	}


    // 	// select new location in loc switcher
    // 	let elements = document.getElementsByName(worldName);
    // 	for (let i = 0; i < elements.length; i++) {
    // 		elements[i].classList.toggle("active", true);
    // 	}
    // }



    // function createGroupListHTML(groups) {
    // 	let output = "";
    // 	let name;
    // 	let displayName;
    // 	let worldID;

    // 	// if the passed grouplist is an array of objects
    // 	if (Array.isArray(groups)) {
    // 		groups.forEach(world => {
    // 			worldID = world.id;
    // 			if (worldID < 0) {
    // 				if (worldID == -1) displayName = "Orphaned Maps";
    // 				if (worldID == -1337) displayName = "Beta Maps";
    // 			} else {
    // 				name = gamemap.getWorldNameFromID(worldID);
    // 				displayName = gamemap.getWorldDisplayNameFromID(worldID);
    // 			}

    // 			if (world["children"]) {

    // 				output += "<ul class='collapsible'><li><div class='collapsible-header waves-effect'>" + displayName + "<i class='material-icons'>expand_more</i></div><div class='collapsible-body''>"
    // 				if (worldID >= 0) output += createLocationRowHTML(worldID);
    // 				output += createGroupListHTML(world["children"]);
    // 				output += "</div></li></ul>";
    // 			} else {
    // 				output += createLocationRowHTML(worldID);
    // 			}

    // 		});
    // 	}
    // 	return output;
    // }

        // window.toggleLocationSwitcher = function(toggle){
    // 	if (toggle || toggle == null){
    // 		$("#location_switcher_root").show();
    // 		hideSearch();
    // 		updateWorldList(gamemap.getWorldFromID(gamemap.getCurrentWorldID()).name);
    // 	} else {
    // 		$("#location_switcher_root").hide();
    // 	}

    // 	btnLocationSwitcher.classList.toggle("toggled", toggle);
    // 	locationSwitcherRoot.classList.toggle("shown", toggle);

    // 	reselectTabs();
    // }

    // function reselectTabs() {
    // 	var tabs = M.Tabs.init(document.querySelector("#location_switcher_tab_bar"));
    // 	tabs.select(currentTabID || 'tab_categories');
    // }

        // var currentTabID = "";


    // function onTabClicked(element) {
    // 	if (locationSwitcherRoot.classList.contains("shown")) {

    // 		log("tab clicked!");
    // 		currentTabID = element.href.split("#")[1];

    // 		setTimeout(function() {
    // 			let worldName = gamemap.getWorldFromID(gamemap.getCurrentWorldID()).name;
    // 			let elements = document.getElementsByName(worldName);

    // 			for (let i = 0; elements[i]; i++) {
    // 				let element = elements[i];

    // 				if($(element).is(":visible")){
    // 					setTimeout(function() {
    // 						updateWorldList(worldName);
    // 						element.scrollIntoView({
    // 							behavior: "auto",
    // 							block: "center",
    // 							inline: "center"
    // 						});
    // 					}, 10);
    // 				}
    // 			}
    // 		}, 10);
    // 	}
    // }


    function onMouseDown(event) {
        let target = (event.relatedTarget != null) ? event.relatedTarget : (event.explicitOriginalTarget != null) ? event.explicitOriginalTarget : document.elementsFromPoint(event.clientX, event.clientY)[0];
        let isOutsideLocationList = !(locationList !== target && locationList.contains(target));
        if (isOutsideLocationList && !dropdownButton.contains(target)) {
            dismiss();
        }
    }

</script>

<markup>
    <!-- Location list -->
    <div id="location_list" bind:this={locationList} in:fly={!mobile ? { y: -15, duration: 200 } : { x: 15, duration: 150 }} out:fly={ !mobile ? { y: -5, duration: 150 } : { x: 5, duration: 150 } }>

        <ul id="location_list_tab_bar" class="tabs" bind:this={tabBar}>
            {#if hasGroupedList}
                <li id="group_tab" class="tab"><a href="#tab_categories">Groups</a></li>
            {/if}
            <li id="abc_tab" class="tab"><a href="#tab_alphabetical">{hasGroupedList ? "ABC" : "Locations"}</a></li>
        </ul>

        <div id="location_list_content" bind:this={contentView}>
            <div id="tab_categories" class="tab-pane">
                <!-- grouped locations go here -->
            </div>

            {#if isReady}
                <div id="tab_alphabetical" class="tab-pane">
                    <VirtualList
                        width="100%"
                        height={contentView.clientHeight}
                        itemCount={abcWorldList.length}
                        itemSize={41}
                        scrollToIndex={abcWorldList.indexOf(gamemap.getCurrentWorld().displayName)}
                        scrollToAlignment="center">
                        <!-- svelte-ignore missing-declaration -->
                        <div slot="item" let:index let:style {style}>
                            {@const world = gamemap.getWorldFromDisplayName(abcWorldList[index])}
                            <ListItem title={world.displayName} destinationID={world.id} icon={false} selected={gamemap.getCurrentWorld().displayName == abcWorldList[index]} on:click={(e) => {gamemap.gotoDest(e.detail); dismiss()}}></ListItem>
                        </div>
                    </VirtualList>
                </div>
            {/if}
        </div>
    </div>
</markup>

<style>
    #location_list {
        position: fixed;
        width: calc(var(--side_panel_width) * 0.80 );
        height: 65%;
        background-color: var(--surface);
        color: var(--text_on_primary);
        transform: translate(-50%, -50%);
        z-index: 100000;
        border-radius: var(--padding_medium);
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
    }

    #location_list_content {
        overflow-y: auto;
        height: calc(100% - var(--appbar_dimen));
        border-radius: 0 0 var(--padding_medium) var(--padding_medium);
    }

    #location_list_tab_bar {
        border-radius: var(--padding_medium) var(--padding_medium) 0 0;
        height: var(--appbar_dimen) !important;
        background-color: var(--primary_variant_dark);
        box-shadow: 0 2px 2px 0px var(--shadow);
        z-index: 999;
        display: flex;
    }

    #location_list_tab_bar .tab a {
        color: var(--text_low_emphasis);
        font-weight: bold;
    }

    .tab {
        flex-grow: 1;
    }

    #location_list:before {
        content: "\A";
        border-style: solid;
        border-width: 10px 15px 10px 0;
        border-color: transparent var(--primary_variant_dark) transparent transparent;
        position: absolute;
        left: 50%;
        top: -17px;
        transform: rotate(90deg);
    }
</style>

<!-- Global event listeners -->
<svelte:window on:mousedown={e => onMouseDown(e)} on:resize={reposition} />