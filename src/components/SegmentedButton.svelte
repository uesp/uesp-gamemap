<!-- @component
### Description
 Segmented button component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (13th April, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";
    import { onMount } from 'svelte';

    // import ui components
    import Divider from "./Divider.svelte";

    // state vars
    export let label;
    export let entries;
    export let selected = 0;
    export let tooltip;

    const MAXIMUM_ENTRIES = 4;
    const RESIZE_OBSERVER = new ResizeObserver(() => {animate = false; onEntrySelected(document.getElementById("label"+selected), selected)});
    const dispatch = createEventDispatcher();

    let slider;
    let animate = false;
    let segmentedButton;
    selected = (selected > MAXIMUM_ENTRIES) ? MAXIMUM_ENTRIES : selected;

    onMount(async() => {
        RESIZE_OBSERVER.observe(segmentedButton);
    });

    function onEntrySelected(e, i) {
        let target = (e.target != null) ? e.target : e;
        selected = i;
        setTimeout(() => {
            slider.style.height = target.clientHeight + "px";
            slider.style.left = target.offsetLeft + "px";
            slider.style.width = target.clientWidth + "px";
        }, 1);

        dispatch("onChange", Object.values(entries)[i]);
    };

</script>

<markup>

    {#if label}<p class="label" title={tooltip}>{label}</p>{/if}
    <div class="container" bind:this={segmentedButton}>
        {#if entries && Object.keys(entries).length <= MAXIMUM_ENTRIES}
            {@const key = Object.keys(entries)}
            <div id="slider" bind:this={slider} class:animate={animate}/>
            {#each key as name, i}
                <input type="radio" id="opt{i}" name="grp">
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <label id="label{i}" for="opt{i}" on:click={(e) => {animate = true; onEntrySelected(e, i);}} class="item waves-effect" class:selected={i == selected}>
                    {name.toLowerCase().replace(/\.\s*([a-z])|^[a-z]/gm, s => s.toUpperCase())}
                </label>
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
        color: rgba(0, 0, 0, 0.87);
        font-weight: normal;
        pointer-events: visible;
        position: relative;
        font-size: 1rem;
        height: 100%;
        border-radius: var(--padding_large);
        z-index: 1;
        width: 100%;
        text-align: center;
        cursor: pointer;
        line-height: 38px;
    }
    .item:hover {
        background-color: var(--divider);
    }

    .selected {
        font-weight: bold;
        color: var(--text_on_primary);
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
        position: relative;
        overflow: clip;
    }

    .error {
        background-color: var(--delete_light);
        height: 35px;
        padding: 6px;
    }

    #slider {
        top: 0px;
        position: absolute;
        border-radius: var(--padding_large);
        z-index: 0;
        background-color: var(--secondary_variant_light);
        box-shadow: 0px 1px 4px 0 var(--shadow);
    }

    #slider.animate {
        transition: all 0.25s ease-in-out !important;
    }

    input[type="radio"] { display: none; }
    input[type="radio"]+label { display: inline-block; }

</style>