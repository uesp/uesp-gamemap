<!-- @component
### Description
 Location/world editor component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (14th March, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';

    // import UI components
    import Modal from "./Modal.svelte";

    // import data classes
    import World from "../map/objects/world";
    import Location from "../map/objects/location"
    import Button from "./Button.svelte";
    import Textbox from "./Textbox.svelte";
    import FormGroup from "./FormGroup.svelte";
    import InfoTextPair from "./InfoTextPair.svelte";

    const dispatch = createEventDispatcher();

    // state vars
    export let object;
    let isLocation = object instanceof Location;
    let isWorld = object instanceof World;
    let editor;
    let saveButton;

    // world data
    let worldDisplayName = object.displayName;
    let worldParentID = object.parentID;
    let worldWikiPage = object.wikiPage;
    let worldDescription = object.description;
    let [worldMinZoom, worldMaxZoom] = [object.minZoomLevel, object.maxZoomLevel];
    let [worldMinX, worldMaxX, worldMinY, worldMaxY] = [object.minX, object.maxX, object.minY, object.maxY];

    // location data

    // on editor load
	onMount(async() => {
        // fix footer height
        editor.style.height = (editor.parentElement.clientHeight) + "px";

        // begin editing provided object
        print(object);
        gamemap.edit(object);

        // do state changes
        if (isWorld && object.id == gamemap.getCurrentWorld().id) {
            gamemap.reset(true, 30);
            gamemap.mapRoot.classList.add("editing");
            gamemap.setMapLock("full");
        } else if (isLocation) {
            gamemap.setMapLock("partial");
        }
    });

    function save(type) {
        saveButton.$set({
            text: "Saving...",
            icon: "loading",
        });

        setTimeout(function() {

            saveButton.$set({
                text: "Done!",
                icon: "done",
            });

            setTimeout(function() {
                if (saveButton.icon == "done") {
                    saveButton.$set({
                        text: "Save",
                        icon: "save",
                    });
                }
            }, 1500);
        }, 1000);

        if (isWorld) {
            doSaveWorld(object);
        }

    }

    function doSaveWorld(world, doDelete) {

        world.displayName = worldDisplayName;
        world.parentID = worldParentID;
        world.wikiPage =  worldWikiPage;
        world.description = worldDescription;
        [world.minZoomLevel, world.maxZoomLevel] = [worldMinZoom, worldMaxZoom];
        [world.minX, world.maxX, world.minY, world.maxY] = [worldMinX, worldMaxX, worldMinY, worldMaxY];

        let queryParams = world.getSaveQuery(doDelete);
        queryParams.db = gamemap.getMapConfig().database;

        getJSON(GAME_DATA_SCRIPT, queryParams, function(data) {

            // merge current world with saved stuff
            // make saved changes false
            // then update revision ID with new one
            // also change world name around ui and stuff

            if (!(data.isError == null) || data.success === false)
            {
                this.setWorldPopupEditNotice('Error saving world data!', 'error');
                this.enableWorldPopupEditButtons(true);
                return false;
            }

            if (data.newRevisionId != null) this.currentEditWorld.revisionId = data.newRevisionId;

        });
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
                    {#if isWorld}
                        <Textbox label="Display Name" text={worldDisplayName} placeholder="Enter display name..." tooltip="User facing world name"/>
                        <!-- svelte-ignore missing-declaration -->
                        <Textbox label="Parent ID" text={worldParentID} placeholder="Enter parent world ID..." tooltip="Parent world ID" bind:value={worldParentID}
                            subtext={(worldParentID && !isNaN(worldParentID)) ? gamemap.getWorldDisplayNameFromID(worldParentID) : null}/>
                        <Textbox label="Wiki Page" text={worldWikiPage} placeholder="Enter wiki page..." tooltip="Wiki article URL"/>
                        <Textbox label="Description" text={worldDescription} placeholder="Enter description..." tooltip="Description of this world" textArea="true"/>
                    {:else if isLocation}
                        <!-- location info here -->
                    {/if}
                </FormGroup>

                {#if isWorld}
                     <FormGroup title="Zoom" icon="zoom_in">
                         <div class="row">
                             <Textbox text={worldMinZoom} hint="Min Zoom" tooltip="Minimum zoom level for this world"/>
                             <Textbox text={worldMaxZoom} hint="Max Zoom" tooltip="Maximum zoom level for this world"/>
                         </div>
                     </FormGroup>

                     <FormGroup title="Bounds" icon="crop_free">
                         <div class="row">
                             <Textbox text={worldMinX} hint="Minimum X"/>
                             <Textbox text={worldMaxX} hint="Maximum X"/>
                         </div>
                         <div class="row">
                             <Textbox text={worldMinY} hint="Minimum Y"/>
                             <Textbox text={worldMaxY} hint="Maximum Y"/>
                         </div>
                     </FormGroup>
                {/if}

                {#if object.id > 0}
                    <FormGroup title="Info" icon="info">
                        {#if isWorld}
                            <InfoTextPair name="World Name" value={object.name} tooltip="This world's internal name"/>
                            <InfoTextPair name="World ID" value={object.id} tooltip="This world's worldID"/>
                            <InfoTextPair name="Revision ID" value={object.revisionID} tooltip="Current revision ID"/>
                            <InfoTextPair name="Tiles" value={object.dbNumTilesX + " x " + object.dbNumTilesY} tooltip="Number of tiles at full zoom"/>
                        {:else if isLocation}
                            <InfoTextPair name="Location ID" value={object.id} tooltip="This location's ID"/>
                            <InfoTextPair name="Revision ID" value={object.revisionID} tooltip="Current revision ID"/>
                            <!-- svelte-ignore missing-declaration -->
                            <InfoTextPair name="World ID" value={object.worldID + " (" + gamemap.getWorldNameFromID(object.worldID) +")"} tooltip="WorldID of the world this location is in"/>
                            <!-- svelte-ignore missing-declaration -->
                            <InfoTextPair name="Location Type" value={object.locType + " ("+Object.keys(LOCTYPES)[object.locType].toLowerCase()+")"} tooltip="Location type"/>
                        {/if}
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
                <Button text="Cancel" icon="close" on:click={cancel}/>
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