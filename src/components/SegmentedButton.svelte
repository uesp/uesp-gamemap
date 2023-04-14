<!-- @component
### Description
 Segmented button component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (13th April, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // import ui components
    import Divider from "./Divider.svelte";

    // state vars
    export let label;
    export let entries;
    export let selected = 0;
    const MAXIMUM_ENTRIES = 4;
    let slider;
    let segmentedButton;
    selected = (selected > MAXIMUM_ENTRIES) ? MAXIMUM_ENTRIES : selected;

    window.LOCTYPES = {
        NONE : 0,
        POINT : 1,
        PATH : 2,
        AREA : 3,
        LABEL : 4,
    }

    function onEntrySelected(event, entry) {
        let target = event.target;
        print(event);
        print(entry);
        selected = entry;
    }


</script>

<markup>

    {#if label}<p class="label">{label}</p>{/if}

    <div class="container" bind:this={segmentedButton}>

        {#if entries && Object.keys(entries).length <= MAXIMUM_ENTRIES}
            {@const key = Object.keys(entries)}

            {#each key as name, i}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <b class="item waves-effect" name={i} class:selected={i == selected} on:click={(e) => onEntrySelected(e, i)}>{name.toLowerCase().replace(/\.\s*([a-z])|^[a-z]/gm, s => s.toUpperCase())}</b>
                {#if i == 0 || i != Object.keys(entries).length - 1}
                    <Divider direction="vertical"></Divider>
                {/if}
            {/each}
        {:else}
            <div class="error">
                {#if !entries}
                    <b>No entries!</b>
                {:else}
                    <b>Over 4 entries! Use dropdown instead.</b>
                {/if}
            </div>
        {/if}
    </div>
</markup>

<style>

    .label {
        margin: 0;
        white-space: nowrap;
        margin-top: 2px;
    }

    .item {
        text-align: center;
        pointer-events: visible;
        border-radius: var(--padding_large);
        color: rgba(0, 0, 0, 0.87);
        font-weight: normal;
        width: 100%;
        height: 100%;
        line-height: 36px;
        position: relative;
    }
    .item:hover {
        background-color: var(--selection);
    }

    .item.selected {
        font-weight: bold;
        color: var(--text_on_primary);
        background-color: var(--secondary_variant_light);
        box-shadow: 0px 1px 4px 0 var(--shadow);
        border-radius: 32px;
        color: var(--background);
    }

    .item.selected:hover {
        background-color: var(--secondary_variant);
    }

    .container {
        margin-top: 8px;
        margin-bottom: 4px;
        background-color: var(--surface_variant_dark);
        width: 100%;
        height: 40px;
        border-radius: var(--padding_large);
        border-style: solid;
        border-color: var(--divider);
        border-width: 1px;
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        flex-flow: row;
        overflow: clip;
    }

    .error {
        background-color: var(--delete_light);
        height: 35px;
        padding: 6px;
    }

</style>