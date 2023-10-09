<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- @component
### Description
 Location list component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->

<script>
    // import svelte core stuff
    import { fly } from 'svelte/transition';
    import { createEventDispatcher } from "svelte";
    import { onMount } from 'svelte';

    // import ui components
    import VirtualList from 'svelte-tiny-virtual-list';
    import ListItem from './ListItem.svelte';
    import LocationCollapsible from './LocationCollapsible.svelte';

    // state vars
    export let isShown = false;
    let currentTab = 0;
    let locationList = null;
    let dropdownButton = null;
    let contentViewHeight;
    let tabBar;
    let mobile = isMobile || window.innerWidth <= 670;
    let mapWorlds = gamemap.getWorlds();
    let abcWorldList = [];
    let groupedWorldList = [];
    let pairings = [];
    let hasGroupedList = true;

    const dispatch = createEventDispatcher();

    export function show(value) {
        isShown = value;
        dispatch("toggled", isShown);
        if (isShown) {
            setTimeout(() => {
                // initiate tabs
                selectTab(currentTab);
                M.Tabs.init(tabBar, {});

                // reposition menu
                if (gamemap.hasMultipleWorlds()) reposition();
            });
        }
    }

    export function toggle() {
        show(!isShown);
    }

    // get world lists
    window.getWorldLists = function getWorldLists() {
        let groups = {};
    	const GROUP_DEV_ID = -1337;
    	const GROUP_UNSORTED_ID = -1;
    	let rootID = gamemap.getMapConfig().rootWorldID || gamemap.getMapConfig().defaultWorldID;
    	let topLevelWorldIDs = [rootID, GROUP_UNSORTED_ID];

        if (gamemap.getMapConfig().database == "eso") { topLevelWorldIDs.push(GROUP_DEV_ID) } // add beta map section for eso

        abcWorldList = [];
        groupedWorldList = [];
        pairings = [];

        // get alphabetical list
        mapWorlds.forEach(world => {
            if (world.displayName != '_' && world.id > 0) abcWorldList.push(world.displayName);
        });

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
        hasGroupedList = abcWorldList.length > 5;
        if (hasGroupedList) {
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
            for (let i in topLevelWorldIDs) {

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

        selectTab(currentTab);
    }

    // create hiearchical group list
    function parseGroupList(root, obj, stack, rootWorldID) {
    	for (var property in obj) {
    		if (obj.hasOwnProperty(property)) {
    			if (typeof obj[property] == "object") {
    				parseGroupList(root, obj[property], stack + '.' + property, rootWorldID);
    			} else {

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

    // dyamically centre dropdown when not mobile
    function reposition() {
        dropdownButton = document.querySelector('#dropdown_icon')?.parentElement;
        mobile = (isMobile || window.innerWidth <= 670);
        if (!mobile && locationList && dropdownButton) {
            let dropdownX = dropdownButton.getBoundingClientRect().left;
            let offset = dropdownX + (dropdownButton.clientWidth / 2);
            locationList.style.left = offset + "px";
            locationList.style.top = (locationList.offsetHeight / 2) + dropdownButton.offsetHeight + 16 + "px";
        }
    }

    // detect when clicked outside of the popup
    function onMouseDown(event) {
        let target = (event.relatedTarget != null) ? event.relatedTarget : (event.explicitOriginalTarget != null) ? event.explicitOriginalTarget : document.elementsFromPoint(event.clientX, event.clientY)[0];
        let isOutsideLocationList = !(locationList !== target && locationList?.contains(target));
        if (isOutsideLocationList && !dropdownButton?.contains(target)) { dismiss(); }
    }

    // select provided tab
    function selectTab(index) {
        currentTab = (hasGroupedList) ? index : 1;
    }

    // dismiss popup on esc pressed
    function onKeyPressed(event) {
        if (event.key == "Escape" || event.keyCode == 27) {
            dismiss();
        }
    }

    // dismiss the popup
    export function dismiss() { show(false) }

    onMount(() => { getWorldLists() });
</script>

<markup>
    <!-- Location list -->
    {#if isShown}
        <div id="location_list" bind:this={locationList} in:fly|global={!mobile ? { y: -15, duration: 200 } : { x: 15, duration: 150 }} out:fly|global={ !mobile ? { y: -5, duration: 150 } : { x: 5, duration: 150 } } on:contextmenu={(e) => e.stopPropagation()}>

            <ul id="location_list_tab_bar" class="tabs" class:singleTab={!hasGroupedList} bind:this={tabBar}>
                {#if hasGroupedList}
                    <li id="group_tab" class="tab" on:click={() => selectTab(0)}><a class:active={currentTab == 0} href="#tab_categories">Grouped</a></li>
                {/if}
                <li id="abc_tab" class="tab" on:click={() => selectTab(1)}><a class:active={currentTab == 1} href="#tab_alphabetical">{hasGroupedList ? "ABC" : "Worlds"}</a></li>
            </ul>

            <div id="location_list_content" bind:clientHeight={contentViewHeight}>

                {#if currentTab == 0}
                    <div id="tab_categories" class="tab-pane">
                        {#each groupedWorldList as group,i}
                            {@const worldID = group.id}
                            {@const name = (worldID < 0) ? (worldID == -1) ? "Orphaned Maps" : "Beta Maps" : gamemap.getWorldDisplayNameFromID(worldID)}
                            <LocationCollapsible data={group} expanded={i==0} title={name}/>
                        {/each}
                    </div>
                {/if}

                {#if currentTab == 1 && contentViewHeight}
                    <div id="tab_alphabetical" class="tab-pane">
                        <VirtualList
                            height={contentViewHeight}
                            itemCount={abcWorldList.length}
                            itemSize={42}
                            scrollToIndex={abcWorldList.indexOf(gamemap.getCurrentWorld().displayName)}
                            scrollToAlignment="center">
                            <div slot="item" let:index let:style {style}>
                                {@const world = gamemap.getWorldFromDisplayName(abcWorldList[index])}
                                <ListItem title={world.displayName} destinationID={world.id} selected={gamemap.getCurrentWorld().displayName == abcWorldList[index]} on:click={(e) => {gamemap.goto(e.detail); dismiss()}} on:middleClick={(e) => window.open(`${location.origin}${location.pathname}?world=${e.detail}`)}></ListItem>
                            </div>
                        </VirtualList>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
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
        border-radius: var(--radius_large);
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        cursor: auto;
    }

    #location_list_content {
        overflow-y: auto;
        height: calc(100% - var(--appbar_dimen));
        border-radius: 0 0 var(--radius_large) var(--radius_large);
    }

    #location_list_tab_bar {
        border-radius: var(--radius_large) var(--radius_large) 0 0;
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
        top: -16px;
        transform: rotate(90deg);
    }

    .singleTab .tab a{
	    cursor: default !important;
    }

    .singleTab .tab a {
	    background-color: var(--primary_variant_dark) !important;
    }

</style>

<!-- Global event listeners -->
<svelte:window on:mousedown={e => onMouseDown(e)} on:resize={reposition} on:keydown={onKeyPressed} />