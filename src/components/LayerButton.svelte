<!-- @component
### Description
 Layer button component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (27th Jan, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // state vars
    export let tooltip = "";
    export let label = "layer";
    export let icon = null;
    export let image = null;
    export let checked;
    export let dark = false;
    export let big;

    const dispatch = createEventDispatcher();

    let hasIcon = (icon != null && !image);
    let iconIsURL = hasIcon && icon.includes("/");

    function onClick() {

        if (checked != null) {
            checked = !checked;
            dispatch("onClick", checked);
        } else {
            dispatch("onClick", label.toLowerCase());
        }
    }

</script>

<markup>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div id="btn_toggle_grid" class='btn_layer_toggle layer-button waves-effect' title={tooltip} class:hasImage={!hasIcon} class:dark={dark} class:isChecked={checked} style="background-image: url({image});" on:click={onClick} class:big={big} on:contextmenu={(e) => e.stopPropagation()}>
        {#if hasIcon}
            {#if iconIsURL}
                <div style="width:100%; height:100%;">
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <img class="icon-img" src={icon} width="32" height="32">
                </div>
            {:else}
                <i class="material-icons">{icon}</i>
            {/if}
        {/if}
        <p class="layer-name">{label}</p>
    </div>
</markup>

<style>

    .layer-name {
        font-size: 0.75rem;
        font-weight: bold;
        pointer-events: none;
        text-align: center;
        position: absolute;
        width: 100%;
        bottom: -9px;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }

    .layer-button {
        flex-shrink: 0;
        height: calc(var(--layer_widget_dimen) - var(--padding_minimum)) !important;
        width: calc(var(--layer_widget_dimen) - var(--padding_minimum));
        border-radius: var(--padding_minimum);
        background-color: var(--primary_variant_dark);
        margin-top: auto;
        margin-bottom: auto;
        margin-left: 4px;
        margin-right: 4px;
        z-index: 1;
        border-style: solid;
        border-width: 0px;
        border-color: var(--text_on_primary);
        cursor: pointer;
    }

    .dark {
        color: var(--text_on_secondary);
        background: var(--divider);
    }

    .big {
        height: clamp(70px, 10vw, 90px) !important;
        width: clamp(70px, 10vw, 90px) !important;
        margin-bottom: var(--padding_minimum);
    }

    .big .layer-name {
        font-size: 0.80rem;
    }

    .dark:hover {
        color: var(--text_on_secondary);
        background: var(--surface_dark_variant);
    }

    .layer-button:hover {
        background-color: var(--shadow);
    }

    .layer-button .material-icons {
        width: 100%;
        text-align: center;
        position: relative;
        top: 9.5px;
    }

    .icon-img {
        max-height: 100%;
        max-width: 55%;
        width: auto;
        height: auto;
        position: absolute;
        top: 0;
        bottom: 12px;
        left: 0;
        right: 0;
        margin: auto;
    }

    .hasImage {
        background-repeat:no-repeat;
        background-position: center center;
        background-size: 165%;
        color: white;
        text-shadow: 0px 0px 6px var(--background);
        box-shadow: inset 0 -7px 16px -7px rgba(0,0,0,0.9);
        cursor: pointer;
        background-color: var(--text_low_emphasis);
        border-color: var(--divider);
        border-style: solid;
        border-width: 3px;
    }

    .hasImage:hover {
        border-color: var(--secondary_variant);
        background-color: var(--surface_dark_variant);
        background-size: 250%;
        box-shadow: inset 0px 0px 10px rgba(0,0,0,0.9);
    }

    .hasImage:active {
        background-size: 150%;
        background-color: var(--surface_dark);
    }

    .isChecked {
        background-color: var(--secondary_variant);
        color: white;
        text-shadow: 0px 0px 6px var(--background);
    }

    .isChecked:hover {
        background-color: var(--secondary_variant_dark);
    }

</style>
