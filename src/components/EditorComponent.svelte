<!-- @component
### Description
 Location/world editor component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (14th March, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // import UI components
    import Modal from "./Modal.svelte";

    // import data classes
    import World from "../map/objects/world";
    import Location from "../map/objects/location"
    import Button from "./Button.svelte";

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

        if (isWorld && object.id == gamemap.getCurrentWorld().id) {
            gamemap.reset(true, 30);
            gamemap.mapRoot.classList.add("editing-world");
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

        // remove editlock from gamemap here too

    }

</script>


<markup>

    <div id="editor" in:initiate out:cleanUp>

        {#if isWorld}
             <!-- world editor here -->
        {:else if isLocation}
             <!-- location editor here -->
        {/if}

        <div class="footer-buttons">

            <Button text="Cancel" icon="close" on:click={cancel}></Button>
            <Button text="Delete" icon="delete" type="delete"></Button>
            <Button text="Save" icon="save" type="save" bold="true"></Button>

        </div>
    </div>

</markup>

<style>
    .footer-buttons {
        padding-top: var(--padding_medium);
        display: flex;
        width: 100%;
    }
</style>


