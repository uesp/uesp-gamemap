<!-- @component
### Description
 Icon button component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (31st Jan, 2023) -->


<!--
iconButton element:
> goes inside iconbar element -->

<script>

    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // import UI components
    import Icon from "./Icon.svelte";

    // state vars
    export let tooltip;
    export let icon;
    export let label;
    export let hasBackground;
    export let checked;
    export let hideMobile;

    const dispatch = createEventDispatcher();

    if (!hasBackground) { label = null; }
    if (checked != null) { hasBackground = true; }

    function onClicked() {

        if (checked != null) {
            checked = !checked;
            dispatch("checked", checked);
        } else {
            dispatch("click", "clicked");
        }

    }

</script>

<markup>
    <button class='btn_icon_button waves-effect' title={tooltip} on:click={onClicked} class:checked={checked} class:hasBackground={hasBackground} class:bgless={!hasBackground} class:nomobile={hideMobile} >
        {#if icon}<Icon name={icon}/>{/if}
        {#if label}<b class="icon_btn_label nomobile">{label}</b>{/if}
    </button>
</markup>

<style>
    /* button main */
    button {
        text-shadow: 0px 0px 6px var(--background);
        background-color: var(--shadow);
        border: none;
        color: var(--text_on_secondary);
        padding: auto;
        border-radius: var(--appbar_dimen);
        transition: all ease-in 150ms;
        height: var(--appbar_dimen);
        min-width: var(--appbar_dimen);
        text-align: center;
        vertical-align: middle;
        line-height: 100%;
    }

    button:hover {
	    background-color: var(--bubble_selection) !important;
    }

    button:active {
        transform: scale(0.94);
    }

    /* fix annoying materialise bug */
    button:focus {
        background-color: var(--shadow);
    }

    /* button label */
    b {
        margin-left: 4px;
        margin-right: 12px;
        font-size: medium;
        white-space: nowrap;
        position: relative;
        top: -6.5px;
        max-width: 150px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }


    /* checked state */
    .checked {
        background-color: var(--secondary_variant);
	    box-shadow: 0px 1.5px 4px 4px var(--shadow);
        color: white;
    }
    .checked:hover {
        background-color: var(--secondary_variant_dark) !important;
    }
    .checked:focus {
        background-color: var(--secondary_variant);
    }

    /* bgless */
    .bgless {
        text-shadow: unset !important;
        background-color: unset !important;
        color: black;
    }
    .bgless:hover {
        background-color: var(--divider) !important;
        color: black;
    }
    button.bgless.focus {
        background-color: unset !important;
    }
</style>