<!-- @component
### Description
 Search component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (31st Jan, 2023) -->

<script>

    // import core svelte stuff
    import { fade, fly } from 'svelte/transition';

    // import UI components
    import Checkbox from "./Checkbox.svelte";
    import Icon from "./Icon.svelte";
    import IconButton from "./IconButton.svelte";
    import ProgressBar from "./ProgressBar.svelte";
    import ListItem from "./ListItem.svelte";

    // declare state vars
    let searchBox = null;
    let isLoading = false;
    let searchCurrentMap = false;
    let doPinSearch = getPrefs("pinsearch");
    $: expandOptions = getPrefs("expandsearchoptions");
    $: searchQuery = "";
    $: searchResults = null;
    $: searchFocused = null;
    $: showSearchPane = (searchQuery.length > 0 && searchQuery != "" && searchFocused && searchBox.value != "");
    let currentlySelectedResult = 0;

    // search result object
    let SearchResult = class {
        constructor(name, description, icon, destinationID) {
            this.name = name;
            this.description = description;
            this.icon = icon || null;
            this.destinationID = destinationID;
        }
    };

    // update search query
    let timer;
    const DELAY_AMOUNT = 500;
    function updateSearch(query, currentMapOnly) {
        // update search query
        searchQuery = query;
        currentMapOnly = (currentMapOnly != null) ? currentMapOnly : false;

        if (query != null && query.length > 0) {
            searchResults = null;
            currentlySelectedResult = 0;
            isLoading = true;

            // search debouncing
            if (timer != null){
                clearTimeout(timer);
            }
            timer = setTimeout(() => {
                doSearch(query, currentMapOnly);
            }, DELAY_AMOUNT)

        } else {
            currentlySelectedResult = 0;
            isLoading = false;
            searchResults = null;
        }
    }

    // perform search request
    function doSearch(searchQuery, currentMapOnly) {

        let queryParams = {};
        queryParams.action = 'search';
        queryParams.search = encodeURIComponent(searchQuery);
        print("search query: " + queryParams.search + ", search in map: " + currentMapOnly);

        if (currentMapOnly == true) {
            queryParams.world = gamemap.getCurrentWorldID();
        }

        queryParams.db = gamemap.getMapConfig().database;

        if (searchQuery.substring(0, 5) === "type:") {
            let locType = gamemap.getLocTypeByName(searchQuery.substring(5));
            if (locType != null) {
                queryParams.searchtype = locType;
            }
        }

        getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

            if (!error && data != null) {

                // merge both locations and worlds into a single array
                let tempResults = [].concat(data.worlds, data.locations);
                let tempSearchResults = []; // search results go in here

                for (let i in tempResults) {

                    let result = tempResults[i];

                    if (result != null) {
                        let searchResult;

                        // check if this is a world or a location
                        if (result.tilesX != null) {
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
                            tempSearchResults.push(searchResult);
                        }
                    }
                }
                searchResults = tempSearchResults;
                isLoading = false;
                print(searchResults);
            } else {
                print.warn("There was an error getting search results.");
            }
        });
    }

    // on search pane focused
    function onSearchFocused(event, isFocused) {

        if (event.type != "focus") {
            let searchPane = document.querySelector('#search_pane');
            let target = (event.relatedTarget != null) ? event.relatedTarget : (event.explicitOriginalTarget != null) ? event.explicitOriginalTarget : document.elementsFromPoint(event.clientX, event.clientY)[0];
            let isInsideSearchPane = searchPane !== target && searchPane.contains(target);

            // hide search if it's not pinned
            if (!doPinSearch) {
                searchFocused = isInsideSearchPane;
            } else if (searchQuery == "") {
                searchFocused = isInsideSearchPane;
            }

        } else {
            searchFocused = isFocused;
        }
    }

    // listen to key press events
    function onKeyPressed(event) {
        // if ctrl + F pressed, focus search
        if ((event.ctrlKey || event.metaKey) && event.keyCode === 70) {
    		event.preventDefault();
            searchBox.focus();
    	}

        // navigate search results using keyboard
        if (searchFocused && showSearchPane && searchResults != null && searchResults.length > 0) {

            if (event.key == "Enter" || event.keyCode == 13) {
                goto(searchResults[currentlySelectedResult].destinationID);
                selectSearchResult(currentlySelectedResult);
                event.preventDefault();
            }

            if (event.key == "ArrowUp" || event.keyCode == 38) {
                currentlySelectedResult = (currentlySelectedResult - 1 >= 0) ? currentlySelectedResult -1 : 0;
                // scroll to top of the list if index is zero
                if (currentlySelectedResult == 0) {
                    document.getElementById('search_content_container').scroll({top:0,behavior:'auto'});
                }

                selectSearchResult(currentlySelectedResult);
                event.preventDefault();
            }

            if (event.key == "ArrowDown" || event.keyCode == 40) {
                currentlySelectedResult = (currentlySelectedResult + 1 != searchResults.length) ? currentlySelectedResult + 1 : currentlySelectedResult;
                selectSearchResult(currentlySelectedResult);
                event.preventDefault();
            }
        }

        if (searchFocused) {
            if (event.key == "Escape" || event.keyCode == 27) {
                searchFocused = false;
                gamemap.mapRoot.focus();
            }
        }
    }

    function selectSearchResult(index) {
        // deselect previous results
        let selectedElements = document.querySelectorAll(".list-item.selected");
        [].forEach.call(selectedElements, function(element) {
            element.classList.remove("selected");
        });

        // select the new result and scroll it into view
        let elements = document.getElementsByClassName("list-item");
        elements[index].classList.add("selected");
        elements[index].scrollIntoView({
            behavior: "auto",
            block: "nearest",
		});
    }

    // callbacks
    function clearSearch() { searchBox.value = ""; updateSearch("", false) }
    function goto(destinationID) {gamemap.goto(destinationID); if (!doPinSearch){ searchFocused = false; } }
