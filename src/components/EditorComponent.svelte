<!-- @component
### Description
 Location/world editor component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (14th March, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";
    import { fade, fly } from 'svelte/transition';

    // import UI components
    import Modal from "./Modal.svelte";

    // import data classes
    import World from "../map/objects/world";
    import Location from "../map/objects/location"
    import Button from "./Button.svelte";
    import Textbox from "./Textbox.svelte";

    const dispatch = createEventDispatcher();

    // state vars
    export let object;
    export let unsavedChanges = false;
    let isLocation = object instanceof Location;
    let isWorld = object instanceof World;

    let discardChangesDialog;

    print(object);
    print(unsavedChanges);

    function cancel() {
        dispatch("cancel", "cancelled");
    }

    function initiate() {

        gamemap.edit(object);
        if (isWorld && object.id == gamemap.getCurrentWorld().id) {
            gamemap.reset(true, 30);
            gamemap.mapRoot.classList.add("editing-world");
            gamemap.setMapLock("full");
        } else if (isLocation) {
            gamemap.setMapLock("partial");
        }

    }


    function cleanUp() {
        let glowElements = document.querySelectorAll("[class*='editing']");
        Array.from(glowElements).forEach(element => {
            element.classList.remove("editing");
            element.classList.remove("editing-world");
        })

        if (isWorld) {
            gamemap.reset(true);
        }

        // remove map lock from gamemap
        gamemap.setMapLock(false);
    }

</script>


<markup>
    <div id="editor" in:initiate out:cleanUp>
        <div id="editor_window">

            {#if isWorld}
                <!-- world editor here -->
            {:else if isLocation}
                <!-- location editor here -->
            {/if}

            <b>General</b>
            <Textbox label="Display name" subtext="User facing name"/>
            <Textbox label="Name" subtext="Internal name"/>
            <Textbox label="Parent ID" subtext="Parent world ID"/>
            <Textbox label="Wiki page"/>
            <Textbox label="Description" block={true}/>

            <b>Zoom levels</b>
            <Textbox label="Max zoom"/> <Textbox label="Min zoom"/>

            <b>World bounds</b>
            <Textbox hint="Minimum X"></Textbox>
            <Textbox hint="Maximum X"></Textbox>
            <Textbox hint="Minimum Y"></Textbox>
            <Textbox hint="Maximum Y"></Textbox>
        </div>

        <footer id="footer" in:fly={{ y: 10, duration: 250 }}>
            <div class="footer-buttons">
                <Button text="Save" icon="save" type="save" bold="true"></Button>
            </div>
            <div class="footer-buttons">
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
        max-height: 723.2px;
    }

    #footer {
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        background-color: var(--surface_variant);
        position: absolute;
        bottom: 0px;
        left: 0;
        width: -moz-available;
        padding: var(--padding_minimum);
    }

    .footer-buttons {
        display: flex;
        width: 100%;
    }
    b {
        font-size: 15px;
    }
</style>


