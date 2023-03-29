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

    // world data
    let worldName = object.name;
    let worldDisplayName = object.displayName;
    let worldWikiPage = object.wikiPage;
    let worldParentID = object.parentID;
    let [worldMinZoom, worldMaxZoom] = [object.minZoomLevel, object.maxZoomLevel];
    let [worldMinX, worldMaxX, worldMinY, worldMaxY] = [object.minX, object.maxX, object.minY, object.maxY];

    // location data
    if (isLocation) {

    }

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
                    <Textbox label="Name" subtext="Internal name" placeholder="ligma"/>
                    <Textbox label="Display name" subtext="User facing name" text={object.displayName}/>
                    <Textbox label="Parent ID" subtext="Parent world ID"/>
                    <Textbox label="Wiki page"/>
                </FormGroup>

                <FormGroup title="Zoom" icon="zoom_in">
                    <div class="row">
                        <Textbox hint="Min Zoom"></Textbox>
                        <Textbox hint="Max Zoom"></Textbox>
                    </div>
                </FormGroup>

                <FormGroup title="Bounds" icon="crop_free">
                    <div class="row">
                        <Textbox hint="Minimum X"></Textbox>
                        <Textbox hint="Maximum X"></Textbox>
                    </div>
                    <div class="row">
                        <Textbox hint="Minimum Y"></Textbox>
                        <Textbox hint="Maximum Y"></Textbox>
                    </div>
                </FormGroup>

                <FormGroup title="About" icon="info">
                    {#if isWorld}
                        <InfoTextPair name="World ID" value={object.id} tooltip="This world's worldID"></InfoTextPair>
                        <InfoTextPair name="Revision ID" value={object.revisionID} tooltip="Revision ID as of last edit"></InfoTextPair>
                        <InfoTextPair name="Tiles" value={object.dbNumTilesX + " x " + object.dbNumTilesY} tooltip="Number of tiles at full zoom"></InfoTextPair>
                    {:else if isLocation}
                        <!-- location editor here -->
                    {/if}

                </FormGroup>
            </div>

        </div>

        <footer id="footer" in:fly={{ y: 10, duration: 250 }}>
            <div class="footer-buttons">
                <Button text="Save" icon="save" type="save" bold="true"></Button>
            </div>
            <div class="footer-buttons">
                <!-- todo: make the done button close edit panel entirely if summoned from gamemap -->
                <Button text="Cancel" icon="close" on:click={cancel}></Button>
                <Button text="Delete" icon="delete" type="delete"></Button>
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

<svelte:window on:resize={() => {editor.style.height = (editor.parentElement.clientHeight) + "px"; }}/>