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
    import Location from "../map/objects/location"

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

    const dispatch = createEventDispatcher();

    // state vars
    export let data;
    export let unsavedChanges = false;
    let place = Object.assign(Object.create(Object.getPrototypeOf(data)), data)
    let isLocation = data instanceof Location;
    let isWorld = data instanceof World;
    let editor;
    let editorWindow;
    let saveButton;
    let canEdit = true;
    let hasBeenModified = false;
    let haveSaved = false;
    let objectType = (isWorld) ? "world" : "location";
    let currentZoom = gamemap.getCurrentZoom().toFixed(3);
    let linkWikiPage = place.wikiPage == place.name || place.wikiPage == place.displayName;

    // on editor load
	onMount(async() => {

        // fix footer height
        editor.style.height = (editor.parentElement.clientHeight) + "px";

        // refresh zoom on url change
        window.onpopstate = () => currentZoom = gamemap.getCurrentZoom().toFixed(3);

        // begin editing provided data
        print(data);
        unsavedChanges = false;

        // do state changes to edit object
        if (isWorld && data.id == gamemap.getCurrentWorld().id) {
            gamemap.reset(true, 30); // zoom out world map
            gamemap.setMapLock("full"); // lock the world map
            gamemap.mapRoot.classList.add("editing"); // add editing effect
            //gamemap.getMapObject().setMaxZoom(data.maxZoomLevel);

        } else if (isLocation) {
            canEdit = true;
            gamemap.setMapLock("partial"); // set map lock to partial
        }

        // ensure editor window is scrolled to top on load
        setTimeout(function() { editorWindow.scrollTop = 0 }, 1);
    });

    function save() {

        print(data)
        print(place)

        print("saving...");
        saveButton.$set({ text: "Saving...", icon: "loading" });

        let queryParams = objectify(place.getSaveQuery());
        queryParams.db = gamemap.getMapConfig().database;

        getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {

            if (!error && data != null) {

                if (data.isError) {
                    print(data.errorMsg);
                    callback((data.errorMsg.includes("permissions")) ? "Insufficient permissions!" : data.errorMsg);
                } else {
                    print(data);

                    // tell save function that we're done saving
                    callback();
                    modify("revisionID", data.newRevisionId);
                    data = place;

                    //edit editObject to have new revision id, then make data = editobject
                    // if (data.newRevisionId != null) this.currentEditWorld.revisionId = ;
                }

            } else {
                callback(`Error saving ${objectType}!`);
            }
        });

        function callback(error) {

            if (error == null) {
                haveSaved = true;
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
    function modify(property, value, isDisplayData) {
        if (canEdit) {
            // update svelte reactivity
            if (isDisplayData) {
                place.displayData[property] = value;
            } else {
                place[property] = value;
            }
            place = place;

            // are there any unsaved changes
            unsavedChanges = !(JSON.stringify(place) === JSON.stringify(data));
            hasBeenModified = (unsavedChanges) ? true : hasBeenModified;

            // redraw location with new changes
            if (isLocation && hasBeenModified) {
                // editing debouncing
                if (timer != null){
                    clearTimeout(timer);
                }
                timer = setTimeout(() => {
                    gamemap.redrawLocation(place, canEdit);
                }, DEBOUNCE_AMOUNT)
            }
        }
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
        gamemap.setMapLock(false);
    }

    function cancel() {
        dispatch("cancel", "cancelled");
        canEdit = false;
        hasBeenModified = false;
        gamemap.redrawLocation(data, canEdit);
    }

</script>

<markup>
    <div id="editor" out:cleanUp bind:this={editor}>
        <div class="editor_window" bind:this={editorWindow}>
            <div id="editor_pane">

                <FormGroup title="General" icon="description">

                    <header class="header">
                        <AvatarComponent icon={place.icon} locType={place.locType} isWorld={isWorld} on:change={(e) => modify("icon", e.detail)}>

                            <!-- Name -->
                            <Textbox
                                text={isWorld ? place.displayName : place.name }
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
                                <!-- svelte-ignore missing-declaration -->
                                <Textbox
                                    hint="Parent ID"
                                    text={place.parentID}
                                    tooltip="Parent world ID"
                                    type="number"
                                    subtext={(place.parentID && !isNaN(place.parentID) && gamemap.getWorldDisplayNameFromID(place.parentID)) ? gamemap.getWorldDisplayNameFromID(place.parentID) : "Invalid World ID!"}
                                    on:change={(e) => modify("parentID", e.detail)}>
                                </Textbox>
                            <!-- Destination ID (for Locations) -->
                            {:else if isLocation}
                                <!-- svelte-ignore missing-declaration -->
                                {#if place.locType != LOCTYPES.PATH}
                                    <Textbox
                                        hint="Destination ID"
                                        text={place.destinationID}
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
                                    modify("wikiPage", isWorld ? place.displayName : place.name);
                                } else {
                                    modify("wikiPage", "");
                                }
                                linkWikiPage = e.detail;
                        }}>
                        <Textbox label="Wiki Page"
                            text={place.wikiPage}
                            placeholder="Enter wiki page..."
                            tooltip="Wiki page name"
                            on:change={(e) => modify("wikiPage", e.detail)}>
                        </Textbox>
                    </Switch>

                    <!-- Location Type (for Locations) -->
                    {#if isLocation}
                        <!-- svelte-ignore missing-declaration -->
                        <SegmentedButton
                            label="Location Type"
                            entries={LOCTYPES}
                            tooltip="Location type (marker, path or area)"
                            hint="Caution: changing location types is lossy"
                            selected={Object.values(LOCTYPES).indexOf(place.locType)}
                            on:change={(e) => {place.setLocType(e.detail); modify("locType", e.detail)}}>
                        </SegmentedButton>
                    {/if}



                    <!-- Description -->
                    <Textbox label="Description"
                             text={place.description}
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
                            <Textbox text={place.minZoomLevel} type="number" hint="Min Zoom" tooltip="Minimum zoom level for this world" on:change={(e) => modify("minZoomLevel", e.detail)} min=0/>
                            <Textbox text={place.maxZoomLevel} type="number" hint="Max Zoom" tooltip="Maximum zoom level for this world" on:change={(e) => modify("maxZoomLevel", e.detail)} min=0/>
                        </div>
                    </FormGroup>
                {/if}

                <!-- World Bounds (for World) -->
                {#if isWorld}
                     <FormGroup title="Bounds" icon="crop_free">
                         <div class="row">
                            <Textbox text={place.minX} hint="Minimum X" type="number" hideSpinner={true} on:change={(e) => modify("minX", e.detail)}/>
                            <Textbox text={place.maxX} hint="Maximum X" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)}/>
                         </div>
                         <div class="row">
                            <Textbox text={place.minY} hint="Minimum Y" type="number" hideSpinner={true} on:change={(e) => modify("minY", e.detail)}/>
                            <Textbox text={place.maxY} hint="Maximum Y" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)}/>
                         </div>
                     </FormGroup>
                {/if}

                <!-- Styles (for Polygon Locations) -->
                {#if isLocation && place.isPolygon()}
                    <FormGroup title="Style" icon="format_color_fill">


                        <ColourPicker
                            label="Fill colour"
                            colour = {place.style.fillColour}
                            placeholder="Select/enter fill colour...">
                        </ColourPicker>

                        <ColourPicker
                            label="Fill colour (Hovered)"
                            colour = {place.style.hover.fillColour}
                            placeholder="Select/enter fill colour...">
                        </ColourPicker>

                    </FormGroup>
                {/if}

                <!-- Display Data (for Locations) -->
                {#if isLocation}
                     <FormGroup title="Display" icon="light_mode">

                        <!-- svelte-ignore missing-declaration -->
                        <Textbox label="Display Level"
                            text={place.displayLevel}
                            placeholder="Enter display level..."
                            tooltip="Zoom level at which this location will appear"
                            type="number"
                            subtext={"Current zoom is "+currentZoom}
                            min={gamemap.getCurrentWorld().minZoomLevel}
                            max={gamemap.getCurrentWorld().maxZoomLevel}
                            on:change={(e) => modify("displayLevel", e.detail)}>
                        </Textbox>

                        <!-- svelte-ignore missing-declaration -->
                        {#if place.locType != LOCTYPES.PATH}
                            {@const posIDs = Object.keys(LABEL_POSITIONS)}
                            {@const posNames = Object.values(LABEL_POSITIONS)}
                            <DropdownMenu label="Label Direction" hint="Select label direction..." align="right" on:change={(e) => {place.getLabelOffsets(Number(e.detail)); modify("labelPos", Number(e.detail), true)}}>
                                {#each posNames as posName, i}
                                    <option value={posIDs[i]} selected={place.displayData.labelPos == posIDs[i]}>{posName}</option>
                                {/each}
                            </DropdownMenu>
                        {/if}

                        <b class="subheading">Position</b>
                        <div class="row">
                            <Textbox text={place.coords[0].x} hint="X Position" tooltip="X coordinate for this location" type="float"/>
                            <Textbox text={place.coords[0].y} hint="Y Position" tooltip="Y coordinate for this location" type="float" />
                        </div>

                     </FormGroup>
                {/if}

                <!-- General info -->
                {#if place.id > 0}
                    <FormGroup title="Info" icon="info">
                        <InfoTextPair name="{objectType.toLowerCase().replace(/\.\s*([a-z])|^[a-z]/gm, s => s.toUpperCase())} ID" value={place.id} tooltip="This {objectType}'s ID"/>
                        {#if isWorld}<InfoTextPair name="World Name" value={place.name} tooltip="This world's internal name"/>{/if}
                        {#if isWorld}<InfoTextPair name="Tiles" value={place.dbNumTilesX + " x " + place.dbNumTilesY} tooltip="Number of tiles at full zoom"/>{/if}
                        <!-- svelte-ignore missing-declaration -->
                        {#if isLocation}<InfoTextPair name="In World" value={gamemap.getWorldNameFromID(place.worldID)} tooltip="The world this location is in"/>{/if}
                        <!-- svelte-ignore missing-declaration -->
                        <InfoTextPair name="Coord Type" value={Object.keys(COORD_TYPES)[gamemap.getMapConfig().coordType].toLowerCase()} tooltip="Coordinate system that this {objectType} is using"/>
                        <InfoTextPair name="Revision ID" value={place.revisionID} tooltip="Current revision ID"/>
                    </FormGroup>
                {/if}
            </div>
        </div>

        <footer id="footer" in:fly={{ y: 10, duration: 250 }}>
            <div class="footer-buttons">
                <Button text="Save" icon="save" type="save" bold="true" bind:this={saveButton} on:click={() => save((isWorld) ? "world" : "location")}/>
            </div>
            <div class="footer-buttons">
                <!-- todo: make the done button close edit panel entirely if summoned from gamemap -->
                <Button text={haveSaved && !unsavedChanges ? "Done" : "Cancel"} icon="close" on:click={cancel}/>
                <Button text="Delete" icon="delete" type="delete"/>
            </div>
        </footer>
    </div>

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