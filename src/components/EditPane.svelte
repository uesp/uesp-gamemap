<!-- @component
### Description
 UESP gamemap edit panel.

### Author(s)
- Thal-J <thal-j@uesp.net> (6th March, 2023) -->

<script>
    // import svelte core stuff
    import { fade } from 'svelte/transition';
    import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
    import VirtualList from 'svelte-tiny-virtual-list';

    // import ui components
    import AppBar from './AppBar.svelte';
    import Button from './Button.svelte';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import ListItem from './ListItem.svelte';
    import Icon from './Icon.svelte';
    import EditorComponent from './Editor.svelte';

    // import data classes
    import World from "../map/objects/world";
    import Location from "../map/objects/location"

    // constants
    let PANEL_WIDTH = getPrefs("editpanelwidth", 480);
    const ANIMATION_DURATION = 350;
    const RESIZE_OBSERVER = new ResizeObserver(() => { window.dispatchEvent(new Event('resize'));});
    const TWEEN = tweened(0, {duration: ANIMATION_DURATION, easing: cubicInOut } );

    // state vars
    export let isShown = false;
    let editPanelContent;
    let editPanel;
    let recentChanges = [];
    let overlay = null;
    $: editObject = null;
    let directEdit = null;
    let unsavedChanges = false;
    $: isEditing = editObject != null && (editObject instanceof Location) || (editObject instanceof World);

    // public function to show/hide the panel, or edit an object
    export function show(data) {

        // set edit data
        data = (data == null) ? true : data;

        if (data) {

            // determine whether we are directly editing an object, or just editing from RC
            if (directEdit == null) {
                if (!isShown && data) {
                    if (data == true) {
                        directEdit = false;
                    } else if (data != true) {
                        directEdit = true;
                    }
                }
                print("direct edit is: "+directEdit);
            }

            isShown = true;
            setTimeout(function() {
                RESIZE_OBSERVER.observe(editPanel);
                TWEEN.set(1);
                if (recentChanges.length == 0) {
                    getRecentChanges();
                }
            }, 1);

            // check if current edit object is null
            if (editObject == null) {
                editObject = data;
            } else {
                // are you sure you want to lose progress?
                editObject = data;
            }

        } else {
            isShown = false;
            directEdit = null;
            editObject = null;
        }

    }

    function addNewLocation(locType) {
        overlay = locType;
        gamemap.addNewLocation(locType);
    }

    function cancelNewLocation() {
        overlay = null;
        gamemap.getMapObject().pm.disableDraw();
        gamemap.setMapLock(MAPLOCK.NONE);
    }

    export function edit(object) { show(object) }
    export function dismiss() { show(false) }

    function onBackPressed() {
        if (isEditing) {
            if (directEdit) {
                print("should be being dismissed")
                dismiss();
            } else {
                editObject = null;
            }
        } else {
            dismiss();
        }
    }

    function getRecentChanges() {

        print("getting recent changes...")
        recentChanges = [];
    	let queryParams = {};
    	queryParams.action = "get_rc";
    	queryParams.db = gamemap.getMapConfig().database;

        getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {
            if (!error && data?.recentChanges) {
                // recent changes item object
                let RecentChangesItem = class {
                    constructor(data) {
                        this.icon = (data.icon != 0) ? data.icon : null //iconType || null;
                        this.editID = data.editID; //id
                        this.user = data.user //editUserText;
                        this.timestamp = data.timestamp //editTimestamp;
                        this.locationName = data.locationName; // locationName
                        this.destinationID = data.destinationID //worldHistoryId != 0 ? worldId : -locationId;
                        this.worldID = data.worldID //worldId;
                        this.worldName = data.worldName //worldDisplayName;
                        this.comment = data.comment // editComment;
                        this.action = data.action // editAction;
                    }
                };

                print("parsing data...");
                let tempList = [];
                for (let i = 0; i < data.recentChanges.length; i++) {
                    let change = data.recentChanges[i];
                    let destinationID = (change.worldHistoryId != 0) ? change.worldId : -change.locationId;
                    let changeItem = new RecentChangesItem({
                        icon: change.iconType,
                        editID: change.id,
                        user: change.editUserText,
                        timestamp: change.editTimestamp,
                        locationName: change.locationName,
                        destinationID: destinationID,
                        worldID: change.worldId,
                        worldName: change.worldDisplayName,
                        comment: change.editComment,
                        action: change.editAction,
                    })
                    tempList.push(changeItem);
                }
                recentChanges = tempList;

                print("got recent changes: ");
                print(recentChanges);

            }
		});
    }

    // slide out animation
    function slideOut() {
        TWEEN.set(0);
        gamemap.getMapObject().invalidateSize();
        print($TWEEN);
        return { ANIMATION_DURATION, css: () => `width: ${$TWEEN * PANEL_WIDTH}`};
    }

    // handle resizing the edit pane
    function onResizerDown() { document.addEventListener('mousemove', onResizerDrag);}
    function onResizerUp() { document.removeEventListener('mousemove', onResizerDrag); }
    function onResizerDrag(event) {
        let width = (window.innerWidth - event.pageX + 150);
        width = (width < 350) ? 350 : width;
        editPanel.style.width = width + "px";
        setPrefs("editpanelwidth", width); // save user's edit panel width preference
        PANEL_WIDTH = getPrefs("editpanelwidth", 480);
    }
</script>

