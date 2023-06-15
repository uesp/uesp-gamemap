<!-- @component
### Description
 Location/world editor component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (14th March, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";
    import { fly } from 'svelte/transition';
    import { onMount } from 'svelte';

    // import data classes
    import World from "../map/objects/world";
    import Location from "../map/objects/location";
    import Point from "../map/objects/point";

    // import UI components
    import Button from "./Button.svelte";
    import Textbox from "./Textbox.svelte";
    import FormGroup from "./FormGroup.svelte";
    import InfoTextPair from "./InfoTextPair.svelte";
    import DropdownMenu from "./DropdownMenu.svelte";
    import SegmentedButton from "./SegmentedButton.svelte";
    import Switch from "./Switch.svelte";
    import ColourPicker from "./ColourPicker.svelte";
    import AvatarComponent from "./AvatarComponent.svelte";
    import Modal from "./Modal.svelte";

    const dispatch = createEventDispatcher();

    // state vars
    export let data;
    export let unsavedChanges = false;

    // create full clones of original objects
    let originalObj = Object.assign(Object.create(Object.getPrototypeOf(data)), data);
    let modifiedObj = Object.assign(Object.create(Object.getPrototypeOf(data)), data);

    let isLocation = originalObj instanceof Location;
    let isWorld = originalObj instanceof World;
    let editor;
    let editorWindow;
    let saveButton;
    let canEdit = true;
    let hasBeenModified = false;
    let objectType = (isWorld) ? "world" : "location";
    let currentZoom = gamemap.getCurrentZoom().toFixed(3);
    let linkWikiPage = modifiedObj.wikiPage == modifiedObj.name || modifiedObj.wikiPage == modifiedObj.displayName;
    let boop = false;

    // on editor load
	onMount(async() => {

        // fix footer height
        editor.style.height = (editor.parentElement.clientHeight) + "px";

        // refresh current zoom on url change
        window.onpopstate = () => currentZoom = gamemap.getCurrentZoom().toFixed(3);

        // begin editing provided data
        unsavedChanges = false;

        // do state changes to edit object
        if (isWorld && originalObj.id == gamemap.getCurrentWorld().id) {
            gamemap.reset(true, 30); // zoom out world map
            gamemap.setMapLock(MAPLOCK.FULL); // lock the world map
            gamemap.mapRoot.classList.add("editing"); // add editing effect
        } else if (isLocation) {
            print("being called to edit location")
            canEdit = true;
            gamemap.setMapLock(modifiedObj.isPolygon() ? MAPLOCK.PARTIAL_POLYGON : MAPLOCK.PARTIAL_MARKER);
            originalObj.setEditing(true);
            modifiedObj.setEditing(true);
            gamemap.updateLocation(modifiedObj);
        }

        // ensure editor window is scrolled to top on load
        setTimeout(function() { editorWindow.scrollTop = 0 }, 1);

        // inform parent edit pane that the editor is loaded now
        dispatch("loaded", "editor loaded!");
    });


    function doDelete() {

        print("deleting object...");
        //saveButton.$set({ text: "Saving...", icon: "loading" });

        let queryParams = objectify(modifiedObj.getDeleteQuery());
        queryParams.db = gamemap.getMapConfig().database;

        getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {
            if (!error && data) {
                gamemap.deleteLocation(modifiedObj);
            }
        });

    }

    function doSave() {

        print("saving object...");
        print(originalObj)
        print(modifiedObj)

        let queryParams = objectify(modifiedObj.getSaveQuery());
        let query = (GAME_DATA_SCRIPT + queryify(queryParams)).replace(/=\s*$/, "");
        saveButton.$set({ text: "Saving...", icon: "loading" });

        print(query);
        getJSON(query, function(error, data) {

            if (!error && data != null) {

                if (data.isError) {
                    print(data.errorMsg);
                    callback((data.errorMsg.includes("permissions")) ? "Insufficient permissions!" : data.errorMsg);
                } else {
                    print(data);
                    // tell save function that we're done saving
                    callback();
                    modify("revisionID", data.newRevisionId);
                    if (isLocation) { gamemap.updateLocation(modifiedObj) }
                    originalObj = Object.assign(Object.create(Object.getPrototypeOf(modifiedObj)), modifiedObj);
                    unsavedChanges = false;
                }

            } else {
                callback(`Error saving ${objectType}!`);
            }
        });

        function callback(error) {

            if (error == null) {
                saveButton.$set({ text: "Done!", icon: "done" });
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

    let timer;
    const DEBOUNCE_AMOUNT = 75;
    function modify(property, value) {
        if (canEdit) {
            // update svelte reactivity
            modifiedObj[property] = value;
            modifiedObj = modifiedObj;

            print("before edit");
            print(data);
            print("after edit");
            print(modifiedObj);

            // are there any unsaved changes
            unsavedChanges = !(JSON.stringify(modifiedObj) === JSON.stringify(originalObj));
            hasBeenModified = (unsavedChanges) ? true : hasBeenModified;
            gamemap.setMapLock(modifiedObj.isPolygon() ? MAPLOCK.PARTIAL_POLYGON : MAPLOCK.PARTIAL_MARKER);

            // redraw location with new changes
            if (isLocation && hasBeenModified) {
                // editing debouncing
                if (timer != null){
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    gamemap.updateLocation(modifiedObj);
                }, DEBOUNCE_AMOUNT)
            }
        }
    }

    // received updated marker coords from gamemap (via drag and dropping)
    window.updateMarkerCoords = function updateMarkerCoords(coords) {
        print(coords)
        modify("coords", coords);
    }

    function cleanUp() {
        let glowElements = document.querySelectorAll("[class*='editing']");
        Array.from(glowElements).forEach(element => {
            element.classList.remove("editing");
        })

        if (isWorld) {
            gamemap.reset(true);
        } else if (isLocation) {
            // disable edit mode
            gamemap.getMapObject().pm.disableGlobalEditMode();
            canEdit = false;
        }

        hasBeenModified = false;
        // remove map lock from gamemap
        gamemap.setMapLock(MAPLOCK.NONE);
    }

    function cancel() {
        dispatch("cancel", "cancelled");
        canEdit = false;
        hasBeenModified = false;
        originalObj.setEditing(false);
        gamemap.updateLocation(originalObj);
    }

</script>

<markup>
    <!-- svelte-ignore missing-declaration -->
    <div id="editor" out:cleanUp bind:this={editor}>
        <div class="editor_window" bind:this={editorWindow}>
            <div id="editor_pane">

                <FormGroup title="General" icon="description">

                    <header class="header">
                        <AvatarComponent icon={modifiedObj.icon} locType={modifiedObj.locType} isWorld={isWorld} on:change={(e) => modify("icon", e.detail)}>
                            <!-- Name -->
                            <Textbox
                                text={isWorld ? modifiedObj.displayName : modifiedObj.name }
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
                                    text={modifiedObj.parentID}
                                    tooltip="Parent world ID"
                                    type="number"
                                    subtext={(modifiedObj.parentID && !isNaN(modifiedObj.parentID) && gamemap.getWorldDisplayNameFromID(modifiedObj.parentID)) ? gamemap.getWorldDisplayNameFromID(modifiedObj.parentID) : "Invalid World ID!"}
                                    on:change={(e) => modify("parentID", e.detail)}>
                                </Textbox>
                            <!-- Destination ID (for Locations) -->
                            {:else if isLocation}
                                {#if modifiedObj.locType != LOCTYPES.PATH}
                                    <Textbox
                                        hint="Destination ID"
                                        text={modifiedObj.destinationID}
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
                                    modify("wikiPage", isWorld ? modifiedObj.displayName : modifiedObj.name);
                                } else {
                                    modify("wikiPage", null);
                                }
                                linkWikiPage = e.detail;
                        }}>
                        <Textbox label="Wiki Page"
                            text={modifiedObj.wikiPage}
                            placeholder="Enter wiki page..."
                            tooltip="Wiki page name"
                            on:change={(e) => modify("wikiPage", e.detail)}>
                        </Textbox>
                    </Switch>

                    <!-- Location Type (for Locations) -->
                    {#if isLocation}
                        <SegmentedButton
                            label="Location Type"
                            entries={LOCTYPES}
                            tooltip="Location type (marker, path or area)"
                            selected={Object.values(LOCTYPES).indexOf(modifiedObj.locType)}
                            on:change={(e) => modify("locType", e.detail)}>
                        </SegmentedButton>
                    {/if}

                    <!-- Description -->
                    <Textbox label="Description"
                             text={modifiedObj.description}
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
                            <Textbox text={modifiedObj.minZoomLevel} type="number" hint="Min Zoom" tooltip="Minimum zoom level for this world" on:change={(e) => modify("minZoomLevel", e.detail)} min=0/>
                            <Textbox text={modifiedObj.maxZoomLevel} type="number" hint="Max Zoom" tooltip="Maximum zoom level for this world" on:change={(e) => modify("maxZoomLevel", e.detail)} min=0/>
                        </div>
                    </FormGroup>
                {/if}

                <!-- World Bounds (for World) -->
                {#if isWorld}
                     <FormGroup title="Bounds" icon="crop_free">
                         <div class="row">
                            <Textbox text={modifiedObj.minX} hint="Minimum X" type="number" hideSpinner={true} on:change={(e) => modify("minX", e.detail)}/>
                            <Textbox text={modifiedObj.maxX} hint="Maximum X" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)}/>
                         </div>
                         <div class="row">
                            <Textbox text={modifiedObj.minY} hint="Minimum Y" type="number" hideSpinner={true} on:change={(e) => modify("minY", e.detail)}/>
                            <Textbox text={modifiedObj.maxY} hint="Maximum Y" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)}/>
                         </div>
                     </FormGroup>
                {/if}

                <!-- Display Data (for Locations) -->
                {#if isLocation}
                     <FormGroup title="Display" icon="light_mode">

                        {#if modifiedObj.isPolygon()}
                            <ColourPicker
                                label="Fill colour"
                                colour = {modifiedObj.fillColour}
                                placeholder="Select/enter fill colour...">
                            </ColourPicker>

                            <ColourPicker
                                label="Fill colour (Hovered)"
                                colour = {modifiedObj.fillColourHover}
                                placeholder="Select/enter fill colour...">
                            </ColourPicker>
                        {/if}

                        <Textbox label="Display Level"
                            text={modifiedObj.displayLevel}
                            placeholder="Enter display level..."
                            tooltip="Zoom level at which this location will appear"
                            type="number"
                            subtext={"Current zoom is "+currentZoom}
                            min={gamemap.getCurrentWorld().minZoomLevel}
                            max={gamemap.getCurrentWorld().maxZoomLevel}
                            on:change={(e) => modify("displayLevel", e.detail)}>
                        </Textbox>

                        {#if modifiedObj.locType != LOCTYPES.PATH}
                            {@const posIDs = Object.keys(LABEL_POSITIONS)}
                            {@const posNames = Object.values(LABEL_POSITIONS)}
                            <DropdownMenu label="Label Direction" hint="Select label direction..." align="right" on:change={(e) => {modify("labelPos", Number(e.detail))}} >
                                {#each posNames as posName, i}
                                    <option value={posIDs[i]} selected={modifiedObj.labelPos == posIDs[i]}>{posName.toSentenceCase()}</option>
                                {/each}
                            </DropdownMenu>
                        {/if}

                        {#if modifiedObj.locType == LOCTYPES.MARKER}
                            <b class="subheading">Position</b>
                            <div class="row">
                                <Textbox text={modifiedObj.coords[0].x}
                                        hint="X Position"
                                        tooltip="X coordinate for this location"
                                        type="float"
                                        on:change={(e) => {modify("coords", new Point(e.detail, modifiedObj.coords[0].y))}}/>
                                <Textbox text={modifiedObj.coords[0].y} hint="Y Position" tooltip="Y coordinate for this location" type="float" />
                            </div>
                        {/if}

                     </FormGroup>
                {/if}

                <!-- General info -->
                {#if modifiedObj.id > 0}

                    <FormGroup title="Info" icon="info">
                        <InfoTextPair name="{objectType.toSentenceCase()} ID" value={modifiedObj.id} tooltip="This {objectType}'s ID"/>
                        {#if isWorld}<InfoTextPair name="World Name" value={modifiedObj.name} tooltip="This world's internal name"/>{/if}
                        {#if isWorld}<InfoTextPair name="Tiles" value={modifiedObj.dbNumTilesX + " x " + modifiedObj.dbNumTilesY} tooltip="Number of tiles at full zoom"/>{/if}
                        {#if isLocation}<InfoTextPair name="In World" value={gamemap.getWorldNameFromID(modifiedObj.worldID)} tooltip="The world this location is in"/>{/if}
                        <InfoTextPair name="Coord Type" value={Object.keys(COORD_TYPES)[gamemap.getMapConfig().coordType].toLowerCase()} tooltip="Coordinate system that this {objectType} is using"/>
                        <InfoTextPair name="Revision ID" value={modifiedObj.revisionID} tooltip="Current revision ID"/>
                    </FormGroup>
                {/if}
            </div>
        </div>

        <footer id="footer" in:fly|local={{ y: 10, duration: 250 }}>
            <div class="footer-buttons">
                <Button text="Save" icon="save" type="save" bold="true" bind:this={saveButton} on:click={() => doSave((isWorld) ? "world" : "location")}/>
            </div>
            <div class="footer-buttons">
                <!-- todo: make the done button close edit panel entirely if summoned from gamemap -->
                <Button text={!unsavedChanges ? "Close" : "Cancel"} icon="close" on:click={cancel}/>
                {#if isLocation}
                     <Button text="Delete" icon="delete" type="delete" on:click={doDelete}/>
                {/if}

            </div>
        </footer>
    </div>

    <!-- Delete dialog -->
	{#if boop}
        <Modal title="Map Key" id="modal" fixedFooter="true">
            <div id="map_key_container">
                <p>hello</p>
            </div>
        </Modal>
    {/if}

</markup>

<style>

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

    .subheading {
        font-weight: initial;
        padding-top: 5px;
        display: block;
        padding-bottom: 2px;
        padding-top: 4px;
    }
</style>

<svelte:options accessors/>
<svelte:window on:resize={() => {editor.style.height = (editor.parentElement.clientHeight) + "px"; }}/>