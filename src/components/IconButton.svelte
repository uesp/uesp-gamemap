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
    import { onMount } from 'svelte';
    import { createEventDispatcher } from "svelte";

    // import UI components
    import Icon from "./Icon.svelte";

    // state vars
    export let tooltip;
    export let icon;
    export let label;
    export let hasBackground = true;
    export let checked;
    export let noMobile;
    export let dropdown;
    export let menu;
    export let size;
    export let lock;

    checked = (checked != null) ? JSON.parse(checked) : null;
    hasBackground = (hasBackground != null) ? JSON.parse(hasBackground) : null;

    const dispatch = createEventDispatcher();

    if (dropdown != null) { checked = false; }
    if (checked != null) { hasBackground = true; }
    if (!hasBackground) { label = null; }
    if (label == null && dropdown) { label = "Loading..."; }

    onMount(async () => {
        // if menu not null, initiate it
        if (menu != null) {
            var elems = document.querySelectorAll('.dropdown-trigger');
            M.Dropdown.init(elems, {
                constrainWidth: false,
                closeOnClick: true,
                alignment: "right",
            });
        }
    });

    function onClicked(e) {


        if (checked != null) {
            checked = !checked;
            dispatch("checked", {checked: checked, shift: e.shiftKey});
        } else {
            dispatch("click", "clicked");
        }

        if (e.shiftKey) {
            dispatch("shiftClicked", "clicked");
        }

    }

</script>

<markup>
    <button class='btn_icon_button waves-effect mdc-ripple-surface' title={tooltip} on:click={onClicked} class:lock={lock} class:checked={checked} class:hasBackground={hasBackground} class:bgless={!hasBackground} class:nomobile={noMobile} class:dropdown={dropdown} class:dropdown-trigger={menu != null} data-target={menu} on:contextmenu={(e) => e.stopPropagation()}>
        {#if icon}<Icon name={icon} size={size}/>{/if}
        {#if label}<b class="icon_btn_label nomobile">{label}</b>{/if}
        {#if dropdown}<i id="dropdown_icon" class="material-icons nomobile">expand_more</i>{/if}
    </button>
    <slot>
        <!-- optional menu items go here -->
    </slot>
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
        text-overflow: ellipsis;
        pointer-events: visible;
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
        max-width: 15ch;
        display: inline-block;
        padding-bottom: 5px;
        margin-bottom: 9px;
        top: 9px;
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

    /* dropdown */
    .dropdown {
        border-radius: var(--padding_minimum) !important;
	    color: var(--highlight_light);
        background-color: var(--shadow) !important;
    }

    .dropdown.checked:hover {
        background-color: var(--bubble_selection) !important;
    }

    .dropdown #dropdown_icon {
        transition: all 0.2s ease-out;
    }

    .dropdown.checked {
	    background-color: var(--shadow) !important;
        box-shadow: unset;
    }

    .dropdown.checked #dropdown_icon{
	    transform: rotate(180deg);
    }

    .dropdown b{
	    margin-right: -2px;
    }

    .dropdown-trigger {
        z-index: 10 !important;
    }

    .lock {
        opacity: 0.5;
        pointer-events: none;
    }

</style>