<markup>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore missing-declaration -->
    {#if isShown}
         <aside id="edit-panel" bind:this={editPanel} style="width: {$TWEEN * PANEL_WIDTH}px;" out:slideOut>
             <!-- editing overlay (for adding paths, areas etc) -->
             {#if overlay}
                {@const locType = Object.keys(LOCTYPES).find(key => LOCTYPES[key] === overlay)}
                 <div id="edit-overlay" in:fade|local={{ duration: 100 }}>
                    <b class="subheading">Adding {locType.toSentenceCase()}</b>
                    <p style="color: white; text-align: center; margin: 12px;">Begin adding your {locType.toLowerCase()} to the map.</p>
                    <div id="arrow_container">
                        <div class="arrow">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                    <div style="display: flex; gap: var(--padding_medium); padding-top: 6px;">
                        <Button text="Cancel" icon="close" flat={true} on:click={cancelNewLocation}></Button>
                    </div>
                 </div>
             {/if}

             <!-- resize handle for resizing window -->
             <div id="window-resizer" on:mousedown={onResizerDown}/>

             <!-- edit panel appbar -->
             <AppBar title={!isEditing ? "Map Editor" : ((unsavedChanges) ? "* " : "") + "Editing " + ((editObject instanceof World) ? "World" : "Location")} subtitle={isEditing ? (editObject instanceof World) ? editObject.displayName + " ("+editObject.name+")" : editObject.name : null}
             icon={isEditing && !directEdit ? "arrow_back" : "close"} on:backClicked={onBackPressed} tooltip={unsavedChanges ? "You have unsaved changes" : null}/>

             <!-- edit panel content -->
             <div id="edit-panel-content" in:fade={{duration: ANIMATION_DURATION / 2}} out:fade={{duration: ANIMATION_DURATION / 2}} bind:this={editPanelContent} class:isEditing={isEditing}>

                {#if !isEditing}
                     <b>Actions</b><br/>
                     <div id="actions-container">
                         <Button text="Add Marker" icon="add_location_alt" on:click={() => addNewLocation(LOCTYPES.MARKER)}></Button>
                         <Button text="Add Area" icon="local_hospital" on:click={() => addNewLocation(LOCTYPES.AREA)}></Button>
                         <Button text="Add Path" icon="timeline" on:click={() => addNewLocation(LOCTYPES.PATH)}></Button>
                         <Button text="Edit World" icon="public" on:click={() => (edit(gamemap.getCurrentWorld()))}></Button>
                     </div>
                     <b>Recent Changes</b>
                     <div id="refresh-button" title="Refresh the Recent Changes list" class="waves-effect" on:click={getRecentChanges}><Icon name="refresh" size=20/></div>
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
                                     <ListItem title={(isWorld) ? RCItem.worldName : RCItem.locationName}
                                               subtitle={(!isWorld) ? RCItem.worldName : null}
                                               destinationID={RCItem.destinationID}
                                               compact={true}
                                               bold={isWorld}
                                               icon={(RCItem.icon != null) ? gamemap.getMapConfig().iconPath + RCItem.icon + ".png" : (isWorld) ? "public" : "location_on"}
                                               user={RCItem.user}
                                               timestamp={RCItem.timestamp}
                                               action={RCItem.action}
                                               comment={RCItem.comment}
                                      on:click={() => gamemap.goto(RCItem.destinationID)} />
                                 </div>
                             </VirtualList>
                         {:else}
                             <LoadingSpinner/>
                         {/if}
                     </div>
                {:else}
                     <EditorComponent data={editObject} bind:unsavedChanges={unsavedChanges} on:cancel={onBackPressed} on:loaded={() => overlay = null}/>
                {/if}
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
        display: flex;
        flex-direction: column;
    }

    #edit-overlay {
        background-color: rgba(0, 0, 0, 0.70);
        width: 100%;
        height: 100%;
        position: absolute;
        pointer-events: all;
        z-index: 999999999999; /* i know, this is stupid */
        display: flex;
        justify-content: center;
        align-content: center;
        align-items: center;
        text-shadow: 0px 0px 5px var(--background) !important;
        flex-direction: column;
    }

    .subheading {
        color: var(--highlight_light);
        font-size: x-large;
    }

    #edit-panel-content {
        padding: var(--padding_minimum);
        height: 100%;
    }

    #edit-panel-content.isEditing {
        padding-top: 0;
        padding-right: 0;
        padding-left: 0;
    }

    b {
        font-size: 15px;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
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

    #window-resizer {
        position: absolute;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
        z-index: 9999999;
        transition: background-color ease 150ms;
    }

    #window-resizer:hover {
        background-color: var(--shadow);
    }


    .arrow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        transform: rotate(90deg);
        cursor: pointer;
    }

    #arrow_container {
        position: relative;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .arrow span {
        display: block;
        width: 1.1rem;
        height: 1.1rem;
        border-bottom: 5px solid white;
        border-right: 5px solid white;
        transform: rotate(45deg);
        margin: -10px;
        animation: animate 2s infinite;
    }

    .arrow span:nth-child(2) {
        animation-delay: -0.2s;
    }

    .arrow span:nth-child(3) {
        animation-delay: -0.4s;
    }

    @keyframes animate {
        0% {
            opacity: 0;
            transform: rotate(45deg) translate(-20px, -20px);
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: rotate(45deg) translate(20px, 20px);
        }
    }

</style>
<svelte:options accessors/>
<svelte:window on:resize={() => { if (editPanel != null) { editPanelContent.style.height = document.querySelector('.appbar') ? editPanel.clientHeight - document.querySelector('.appbar').clientHeight + "px" : null }}} on:mouseup={onResizerUp}/>