<!-- @component
### Description
 UESP gamemap edit panel.

### Author(s)
- Thal-J <thal-j@uesp.net> (6th March, 2023) -->

<script>

    // import svelte core stuff
    import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
    import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
    import VirtualList from 'svelte-tiny-virtual-list';

    // import ui components
    import AppBar from './AppBar.svelte';
    import Button from './Button.svelte';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import ListItem from './ListItem.svelte';
    import Icon from './Icon.svelte';

    // constants
    const PAGE = { HOME : 0, EDIT_WORLD : 1, EDIT_LOCATION : 2 }
    const OVERLAY = { NONE : 0, LOCATION : 2, PATH : 3, AREA : 4}
    const PANEL_WIDTH = 480;
    const ANIMATION_DURATION = 350;
    const TWEEN = tweened(0, {duration: ANIMATION_DURATION, easing: cubicInOut } );

    // state vars
    let editPanel;
    let appBar;
    $: currentPage = PAGE.HOME;
    $: currentOverlay  = OVERLAY.NONE;
    export let isShown = false;
    let unsavedChanges = false;
    let recentChanges = [];
    const resizeObserver = new ResizeObserver(() => { window.dispatchEvent(new Event('resize'));});

    // public function to show/hide the panel, or edit an object
    export function show(data) {

        data = (data == null) ? true : data;

        if (data) {
            isShown = true;

            setTimeout(function() {
                resizeObserver.observe(editPanel);
                TWEEN.set(1);
                if (recentChanges.length == 0) {
                    getRecentChanges();
                }
		    }, 1);

            // call resize event whenever edit panel is resized


            // if (object instanceof Location) {

            // } else if (object instanceof World) {

            // }

        } else {
            isShown = false;
        }

    }
    export function edit(object) { show(object) }
    export function dismiss() { show(false) }

    function gotoPage(page, data) {
        currentPage = page;
    }

    function onBackPressed() {

        switch (currentPage) {
            default:
            case PAGE.HOME && !unsavedChanges:
                dismiss();
                break;
            case PAGE.EDIT_LOCATION && !unsavedChanges:
                currentPage = PAGE.HOME;
                break;
            case PAGE.EDIT_WORLD && !unsavedChanges:
                currentPage = PAGE.HOME;
                break;
        }

    }



    function getRecentChanges() {

        print("getting recent changes...")
        recentChanges = [];
    	let queryParams = {};
    	queryParams.action = "get_rc";
    	queryParams.db = gamemap.getMapConfig().database;

        getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {
            if (!error && data != null && data.recentChanges != null) {

                // recent changes item object
                let RecentChangesItem = class {
                    constructor(icon, editID, user, timestamp, locationName, destinationID, worldID,
                                worldName, comment, action) {
                        this.icon = (icon != 0) ? icon : null //iconType || null;
                        this.editID = editID; //id
                        this.user = user //editUserText;
                        this.timestamp = timestamp //editTimestamp;
                        this.locationName = locationName; // locationName
                        this.destinationID = destinationID //worldHistoryId != 0 ? worldId : -locationId;
                        this.worldID = worldID //worldId;
                        this.worldName = worldName //worldDisplayName;
                        this.comment = comment // editComment;
                        this.action = action // editAction;
                    }
                };

                print("parsing data...");
                let tempList = [];
                for (let i = 0; i < data.recentChanges.length; i++) {
                    let change = data.recentChanges[i];
                    let destinationID = (change.worldHistoryId != 0) ? change.worldId : -change.locationId;
                    let changeItem = new RecentChangesItem(change.iconType, change.id, change.editUserText,
                                                           change.editTimestamp, change.locationName, destinationID,
                                                           change.worldId, change.worldDisplayName, change.editComment,
                                                           change.editAction);
                    tempList.push(changeItem);
                }
                recentChanges = tempList;

                print("got recent changes: ");
                print(recentChanges);

            }
		});
    }

    // slide out animation
    function slideOut() { TWEEN.set(0);
        gamemap.getMapObject().invalidateSize();
        return { ANIMATION_DURATION, css: () => `width: ${$TWEEN * PANEL_WIDTH}`};
    }
