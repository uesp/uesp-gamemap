<!-- @component
### Description
 Location/world editor component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (14th March, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";
    import { fade, fly, slide } from 'svelte/transition';
    import { onMount } from 'svelte';

    // import UI components
    import Button from "./Button.svelte";
    import Textbox from "./Textbox.svelte";
    import FormGroup from "./FormGroup.svelte";
    import InfoTextPair from "./InfoTextPair.svelte";
    import DropdownMenu from "./DropdownMenu.svelte";
    import SegmentedButton from "./SegmentedButton.svelte";
    import Modal from "./Modal.svelte";
    import Switch from "./Switch.svelte";

    // import data classes
    import World from "../map/objects/world";
    import Location from "../map/objects/location"

    const dispatch = createEventDispatcher();

    // state vars
    export let data;
    export let unsavedChanges = false;
    let currentObject = data;
    let isLocation = currentObject instanceof Location;
    let isWorld = currentObject instanceof World;
    let editObject = Object.assign(Object.create(Object.getPrototypeOf(data)), data)
    let editor;
    let saveButton;
    let haveSaved = false;
    let objectType = (isWorld) ? "world" : "location";
    let currentZoom = gamemap.getCurrentZoom().toFixed(3);
    let linkWikiPage = editObject.wikiPage == editObject.name || editObject.wikiPage == editObject.displayName;

    // on editor load
	onMount(async() => {

        // fix footer height
        editor.style.height = (editor.parentElement.clientHeight) + "px";

        // refresh zoom on url change
        window.onpopstate = () => currentZoom = gamemap.getCurrentZoom().toFixed(3);

        // begin editing provided data
        gamemap.edit(data);
        print(data);
        unsavedChanges = false;

        // do state changes to edit object
        if (isWorld && data.id == gamemap.getCurrentWorld().id) {
            gamemap.reset(true, 30); // zoom out world map
            gamemap.setMapLock("full"); // lock the world map
            gamemap.mapRoot.classList.add("editing"); // add editing effect
        } else if (isLocation) {
            gamemap.setMapLock("partial"); // set map lock to partial

            // add editing effect to marker(s)
            let markers = gamemap.getMarkersFromLocation(data);
            markers.forEach((marker) => {
                print(marker);
                marker.element.classList.add("editing");

                // and editing effect to label (if available)
                if (marker._tooltip) {
                    setTimeout(function() {
                        document.getElementById(marker.element.getAttribute('aria-describedby')).classList.add("editing"); // add editing effect
                    }, 100); // fix label not being given edit effect on first load
                }
            });
        }
    });

    function save() {

        print(data)
        print(editObject)

        print("saving...");
        saveButton.$set({ text: "Saving...", icon: "loading" });

        let queryParams = objectify(editObject.getSaveQuery());
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
                    data = editObject;

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

    function modify(property, value) {

        // update svelte reactivity
        editObject[property] = value;
        editObject = editObject;

        print(currentObject);
        print(editObject);

        unsavedChanges = !(JSON.stringify(editObject) === JSON.stringify(currentObject));
    }

    function cleanUp() {
        let glowElements = document.querySelectorAll("[class*='editing']");
        Array.from(glowElements).forEach(element => {
            element.classList.remove("editing");
        })

        if (isWorld) {
            gamemap.reset(true);
        }

        // remove map lock from gamemap
        gamemap.setMapLock(false);
    }

    function cancel() { dispatch("cancel", "cancelled"); }

</script>

<markup>
    <div id="editor" out:cleanUp bind:this={editor}>
        <div class="editor_window">
            <div id="editor_pane">

                <FormGroup title="General" icon="description">
                    <!-- Name -->
                    <Textbox
                        label={(isWorld ? "Display " : "") + "Name"}
                        text={isWorld ? editObject.displayName : editObject.name }
                        placeholder="Enter {objectType} name..."
                        tooltip="User facing {objectType} name"
                        on:change={(e) => {
                            if (linkWikiPage) {
                                modify("wikiPage", e.detail)
                            }
                            modify(isWorld ? "displayName" : "name", e.detail)
                        }}>
                    </Textbox>

                    <!-- Wiki Page -->
                    <Switch
                        enabled={linkWikiPage}
                        expand={!linkWikiPage}
                        label={"Use " + (isWorld ? "Display Name" : "Name") + " as Wiki Page"}
                        tooltip={`Use this ${objectType}'s ${(isWorld ? "display name" : "name")} as its wiki page`}
                        on:change={(e) => {
                             if (e.detail) {
                                modify("wikiPage", isWorld ? editObject.displayName : editObject.name);
                             } else {
                                modify("wikiPage", "");
                             }
                             linkWikiPage = e.detail;
                        }}>
                        <Textbox label="Wiki Page"
                         text={editObject.wikiPage}
                         placeholder="Enter wiki page..."
                         tooltip="Wiki page name"
                         on:change={(e) => modify("wikiPage", e.detail)}>
                        </Textbox>
                    </Switch>

                    <!-- Parent ID (for World) -->
                    {#if isWorld}
                        <!-- svelte-ignore missing-declaration -->
                        <Textbox
                            label="Parent ID"
                            text={editObject.parentID}
                            placeholder="Enter parent world ID..."
                            tooltip="Parent world ID"
                            type="number"
                            subtext={(editObject.parentID && !isNaN(editObject.parentID) && gamemap.getWorldDisplayNameFromID(editObject.parentID)) ? gamemap.getWorldDisplayNameFromID(editObject.parentID) : "Invalid World ID!"}
                            on:change={(e) => modify("parentID", e.detail)}>
                        </Textbox>
                    {/if}

                    <!-- Location Type (for Locations) -->
                    {#if isLocation}
                        <!-- svelte-ignore missing-declaration -->
                        <SegmentedButton
                            label="Location Type"
                            entries={LOCTYPES}
                            tooltip="Location type (marker or area)"
                            selected={Object.values(LOCTYPES).indexOf(editObject.locType)}
                            on:change={(e) => {modify("locType", e.detail) /* also add change loctype method to location*/}}>
                        </SegmentedButton>
                    {/if}

                    <!-- Description -->
                    <Textbox label="Description"
                             text={editObject.description}
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
                             <Textbox text={editObject.minZoomLevel} type="number" hint="Min Zoom" tooltip="Minimum zoom level for this world" on:change={(e) => modify("minZoomLevel", e.detail)} min=0/>
                             <Textbox text={editObject.maxZoomLevel} type="number" hint="Max Zoom" tooltip="Maximum zoom level for this world" on:change={(e) => modify("maxZoomLevel", e.detail)} min=0/>
                         </div>
                     </FormGroup>
                {/if}

                <!-- World Bounds (for World) -->
                {#if isWorld}
                     <FormGroup title="Bounds" icon="crop_free">
                         <div class="row">
                             <Textbox text={editObject.minX} hint="Minimum X" type="number" hideSpinner={true} on:change={(e) => modify("minX", e.detail)}/>
                             <Textbox text={editObject.maxX} hint="Maximum X" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)}/>
                         </div>
                         <div class="row">
                             <Textbox text={editObject.minY} hint="Minimum Y" type="number" hideSpinner={true} on:change={(e) => modify("minY", e.detail)}/>
                             <Textbox text={editObject.maxY} hint="Maximum Y" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)}/>
                         </div>
                     </FormGroup>
                {/if}

                <!-- Position (for Locations) -->
                <FormGroup title="Position" icon="location_on">
                    <p>Using coordinate system: Normalised</p>
                    <div class="row">
                        <!-- <Textbox text={worldMinZoom} hint="X" tooltip="Minimum zoom level for this world" bind:value={worldMinZoom}/>
                        <Textbox text={worldMaxZoom} hint="Y" tooltip="Maximum zoom level for this world" bind:value={worldMaxZoom}/> -->
                    </div>
                    <Button text="Set Position" icon="pin_drop"/>
                </FormGroup>

                <!-- Display Data (for Locations) -->
                <FormGroup title="Display" icon="light_mode">

                    <!-- <Textbox label="Display Level" text={worldParentID} placeholder="Enter display level..." tooltip="Parent world ID"
                    subtext={"Current zoom is "+currentZoom}/>

                    <DropdownMenu label="Icon">
                        <option value={"ligma"} data-icon="https://media.discordapp.net/attachments/725183270697828412/1096158382458671169/20230413204157_1.jpg?width=1206&height=678">helo</option>
                    </DropdownMenu>

                    <DropdownMenu label="Label Direction">
                        <option value={"ligma"} data-icon="https://media.discordapp.net/attachments/725183270697828412/1096158382458671169/20230413204157_1.jpg?width=1206&height=678">helo</option>
                    </DropdownMenu> -->
                </FormGroup>

                <!-- Generic info -->
                {#if editObject.id > 0}
                    <FormGroup title="Info" icon="info">
                        <InfoTextPair name="{objectType.toLowerCase().replace(/\.\s*([a-z])|^[a-z]/gm, s => s.toUpperCase())} ID" value={editObject.id} tooltip="This {objectType}'s ID"/>
                        {#if isWorld}<InfoTextPair name="World Name" value={editObject.name} tooltip="This world's internal name"/>{/if}
                        {#if isWorld}<InfoTextPair name="Tiles" value={editObject.dbNumTilesX + " x " + editObject.dbNumTilesY} tooltip="Number of tiles at full zoom"/>{/if}
                        <!-- svelte-ignore missing-declaration -->
                        {#if isLocation}<InfoTextPair name="In World" value={gamemap.getWorldNameFromID(editObject.worldID)} tooltip="The world this location is in"/>{/if}
                        <!-- svelte-ignore missing-declaration -->
                        <InfoTextPair name="Coord Type" value={Object.keys(COORD_TYPES)[gamemap.getMapConfig().coordType].toLowerCase()} tooltip="Coordinate system that this {objectType} is using"/>
                        <InfoTextPair name="Revision ID" value={editObject.revisionID} tooltip="Current revision ID"/>
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
</style>

<svelte:options accessors/>
<svelte:window on:resize={() => {editor.style.height = (editor.parentElement.clientHeight) + "px"; }}/>