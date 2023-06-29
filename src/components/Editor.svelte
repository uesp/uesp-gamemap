<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- @component
### Description
 Map editor component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (6th March, 2023) -->

<script>
    // import core svelte stuff
    import { fade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
    import { fly } from 'svelte/transition';
    import { onMount } from 'svelte';
    import VirtualList from 'svelte-tiny-virtual-list';

    // import data classes
    import World from "../map/world";
    import Location from "../map/location";

    // import ui components
    import AppBar from './AppBar.svelte';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import ListItem from './ListItem.svelte';
    import Icon from './Icon.svelte';
    import Button from "./Button.svelte";
    import Textbox from "./Textbox.svelte";
    import FormGroup from "./FormGroup.svelte";
    import InfoTextPair from "./InfoTextPair.svelte";
    import DropdownMenu from "./DropdownMenu.svelte";
    import Switch from "./Switch.svelte";
    import ColourPicker from "./ColourPicker.svelte";
    import AvatarComponent from "./AvatarComponent.svelte";
    import ColourPreview from "./ColourPreview.svelte";

    // constants
    let PANEL_WIDTH = getPrefs("editpanelwidth", 480);
    const ANIMATION_DURATION = 350;
    const RESIZE_OBSERVER = new ResizeObserver(() => { window.dispatchEvent(new Event('resize'));});


    // state vars
    export let shown = false; // whether the editor panel is visible

    let editPanel;
    let editPanelContent;
    let editor;
    let editorWindow;
    let overlay = null;
    let saveButton;
    let refreshButton;
    let innerHeight;

    let recentChanges = [];
    let currentZoom = gamemap.getCurrentZoom().toFixed(3);

    let liveEdit = false;
    let directEdit = null;
    let unsavedChanges = false;
    let hasBeenModified = false;
    let editObject = null;
    let modEditObject = null;
    $: isLocation = editObject instanceof Location;
    $: isWorld = editObject instanceof World;
    $: objectType = isWorld ? "World" : "Location";
    $: isEditing = editObject && isLocation || isWorld;
    $: linkWikiPage = editObject?.wikiPage == editObject?.name || editObject?.wikiPage == editObject?.displayName;

    $: { // prevent leaving the page on unsaved changes
        if (unsavedChanges || editObject?.unsavedLocation) {
            window.onbeforeunload = function() { return "" };
        } else {
            window.onbeforeunload = null;
        }
    }

    /*================================================
                        Editor Panel
    ================================================*/

    // public functions to show/hide the panel, or edit an object
    export function edit(object) { show(object); overlay = null; }
    export function dismiss() { show(false) }
    export function show(data) {

        // set edit data
        data = (data == null) ? true : data;
        if (data) {

            // determine whether we are directly editing an object, or editing from recent changes
            if (directEdit == null) {
                if (!shown && data) {
                    if (data == true) {
                        directEdit = false;
                    } else if (data != true) {
                        directEdit = true;
                    }
                }
                print("direct edit is: "+directEdit);
            }

            shown = true;
            setTimeout(function() { RESIZE_OBSERVER.observe(editPanel); if (recentChanges.length == 0) { getRecentChanges() } }, 1);

            // check if current edit object is null
            if (data != true && editObject == null) {
                initEditor(data);
            } else if (editObject) {
                print(editObject);
                // TODO: are you sure you want to lose progress?
                print("we should be overwriting current data here")
            }

        } else {
            shown = false;
            editObject = null;
            directEdit = null;
        }

    }

    function addNewLocation(locType) {
        overlay = locType;
        gamemap.addLocation(locType);
    }

    function onBackPressed() {
        window.onbeforeunload = null;
        if (isEditing) {
            if (directEdit) {
                print("should be being dismissed")
                dismiss();
            } else {
                cancel();
            }
        } else {
            dismiss();
        }
    }

    /*================================================
					  Editor Window
    ================================================*/

    // initalise editor
    function initEditor(data) {

        // begin editing provided data
        unsavedChanges = false;
        editObject = Object.assign(Object.create(Object.getPrototypeOf(data)), data);
        modEditObject = Object.assign(Object.create(Object.getPrototypeOf(data)), data);
        isLocation = editObject instanceof Location;
        isWorld = editObject instanceof World;

        // do state changes to map
        if (isWorld && editObject.id == gamemap.getCurrentWorld().id) {
            gamemap.reset(true, 30); // zoom out world map
            gamemap.setMapLock(MAPLOCK.FULL); // lock the world map
            gamemap.mapRoot.classList.add("editing"); // add editing effect
        } else if (isLocation) {
            print("being called to edit location")
            liveEdit = true;
            gamemap.setMapLock(modEditObject.isPolygon() ? MAPLOCK.PARTIAL_POLYGON : MAPLOCK.PARTIAL_MARKER);
            editObject.setEditing(true);
            modEditObject.setEditing(true);
            gamemap.updateLocation(modEditObject);
        }

    }

    function doDelete(doConfirm) {
        doConfirm = (doConfirm != null) ? doConfirm : false;
        if (!doConfirm) {
            // visually delete location from the map
            print("deleting object...");
            gamemap.deleteLocation(modEditObject);
            let query = queryify(objectify(modEditObject.getDeleteQuery()));
            // do async api request to actually delete the location
            getJSON(GAME_DATA_SCRIPT + query, () => { getRecentChanges();});
            cancel();
        } else {
            alert("warning !! you are deleting a location! this cant be undone!")
        }

    }

    function doSave() {

        print("saving object...");
        print(editObject)
        print(modEditObject)

        let queryParams = objectify(modEditObject.getSaveQuery());
        let query = (GAME_DATA_SCRIPT + queryify(queryParams)).replace(/=\s*$/, "");
        saveButton.$set({ text: "Saving...", icon: "loading" });

        print(query);
        getJSON(query, function(error, data) {

            if (!error && data) {
                if (!data?.isError) {
                    // modify location with new attributes if available
                    if (modEditObject?.unsavedLocation) {
                        modify("unsavedLocation", false);
                        modify("id", data.newLocId);
                    }
                    modify("revisionID", data?.newRevisionId);
                    if (isLocation) { gamemap.updateLocation(modEditObject) }

                    // tell ui that we're done saving
                    saveCallback();

                    // overwrite existing object with deep clone of modified one
                    editObject = Object.assign(Object.create(Object.getPrototypeOf(modEditObject)), modEditObject);
                    unsavedChanges = false;
                } else {
                    print(data.errorMsg);
                    saveCallback((data.errorMsg.includes("permissions")) ? "Insufficient permissions!" : data.errorMsg);
                }

            } else {
                saveCallback(`Error saving ${objectType}!`);
            }
        });

        function saveCallback(error) {

            if (error == null) {
                saveButton.$set({ text: "Done!", icon: "done" });
                getRecentChanges();
            } else {
                saveButton.$set({ text: error, icon: "warning" });
            }

            setTimeout(function() {
                if (saveButton.icon == "done" || saveButton.icon == "warning") {
                    saveButton.$set({ text: "Save", icon: "save" });
                }
            }, (!error) ? 1500 : 2500);
        }
    }

    // cancel editing
    function cancel() {

        // clean up
        if (isWorld) {
            gamemap.reset(true);
            Array.from(document.querySelectorAll("[class*='editing']")).forEach(element => { element.classList.remove("editing"); })
        } else if (isLocation) { // if it was an unadded location, delete it
            editObject.setEditing(false);
            if (editObject?.unsavedLocation) {
                gamemap.deleteLocation(editObject)
            } else { // else revert to how it was, if it still exists
                if (gamemap.getCurrentWorld().locations.get(editObject.id)) {
                    gamemap.updateLocation(editObject);
                }
            }
        }

        // turn off editing
        overlay = null;
        editObject = null;
        modEditObject = null;
        liveEdit = false;
        hasBeenModified = false;
        unsavedChanges = false;
        gamemap.setMapLock(MAPLOCK.NONE);
        gamemap.getMapObject().pm.disableDraw();
        gamemap.getMapObject().pm.disableGlobalEditMode();

        // weird hack to stop recent changes list being wrong size
        setTimeout(() => {
            let oldRecentChanges = recentChanges;
            recentChanges = [];
            recentChanges = oldRecentChanges;
        }, 0)
    }

    // received updated marker coords from gamemap (via drag and dropping)
    window.updateMarkerCoords = function updateMarkerCoords(coords) {
        print(coords)
        modify("coords", coords);
    }

    let timer;
    const DEBOUNCE_AMOUNT = 75;
    function modify(property, value) {
        if (liveEdit) {
            // update svelte reactivity
            modEditObject[property] = value;
            modEditObject = modEditObject;
            editObject = editObject;

            print("before edit");
            print(editObject);
            print("after edit");
            print(modEditObject);

            // are there any unsaved changes
            unsavedChanges = !(JSON.stringify(modEditObject) === JSON.stringify(editObject));
            hasBeenModified = (unsavedChanges) ? true : hasBeenModified;

            if (isLocation) {

                gamemap.setMapLock(modEditObject.isPolygon() ? MAPLOCK.PARTIAL_POLYGON : MAPLOCK.PARTIAL_MARKER);

                if (hasBeenModified) {
                    // editing debouncing
                    if (timer != null){
                        clearTimeout(timer);
                    }
                    timer = setTimeout(() => {
                        // redraw location with new changes
                        gamemap.updateLocation(modEditObject);
                    }, DEBOUNCE_AMOUNT)
                }

            }
        }
    }

    // handle resizing the editor panel
    function onResizerDown() { document.addEventListener('mousemove', onResizerDrag);}
    function onResizerUp() { document.removeEventListener('mousemove', onResizerDrag); }
    function onResizerDrag(event) {
        let width = (window.innerWidth - event.pageX + 150);
        width = (width < 350) ? 350 : width;
        editPanel.style.width = width + "px";
        setPrefs("editpanelwidth", width); // save user's edit panel width preference
        PANEL_WIDTH = getPrefs("editpanelwidth", 480);
    }

    // slide in/out animation
    function slide() {
        gamemap.getMapObject().invalidateSize();
        return {
            duration: ANIMATION_DURATION,
            easing: cubicInOut,
            css: (t) => {
                if (t == 1) { editPanel.style.width = `${PANEL_WIDTH}px`;}
                return `width: ${PANEL_WIDTH * t}px; opacity: ${t};)`;
            }
        }
    }

    // get recent changes function
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

    // on editor load
	onMount(async() => { window.onpopstate = () => currentZoom = gamemap.getCurrentZoom().toFixed(3);});
    function fixEditor() {editor.style.height = `${editor?.parentElement?.clientHeight}px`; editorWindow.scrollTop = 0;}
</script>

<markup>
    {#if shown}
         <aside id="edit-panel" bind:this={editPanel} in:slide|global out:slide|global>
             {#if overlay} <!-- editing overlay (for adding paths, areas etc) -->
                {@const locType = Object.keys(LOCTYPES).find(key => LOCTYPES[key] === overlay)}
                 <div id="edit-overlay" in:fade={{ duration: 100 }}>
                    <b class="subheading">Adding {locType.toSentenceCase()}</b>
                    <p style="color: white; text-align: center; margin: 12px;">Begin adding your {locType.toLowerCase()} to the map.</p>
                    <div id="arrow_container">
                        <div class="arrow"><span></span><span></span><span></span></div>
                    </div>
                    <div style="display: flex; gap: var(--padding_medium); padding-top: 6px;">
                        <Button text="Cancel" icon="close" flat={true} on:click={cancel}></Button>
                    </div>
                 </div>
             {/if}

             <!-- resize handle for resizing window -->
             <div id="window-resizer" on:mousedown={onResizerDown}/>

             <!-- edit panel appbar -->
             <AppBar title={!isEditing ? "Map Editor" : ((modEditObject.id > 0) ? "Editing" : "Adding") + " " + ((editObject instanceof World) ? "World" : "Location")}
                subtitle={isEditing ? (isWorld) ? editObject.displayName + " ("+editObject.name+")" : editObject.name : null} unsavedChanges={unsavedChanges}
                icon={isEditing && !directEdit ? "arrow_back" : "close"} on:back={onBackPressed} tooltip={unsavedChanges ? "You have unsaved changes" : null}
             />

             <!-- edit panel content -->
             <div id="edit-panel-content" bind:this={editPanelContent} class:isEditing={isEditing}>
                {#if !isEditing}
                     <b>Actions</b><br/>
                     <div id="actions-container">
                         <Button text="Add Marker" icon="add_location_alt" on:click={() => addNewLocation(LOCTYPES.MARKER)}></Button>
                         <Button text="Add Area" icon="local_hospital" on:click={() => addNewLocation(LOCTYPES.AREA)}></Button>
                         <Button text="Add Path" icon="timeline" on:click={() => addNewLocation(LOCTYPES.PATH)}></Button>
                         <Button text="Edit World" icon="public" on:click={() => (edit(gamemap.getCurrentWorld()))}></Button>
                     </div>
                     <b>Recent Changes</b>
                     <div id="refresh-button" title="Refresh the Recent Changes list" class="waves-effect" on:click={getRecentChanges} bind:this={refreshButton}><Icon name="refresh" size=20 /></div>
                     <div id="recent-changes-container">
                        {#key recentChanges}
                            {#if recentChanges.length > 0}
                                <VirtualList
                                    width="100%"
                                    height={innerHeight - (refreshButton?.getBoundingClientRect()?.bottom + 8)}
                                    itemCount={recentChanges.length}
                                    scrollToIndex={1}
                                    itemSize={60}>
                                    <div slot="item" let:index let:style {style}>
                                        {@const data = recentChanges[index]}
                                        {@const isWorld = data.destinationID > 0}
                                        <ListItem title={(isWorld) ? data.worldName : data.locationName}
                                                subtitle={(!isWorld) ? data.worldName : null}
                                                destinationID={data.destinationID}
                                                compact={true}
                                                bold={isWorld}
                                                icon={(data.icon != null) ? gamemap.getMapConfig().iconPath + data.icon + ".png" : (isWorld) ? "public" : "location_on"}
                                                user={data.user}
                                                timestamp={data.timestamp}
                                                action={data.action}
                                                comment={data.comment}
                                        on:click={() => gamemap.goto(data.destinationID)} />
                                    </div>
                                </VirtualList>
                            {:else}
                                <LoadingSpinner/>
                            {/if}
                        {/key}
                     </div>
                {:else}
                    <div id="editor" in:fixEditor out:cancel bind:this={editor}>
                        <div class="editor_window" bind:this={editorWindow}>
                            <div id="editor_pane">
                                <FormGroup title="General" icon="description">

                                    <header class="header">
                                        <AvatarComponent icon={modEditObject.icon} locType={modEditObject.locType} isWorld={isWorld} on:change={(e) => modify("icon", e.detail)}>
                                            <!-- Name -->
                                            <Textbox
                                                text={isWorld ? modEditObject.displayName : modEditObject.name }
                                                hint={(isWorld ? "Display " : "") + "Name"}
                                                tooltip="User facing {objectType} name"
                                                on:change={(e) => {
                                                    if (linkWikiPage) {
                                                        modify("wikiPage", e.detail)
                                                    }
                                                    modify(isWorld ? "displayName" : "name", e.detail)
                                                }}>
                                            </Textbox>

                                            <!-- Parent ID (for World) -->
                                            {#if isWorld}
                                                <Textbox
                                                    hint="Parent ID"
                                                    text={modEditObject.parentID}
                                                    tooltip="Parent world ID"
                                                    type="number"
                                                    subtext={(modEditObject.parentID && !isNaN(modEditObject.parentID) && gamemap.getWorldDisplayNameFromID(modEditObject.parentID)) ? gamemap.getWorldDisplayNameFromID(modEditObject.parentID) : "Invalid World ID!"}
                                                    on:change={(e) => modify("parentID", e.detail)}>
                                                </Textbox>
                                            <!-- Destination ID (for Locations) -->
                                            {:else if isLocation}
                                                {#if modEditObject.locType != LOCTYPES.PATH}
                                                    <Textbox
                                                        hint="Destination ID"
                                                        text={modEditObject.destinationID}
                                                        subtext="+ for world, - for location"
                                                        tooltip="Location/world destination ID"
                                                        type="number"
                                                        on:change={(e) => modify("destinationID", e.detail)}>
                                                    </Textbox>
                                                {/if}
                                            {/if}
                                        </AvatarComponent>

                                    </header>

                                    <!-- Wiki Page -->
                                    <Switch
                                        enabled={linkWikiPage}
                                        expand={!linkWikiPage}
                                        label={"Use " + (isWorld ? "Display Name" : "Name") + " as Wiki Page"}
                                        tooltip={`Use this ${objectType}'s ${(isWorld ? "display name" : "name")} as its wiki page`}
                                        on:change={(e) => {
                                                if (e.detail) {
                                                    modify("wikiPage", isWorld ? modEditObject.displayName : modEditObject.name);
                                                } else {
                                                    modify("wikiPage", null);
                                                }
                                                linkWikiPage = e.detail;
                                        }}>
                                        <Textbox label="Wiki Page"
                                            text={modEditObject.wikiPage}
                                            placeholder="Enter wiki page..."
                                            tooltip="Wiki page name"
                                            on:change={(e) => modify("wikiPage", e.detail)}>
                                        </Textbox>
                                    </Switch>

                                    <!-- Label Direction (for non-line Locations) -->
                                    {#if modEditObject.locType != LOCTYPES.PATH && isLocation}
                                        {@const posIDs = Object.keys(LABEL_POSITIONS)}
                                        {@const posNames = Object.values(LABEL_POSITIONS)}
                                        <DropdownMenu label="Label Direction" hint="Select label direction..." align="right" on:change={(e) => {modify("labelPos", Number(e.detail))}} >
                                            {#each posNames as posName, i}
                                                <option value={posIDs[i]} selected={modEditObject.labelPos == posIDs[i]}>{posName.toSentenceCase()}</option>
                                            {/each}
                                        </DropdownMenu>
                                    {/if}

                                    <!-- Description -->
                                    <Textbox label="Description"
                                            text={modEditObject.description}
                                            placeholder="Enter description..."
                                            tooltip="Description of this {objectType}"
                                            textArea="true"
                                            on:change={(e) => modify("description", e.detail)}>
                                    </Textbox>

                                </FormGroup>

                                <!-- Zoom Levels (for World) -->
                                {#if isWorld}
                                    <FormGroup title="Zoom" icon="zoom_in">
                                        <div class="row">
                                            <Textbox text={modEditObject.minZoomLevel} type="number" hint="Min Zoom" tooltip="Minimum zoom level for this world" on:change={(e) => modify("minZoomLevel", e.detail)} min=0/>
                                            <Textbox text={modEditObject.maxZoomLevel} type="number" hint="Max Zoom" tooltip="Maximum zoom level for this world" on:change={(e) => modify("maxZoomLevel", e.detail)} min=0/>
                                        </div>
                                    </FormGroup>
                                {/if}

                                <!-- World Bounds (for World) -->
                                {#if isWorld}
                                    <FormGroup title="Bounds" icon="crop_free">
                                        <div class="row">
                                            <Textbox text={modEditObject.minX} hint="Minimum X" type="number" hideSpinner={true} on:change={(e) => modify("minX", e.detail)} tooltip="Minimum X bounds for this world"/>
                                            <Textbox text={modEditObject.maxX} hint="Maximum X" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)} tooltip="Maximum X bounds for this world"/>
                                        </div>
                                        <div class="row">
                                            <Textbox text={modEditObject.minY} hint="Minimum Y" type="number" hideSpinner={true} on:change={(e) => modify("minY", e.detail)} tooltip="Minimum Y bounds for this world"/>
                                            <Textbox text={modEditObject.maxY} hint="Maximum Y" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)} tooltip="Maximum Y bounds for this world"/>
                                        </div>
                                    </FormGroup>
                                {/if}

                                <!-- Display Data (for Locations) -->
                                {#if isLocation}
                                    <FormGroup title="Display" icon="light_mode">

                                        {#if modEditObject.isPolygon()}

                                            <ColourPreview data={modEditObject}/>

                                            <!-- only show fill colour for areas -->
                                            {#if modEditObject.locType == LOCTYPES.AREA}
                                                <ColourPicker
                                                    label="Fill Colour"
                                                    colour = {modEditObject.fillColour}
                                                    placeholder="Enter fill colour..."
                                                    tooltip="Default fill colour for this location"
                                                    on:change={(e) => modify("fillColour", e.detail)}>
                                                </ColourPicker>
                                            {/if}

                                            <ColourPicker
                                                label="Stroke Colour"
                                                colour = {modEditObject.strokeColour}
                                                placeholder="Enter stroke colour..."
                                                tooltip="Default stroke colour for this location"
                                                on:change={(e) => modify("strokeColour", e.detail)}>
                                            </ColourPicker>

                                            <!-- only show fill colour for areas -->
                                            {#if modEditObject.locType == LOCTYPES.AREA}
                                                <ColourPicker
                                                    label="Fill Colour (Hover)"
                                                    colour = {modEditObject.fillColourHover}
                                                    placeholder="Enter hovered fill colour..."
                                                    tooltip="Hovered fill colour for this location"
                                                    on:change={(e) => modify("fillColourHover", e.detail)}>
                                                </ColourPicker>
                                            {/if}

                                            <ColourPicker
                                                label="Stroke Colour (Hover)"
                                                colour = {modEditObject.strokeColourHover}
                                                placeholder="Enter hovered stroke colour..."
                                                tooltip="Hovered stroke colour for this location"
                                                on:change={(e) => modify("strokeColourHover", e.detail)}>
                                            </ColourPicker>

                                            <div class="row">
                                                <Textbox text={modEditObject.strokeWidth} label="Stroke Width" hint="" column={true} type="number" on:change={(e) => modify("strokeWidth", e.detail)} tooltip="Default stroke width for this location"/>
                                                <Textbox text={modEditObject.strokeWidthHover} label="Stroke Width (Hover)" hint="" column={true} type="number" on:change={(e) => modify("strokeWidthHover", e.detail)} tooltip="Hovered stroke width for this location"/>
                                            </div>
                                        {/if}

                                        <Textbox label="Display Level"
                                            text={modEditObject.displayLevel}
                                            placeholder="Enter display level..."
                                            tooltip="Zoom level at which this location will appear"
                                            type="number"
                                            subtext={"Current zoom is "+currentZoom}
                                            min={gamemap.getCurrentWorld().minZoomLevel}
                                            max={gamemap.getCurrentWorld().maxZoomLevel}
                                            on:change={(e) => modify("displayLevel", e.detail)}>
                                        </Textbox>

                                    </FormGroup>
                                {/if}

                                <!-- General info -->
                                {#if modEditObject.id > 0}
                                    <FormGroup title="Info" icon="info">
                                        <InfoTextPair name="{objectType.toSentenceCase()} ID" value={modEditObject.id} tooltip="This {objectType}'s ID"/>
                                        {#if isWorld}
                                            <InfoTextPair name="World Name" value={modEditObject.name} tooltip="This world's internal name"/>
                                            <InfoTextPair name="Tiles" value={modEditObject.dbNumTilesX + " x " + modEditObject.dbNumTilesY} tooltip="Number of tiles at full zoom"/>
                                        {/if}
                                        {#if isLocation}
                                            <InfoTextPair name="Location Type" value={Object.keys(LOCTYPES).find(key => LOCTYPES[key] === modEditObject.locType).toLowerCase()} tooltip="The type of location this is"/>
                                            <InfoTextPair name="In World" value={gamemap.getWorldNameFromID(modEditObject.worldID)} tooltip="The world this location is in"/>
                                            <InfoTextPair name="Position" value={"X: "+modEditObject.getCentre().x + " | Y: " +modEditObject.getCentre().y} tooltip="The centre coordinate that this location is at"/>
                                        {/if}
                                        <InfoTextPair name="Coord Type" value={Object.keys(COORD_TYPES).find(i=>COORD_TYPES[i] === gamemap.getMapConfig().coordType).toLowerCase()} tooltip="Coordinate system that this {objectType} is using"/>
                                        <InfoTextPair name="Revision ID" value={modEditObject.revisionID} tooltip="Current revision ID"/>
                                    </FormGroup>
                                {/if}
                            </div>
                        </div>

                        <footer id="footer" in:fly={{ y: 10, duration: 250 }}>
                            <div class="footer-buttons">
                                <Button text="Save" icon="save" type="save" bold="true" bind:this={saveButton} on:click={() => doSave((isWorld) ? "world" : "location")}/>
                            </div>
                            <div class="footer-buttons">
                                <!-- todo: make the done button close edit panel entirely if summoned from gamemap -->
                                <Button text={!unsavedChanges && !modEditObject?.unsavedLocation ? "Close" : "Cancel"} icon="close" on:click={() => cancel(true)}/>
                                {#if isLocation && !modEditObject.unsavedLocation}
                                    <Button text="Delete" icon="delete" type="delete" on:click={() => doDelete(true)} on:shiftClick={() => doDelete(false)}/>
                                {/if}
                            </div>
                        </footer>
                    </div>
                {/if}
             </div>
         </aside>
    {/if}
</markup>

<style>
    #edit-panel {
        background-color: var(--surface);
        height: 100%;
        z-index: 100;
        position: relative;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        display: flex;
        flex-direction: column;
        width: 0px;
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
        font-weight: bold;
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
        display: grid;
        grid-template-columns: repeat(2, 1fr);
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

    #editor {
        display: flex;
        flex-flow: column;
    }

    .editor_window {
        flex: 1;
        overflow-y: auto;
        position: relative;
    }

    #editor_pane {
        padding-top: var(--padding_minimum);
        padding-bottom: var(--padding_minimum);
    }

    #footer {
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        background-color: var(--surface_variant);
        bottom: 0;
        padding: var(--padding_minimum);
        position: relative;
        width: 100%;
        z-index: 99999;
    }

    .footer-buttons {
        display: flex;
        width: 100%;
    }

    .row {
        margin-bottom: 0;
        margin-right: -8px;
        display: inline-flex;
        gap: 8px;
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
        margin-bottom: 14px;
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
<svelte:window on:resize={() => { if (editPanel != null) { editPanelContent.style.height = document.querySelector('.appbar') ? editPanel.clientHeight - document.querySelector('.appbar').clientHeight + "px" : null } if (editor) { editor.style.height = `${editor.parentElement.clientHeight}px`;}}} on:mouseup={onResizerUp} bind:innerHeight />