</script>


<markup>
    {#if isShown}
         <aside id="edit-panel" bind:this={editPanel} style="width: {$TWEEN * PANEL_WIDTH}px;" out:slideOut>

             <!-- editing overlays (for adding paths, areas etc) -->
             {#if currentOverlay != OVERLAY.NONE}
                 <div id="edit-overlay">



                 </div>
             {/if}

             <!-- edit panel appbar -->
             <AppBar title="Map Editor" icon={currentPage != PAGE.HOME ? "arrow_back" : "close"} on:backClicked={onBackPressed} bind:this={appBar}/>

             <!-- edit panel content -->
             <div id="edit-panel-content" in:fade={{duration: ANIMATION_DURATION / 2}} out:fade={{duration: ANIMATION_DURATION / 2}}>

                 <b>Actions</b><br/>
                 <div id="actions-container">
                     <!-- svelte-ignore missing-declaration -->
                     <Button text="Edit World" icon="public" on:click={() => (gotoPage(PAGE.EDIT_WORLD, gamemap.getCurrentWorld()))}></Button>
                     <Button text="Add Location" icon="add_location_alt"></Button>
                     <Button text="Add Path" icon="timeline"></Button>
                     <Button text="Add Area" icon="local_hospital"></Button>
                 </div>
                 <b>Recent Changes</b>
                 <!-- svelte-ignore a11y-click-events-have-key-events -->
                 <div id="refresh-button" title="Refresh the Recent Changes list" class="waves-effect" on:click={getRecentChanges}><Icon name="refresh"/></div>
                 <div id="recent-changes-container">
                     {#if recentChanges.length > 0}
                         <VirtualList
                             width="100%"
                             height={window.innerHeight - 60}
                             itemCount={recentChanges.length}
                             scrollToIndex={1}
                             itemSize={60}>
                             <div slot="item" let:index let:style {style}>
                                 {@const RCItem = recentChanges[index]}
                                 {@const isWorld = RCItem.destinationID > 0}
                                 <!-- svelte-ignore missing-declaration -->
                                 <ListItem title={(isWorld) ? RCItem.worldName : RCItem.locationName} subtitle={(!isWorld) ? RCItem.worldName : null} destinationID={RCItem.destinationID} compact={true} bold={isWorld}
                                  icon={(RCItem.icon != null) ? gamemap.getMapConfig().iconPath + RCItem.icon + ".png" : (isWorld) ? "public" : "location_on"} user={RCItem.user} timestamp={RCItem.timestamp}
                                  on:click={() => gamemap.goto(RCItem.destinationID)} action={RCItem.action} comment={RCItem.comment}/>
                             </div>
                         </VirtualList>
                     {:else}
                         <LoadingSpinner/>
                     {/if}
                 </div>

             </div>
         </aside>
    {/if}
</markup>


<style>
    #edit-panel {
        background-color: var(--surface);
        width: 0px;
        height: 100%;
        z-index: 100;
        position: relative;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
    }

    #edit-overlay {
        background-color: rgba(0, 0, 0, 0.65);
        width: 100%;
        height: 100%;
        position: absolute;
        pointer-events: all;
        z-index: 5;
        display: none;
    }

    #edit-panel-content {
        padding: var(--padding_minimum);
        height: 100%;
    }

    b {
        font-size: 16px;
    }

    #actions-container {
        padding-top: 4px;
        padding-bottom: 6px;
        display: flex;
        flex-wrap: wrap;
    }

    #refresh-button {
        float: right;
    }

    #recent-changes-container {
        height: 100%;
        display: inline-block;
        width: 100%;
    }

</style>
<svelte:options accessors/>