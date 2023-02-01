<!-- @component
### Description
 Search component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (31st Jan, 2023) -->

<script>
    // import UI components
    import Icon from "./Icon.svelte";
    import IconButton from "./IconButton.svelte";
  import ProgressBar from "./ProgressBar.svelte";

    // declare state vars
    let searchBox = null;
    let isLoading = false;
    let doPinSearch = false;
    let expandOptions = true;

    $: searchQuery = "";
    $: searchResults = null;
    $: searchFocused = null;
    $: showSearchPane = searchQuery.length > 0 && searchQuery != "" && searchFocused && searchBox.value != "";

    // TODO: look into adding a way to pin the search for dave


    // if (searchQuery != null && searchQuery.length == 0) {
    //     // show options div
    //     if (!gamemap.hasMultipleWorlds()) {
    //         $("#search_options_container").hide();
    //     }
    //     $("#search_options_container").css("box-shadow", "0px 1.5px 4px 4px var(--shadow)");
    //     $("#search_results").html(""); // blank current search results
    // } else if (searchQuery.length > 0) {
    //     toggleSearchPane(true);
    // }

    // // is there a search query, if so do stuff with
    // }

    // function toggleSearchPane(toggle) {
    // if (toggle) {
    //     $("#search_divider").show();

    // } else {
    //     $("#searchbar").css({'border-radius': 'var(--padding_large)'});
    //     $("#search_results_container").css("background-color", "transparent");
    //     $("#search_results_container").css("box-shadow", "");
    //     $("#search_divider").hide();
    // }
    // }

    // let timer;
    // const DELAY_AMOUNT = 500;

    // window.updateSearch = function(query, currentMapOnly) {

    // if (currentMapOnly == null) {
    //     currentMapOnly = false;
    // }

    // log(query);

    // // toggle clear button visibility
    // if (query.length > 0) {
    //     $("#btn_clear_search").show();
    //     toggleSearchPane(true);
    //     $("#search_progress_bar").show();
    //     $("#search_results").html("<b style='font-size: 1.0rem; width: 100%; text-align: center; display: inline-block; padding: var(--padding_small) '>Searching...<b>");

    //     // search debouncing
    //     if (timer != null){
    //         clearTimeout(timer);
    //     }
    //     timer = setTimeout(() => {
    //         doSearch(query, currentMapOnly);
    //     }, DELAY_AMOUNT)

    // } else {
    //     clearSearch();
    //     toggleSearchPane(false);
    // }
    // }

    // //gamemap.php?action=search&search=morrowind&world=2282&db=eso
    // function doSearch(searchQuery, currentMapOnly) {

    // if (searchQuery != null && searchQuery.length > 0) {

    //     // do search stuff
    //     let queryParams = {};

    //     queryParams.action = 'search';
    //     queryParams.search = encodeURIComponent(searchQuery);
    //     log("search query: " + queryParams.search + ", search in map: " + currentMapOnly);
    //     if (gamemap.isHiddenLocsShown()) {
    //         queryParams.showhidden = 1;
    //     }

    //     if (currentMapOnly == true) {
    //         queryParams.world = gamemap.getCurrentWorldID();
    //     }

    //     queryParams.db = mapConfig.database;

    //     if (searchQuery.substring(0, 5) === "type:") {
    //         let locType = gamemap.getLocTypeByName(searchQuery.substring(5));
    //         if (locType != null) {
    //             queryParams.searchtype = locType;
    //         }
    //     }

    //     $.getJSON(Constants.GAME_DATA_SCRIPT, queryParams, function(data) {

    //         // inline search result object
    //         let SearchResult = class {
    //             constructor(name, description, icon, destinationID) {
    //                 this.name = name;
    //                 this.description = description;
    //                 this.icon = icon || null;
    //                 this.destinationID = destinationID;
    //             }
    //         };

    //         if (!data.isError) {
    //             $("#search_progress_bar").hide();
    //             $(".search_results_container").show();
    //             let searchResults = []; // SearchResults go in here

    //             // merge both locations and worlds into a single array
    //             let tempResults = [].concat(data.worlds, data.locations);

    //             for (let i in tempResults) {

    //                 let result = tempResults[i];

    //                 if (result != null) {
    //                     let searchResult;

    //                     if (result.tilesX != null) { // check if this is a world or a location
    //                         // if true, then we are a world
    //                         searchResult = new SearchResult(result.displayName, null,  null, result.id);
    //                     } else {
    //                         // if not, this is a location
    //                         let world = gamemap.getWorldFromID(result.worldId);
    //                         if (world != null) {
    //                             searchResult = new SearchResult(result.name, world.displayName, result.iconType, -result.id);
    //                         }
    //                     }

    //                     if (searchResult != null) {
    //                         searchResults.push(searchResult);
    //                     }
    //                 }

    //             }

    //             updateSearchResults(searchResults);
    //             console.log(searchResults);

    //         } else {
    //             log("there was an error getting search results");
    //         }
    //     });
    // }
    // }

    // function updateSearchResults(results){
    // if (results == null) {
    //     //hide results menu
    //     clearSearch();
    // } else {
    //     // get searchHTML

    //     let html = "";

    //     if (results.length >= 1) {
    //         for (let i in results) {
    //             if (results[i] != null) {
    //                 html += createLocationRowHTML(results[i]);
    //             }
    //         }
    //     } else {
    //         html = "<b style='font-size: 1.0rem; width: 100%; text-align: center; display: inline-block; padding: var(--padding_small) '>No results found.<b>";
    //     }

    //     $("#search_results").html(html);
    // }
    // }

    // function createLocationRowHTML(data) {

    // if (!Number.isNaN(data)) {
    //     let worldID = data;
    //     let world = gamemap.getWorldFromID(worldID);

    //     if (world != null) {
    //         return ("<div class='collection'><a name='" + world.name + "' onclick='gotoWorld("+worldID+")' class='collection-item waves-effect'> " + world.displayName + " </a></div>");
    //     }
    // }

    // if (data != null && data.name != null) {

    //     let imgHTML;
    //     let isWorld;
    //     let iconSize = 30;
    //     if (data.icon != null) {
    //         let iconURL = mapConfig.iconPath + "/" + data.icon + ".png";
    //         iconURL = iconURL.replace("//", "/"); // bypass bug doubling forward slashes for some reason
    //         imgHTML = "<img class='circle' src="+iconURL+" width='"+iconSize+"' height='"+iconSize+"'></img>";
    //     } else {
    //         if (data.icon == null && data.description == null) {
    //             imgHTML = "<i class='small material-icons circle'>public</i>";
    //             isWorld = true;
    //         } else {
    //             imgHTML = "<i class='small material-icons circle'>location_on</i>";
    //         }
    //     }

    //     let nameHTML = "";

    //     if (isWorld) { nameHTML += "<b>" }
    //     nameHTML += data.name;
    //     if (isWorld) { nameHTML += "</b>" }

    //     if (data.description != null && gamemap.hasMultipleWorlds()) {
    //         nameHTML += "<br><small style='color: var(--text_low_emphasis);'>"+ data.description + "</small>";
    //     }

    //     if (isWorld && !gamemap.hasMultipleWorlds()) {
    //         return "";
    //     }

    //     return ("<div class='collection'><a onclick='gotoWorld("+data.destinationID+")' class='collection-item search-item avatar waves-effect'> " + imgHTML + nameHTML + "</a></div>");

    // }


    // callbacks
    function onSearchQueryChanged(query, searchCurrentWorld) {
        // update search query
        searchQuery = query;

        print(searchQuery);

        // do search
    }

    function onSearchFocused(event, isFocused) {

        if (event.type == "blur" || event.type == "mousedown") {
            let searchPane = document.querySelector('#search_pane');
            let target = (event.relatedTarget != null) ? event.relatedTarget : event.explicitOriginalTarget;
            let isInsideSearchPane = searchPane !== target && searchPane.contains(target);

            // if pin search is false:
            searchFocused = isInsideSearchPane;
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

    }

    function clearSearch() { searchBox.value = ""; onSearchQueryChanged("", false) }
    window.addEventListener('mousedown', function(e) { onSearchFocused(e, null); });
</script>

<markup>
    <div id="search_pane">
        <div id="search_container">
            <!-- Search bar -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div id='searchbar' class="waves-effect" class:fullPane={showSearchPane} on:click={() => (searchBox.focus())}>

                <!-- Magnifying glass icon -->
                <div id="search_icon">
                    <Icon name="search"></Icon>
                </div>

                <!-- Searchbox -->
                <div id='searchbox_container'>
                    <input id='searchbox' type='search' placeholder="Where would you like to go?" maxlength='100' style="border-bottom: none !important; box-shadow: none !important;" autocomplete='off' on:focus={(e) => onSearchFocused(e, true)} on:blur={(e) => onSearchFocused(e, false)} bind:this={searchBox} bind:value={searchQuery} on:input={() => onSearchQueryChanged(searchBox.value, false)}/>
                </div>

                <!-- Clear search button -->
                {#if searchQuery.length > 0 && searchBox.value != ""}
                    <IconButton icon="close" tooltip="Clear the current search" on:click={clearSearch}></IconButton>
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
                        <b style="font-size: 1.0rem;" class="waves-effect" on:click={() => expandOptions = !expandOptions}>Search options <Icon name={(expandOptions) ? "expand_less" : "expand_more"} size="tiny"></Icon></b><br>

                        {#if expandOptions}
                            <label class="waves-effect" style="width: 100%; padding-top: 8px;">
                                <input id="search_current_map_checkbox" type="checkbox" class="filled-in" onchange="updateSearch($('#searchbox').val(), this.checked);" />
                                <span>Pin search window</span>
                            </label>

                            <label class="waves-effect" style="width: 100%; padding-top: 8px;">
                                <input id="search_current_map_checkbox" type="checkbox" class="filled-in" onchange="updateSearch($('#searchbox').val(), this.checked);" />
                                <span>Only show results from this map</span>
                            </label>
                        {/if}

                        <hr id="search_divider" class="banishdefault">
                    </div>

                    <!-- Search Results -->
                    <div id="search_results" class='search_results'>
                        <!-- search results go here-->
                    </div>
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
        z-index: var(--zindex_overlay);
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
        max-height: 80vh;
        padding-bottom: var(--padding_minimum);
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
    #search_box {
        margin-top: -1.1%;
        width: 100%;
        height: 100%;
        position: relative;
        padding-left: 5px;
        align-self: stretch;
        outline: none;
        background-color: transparent;
        font-size: 1.5em;
    }

    #search_content_container.fullPane {
        background-color: var(--surface) !important;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
    }

    /* Search options */
    #search_options {
        padding-top: var(--padding_large);
        padding: var(--padding_small);
        border-radius: var(--padding_small);
        background-color: var(--surface);
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
    }
    #search_options.fullPane {
        box-shadow: none;
    }

    .search-item {
        font-size: 14px;
    }

    #search_progress_bar {
        top: -2px;
    }

    /* Search results */
    #search_results_container {
        overflow-x: hidden;
        overflow-y: auto;
    }
</style>

<!-- Global key listener -->
<svelte:window on:keydown={onKeyPressed}/>