</script>

<markup>
    <div id="search_pane" in:fly="{{ x: -5, duration: 250 }}" out:fade="{{duration: 75}}">
        <div id="search_container">
            <!-- Search bar -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div id='searchbar' title="Type here to search" class="waves-effect" class:fullPane={showSearchPane} on:click={() => (searchBox.focus())}>

                <!-- Magnifying glass icon -->
                <div id="search_icon">
                    <Icon name="search"></Icon>
                </div>

                <!-- Searchbox -->
                <div id='searchbox_container'>
                    <input id='searchbox' type='search' placeholder="Where would you like to go?" maxlength='100' style="border-bottom: none !important; box-shadow: none !important;" autocomplete='off' on:focus={(e) => onSearchFocused(e, true)} bind:this={searchBox} bind:value={searchQuery} on:input={() => updateSearch(searchBox.value, searchCurrentMap)}/>
                </div>

                <!-- Clear search button -->
                {#if searchQuery.length > 0 && searchBox.value != ""}
                    <IconButton icon="close" tooltip="Clear the current search" hasBackground={false} on:click={clearSearch}></IconButton>
                {/if}

                <!-- Loading bar -->
                {#if showSearchPane && isLoading}
                    <div style="top: 46px; position: absolute; left: 0px; width: 100%;"><ProgressBar/></div>
                {/if}
            </div>

            {#if searchFocused}
                <div id="search_content_container" class:fullPane={showSearchPane}>

                    <!-- Search Options -->
                    <div id="search_options" class:fullPane={showSearchPane}>
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore missing-declaration -->
                        <b style="font-size: 1.0rem;" class="waves-effect" title="Click to show/hide search options" on:click={() => {setPrefs("expandsearchoptions", !getPrefs("expandsearchoptions")); expandOptions = getPrefs("expandsearchoptions");}}>Search Options <Icon name={(expandOptions) ? "expand_less" : "expand_more"} size="tiny"></Icon></b><br>
                        {#if doPinSearch && showSearchPane}<div id="search_pin_status" title="Search is pinned"><Icon name="push_pin" size="tiny"></Icon></div>{/if}

                        {#if expandOptions}
                            <!-- svelte-ignore missing-declaration -->
                            {#if gamemap.hasMultipleWorlds()}<Checkbox label="Only show results from this map" title="Toggle to only search locations in the current map" checked={searchCurrentMap} on:change={(e) => {searchCurrentMap = e.detail; updateSearch(searchQuery, searchCurrentMap)}}></Checkbox>{/if}
                            <!-- svelte-ignore missing-declaration -->
                            <Checkbox label="Pin search pane" title="Toggle to pin the search window over the map" checked={doPinSearch} on:change={(e) => {setPrefs("pinsearch", e.detail); doPinSearch = getPrefs("pinsearch");}}></Checkbox>
                        {/if}

                    </div>

                    <!-- Search content -->
                    {#if showSearchPane}
                        <!-- Divider -->
                        <hr id="search_divider">

                        <!-- Placeholder text -->
                        {#if !searchResults}
                            <b style='font-size: 1.0rem; width: 100%; text-align: center; display: inline-block; padding: var(--padding_small) '>Searching...</b>
                        {/if}

                        <!-- Search Results -->
                        {#if searchResults != null}
                            <div id="search_results" class='search_results'>
                                {#if searchResults.length > 0}
                                    {#each searchResults as result}
                                        <!-- svelte-ignore missing-declaration -->
                                        <ListItem title={result.name} description={result.description} icon={result.icon} destinationID={result.destinationID} on:click={(e) => {goto(e.detail)}}/>
                                    {/each}
                                     <!-- search results go here-->
                                {:else}
                                    <b style='font-size: 1.0rem; width: 100%; text-align: center; display: inline-block; padding: var(--padding_small);'>No results found.</b>
                                {/if}
                            </div>
                        {/if}
                    {/if}
                </div>
            {/if}
        </div>
    </div>
</markup>

<style>
    /* Search pane */
    #search_pane {
        position: absolute;
        width: var(--side_panel_width);
        height: 100%;
        z-index: 100;
        font-size: 12px;
        z-index: 999;
        pointer-events: none;
    }

    #search_container > * {
        margin-left: var(--padding_minimum);
        margin-right: var(--padding_minimum);
    }

    #search_content_container {
        padding-top: var(--padding_medium);
        pointer-events: visible;
        position: relative;
        top: 2px;
        border-radius: var(--padding_small);
        border-top-left-radius: 0px;
        border-top-right-radius: 0px;
        max-height: 70vh;
        padding-bottom: var(--padding_minimum);
        pointer-events: none;
    }

    #search_content_container.fullPane {
        overflow: auto;
        background-color: var(--surface) !important;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        pointer-events: visible;
    }


    /* Searchbar */
    #searchbar {
        display: flex;
        position: relative;
        top: var(--padding_minimum);
        flex-wrap: nowrap;
        flex-grow: 2;
        justify-content: space-between;
        background-color: var(--primary);
        z-index: var(--zindex_floating);
        border-radius: var(--padding_large);
        pointer-events: auto;
        transition: all ease 150ms;
        height: var(--appbar_dimen);
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        cursor:text !important;
    }
    #searchbar.fullPane {
        border-top-left-radius: var(--padding_small);
        border-top-right-radius: var(--padding_small);
        border-bottom-left-radius: 0px;
        border-bottom-right-radius: 0px;
    }
    #search_icon {
        color: var(--text_low_emphasis);
        margin-top: auto;
        margin-bottom: 8px;
        margin-left: 12px;
        margin-right: 4px;
    }

    /* Search box */
    #searchbox_container {
        margin: auto;
        width: 100%;
    }

    /* Search options */
    #search_options {
        pointer-events: visible;
        padding-top: var(--padding_large);
        padding: var(--padding_small);
        border-radius: var(--padding_small);
        background-color: var(--surface);
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        width: fit-content;
    }
    #search_options.fullPane {
        box-shadow: none;
        width: 100%;
    }

    #search_pin_status {
        position: absolute;
        right: var(--padding_small);
        top: 33px;
    }

    /* Search results */
    #search_results {
        max-height: fit-content;
        overflow: auto;
        height: 100%;
    }
</style>

<!-- Global event listeners -->
<svelte:window on:keydown={onKeyPressed} on:mousedown={e => onSearchFocused(e, null)}/>