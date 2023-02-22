<!-- @component
### Description
 Layer switcher widget for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (24th Jan, 2023) -->

<script>
    // import core svelte stuff
    import { fade, fly } from 'svelte/transition';
    import { createEventDispatcher } from "svelte";

    // import ui components
    import Divider from "./Divider.svelte";
    import LayerButton from "./LayerButton.svelte";
    import LayerOptionsContainer from './LayerOptionsContainer.svelte';
    import Switch from './Switch.svelte';
    import DropdownMenu from './DropdownMenu.svelte';
    import Icon from './Icon.svelte';

    // state vars
    export let world = gamemap.getCurrentWorld();
    $: hasMultipleLayers = world.hasMultipleLayers();
    $: layers = world.layers;
    $: gridEnabled = gamemap.isGridEnabled();
    $: layerName = gamemap.getNextTileLayerName();
    $: layerImage = (hasMultipleLayers) ? gamemap.getMapTileImageURL(world, layerName, true) : null;

    const dispatch = createEventDispatcher();

    let isHovered = false;
    let resourceGridEnabled = world.hasCellResources();
    let expandGridOptions = getPrefs("expandgridoptions", true);

    // event listeners
    function onMouseEnter() {
        if (world != gamemap.getCurrentWorld()) {
            world = gamemap.getCurrentWorld();
        }
        isHovered = true;
        gridEnabled = gamemap.isGridEnabled();
        resourceGridEnabled = world.hasCellResources();
    }
    function onMouseExit() {
        isHovered = false;
        gridEnabled = gamemap.isGridEnabled();
        resourceGridEnabled = world.hasCellResources();
    }

    function onLayerClicked(event) {

        if (event.target == null) {

            if (isMobile()) {
                isHovered = false;
            }
            gamemap.setTileLayerTo(event.detail);
        } else {
            gamemap.setTileLayerTo(gamemap.getNextTileLayerIndex());
        }
        layerName = gamemap.getNextTileLayerName();
    }

    function onGridChecked(event) {
        gridEnabled = event.detail;
        isHovered = false;
        gamemap.toggleCellGrid(event.detail)
        dispatch("gridChecked", event.detail);
    }

</script>

<markup>
    <!-- Layer switcher Widget -->
    <div class="layer_widget_root" on:mouseenter={onMouseEnter} on:mouseleave={onMouseExit} in:fly="{{ x: -5, duration: 250 }}" out:fade="{{duration: 75}}">

        <!-- Primary layer switcher button -->
        <button id="btn_layer_widget_switcher" class:hasLayerImage={hasMultipleLayers} class="waves-effect" on:click={onLayerClicked} style="background-image: url({layerImage});">
            Layers
            <i class="small material-icons" style="position: relative; bottom: 45px;">layers</i>
            {#if hasMultipleLayers}
                <p id="layer-name" class="layer-name" style="bottom: 12px;">{layerName.toLowerCase().replace(/\.\s*([a-z])|^[a-z]/gm, s => s.toUpperCase())}</p>
            {/if}
        </button>

        <!-- Additional layer options (on hover) -->
        {#if isHovered}
            <div class="layer_widget_options" in:fly="{{ x: -15, duration: 200 }}" out:fade="{{duration: 125}}">

                <!-- Dynamic map layers -->
                {#if hasMultipleLayers}
                    {#each layers as layer}
                        <!-- svelte-ignore missing-declaration -->
                        <LayerButton on:onClick={onLayerClicked} label={layer.name.toLowerCase().replace(/\.\s*([a-z])|^[a-z]/gm, s => s.toUpperCase())} image={gamemap.getMapTileImageURL(gamemap.getCurrentWorld(), layer.name, true)}/>
                    {/each}
                    <Divider direction="vertical"></Divider>
                {/if}

                <!-- Predefined optional map layers -->
                <!-- svelte-ignore missing-declaration -->
                {#if world.hasGrid()}
                    <LayerButton label="Cell Grid" tooltip="Toggle cell grid" icon="grid_on" checked={gridEnabled} on:onClick={onGridChecked}/>
                {/if}

            </div>
        {/if}
    </div>

    {#if gridEnabled}
        <LayerOptionsContainer>
            <div class="cell_grid_options">
                <!-- svelte-ignore missing-declaration -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div id="close_button" class="waves-effect" title="Close" on:click={() => onGridChecked({detail: false})}><Icon name="close" size="tiny"></Icon></div>

                <!-- svelte-ignore missing-declaration -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <b class="waves-effect" title="Click to show/hide grid options" on:click={() => {setPrefs("expandgridoptions", !getPrefs("expandgridoptions")); expandGridOptions = getPrefs("expandgridoptions");}}>Grid Options <Icon name={(expandGridOptions) ? "expand_less" : "expand_more"} size="tiny"></Icon></b>

                {#if expandGridOptions}
                    <Switch label="Show Cell Labels" enabled={true}></Switch>

                    <!-- Cell resource dropdown -->
                    {#if world.hasCellResources()}
                        <DropdownMenu label="Show Resource" hint="Select resource...">
                            {@const keys = Object.keys(gamemap.getMapConfig().cellResources)}
                            {@const names = Object.values(gamemap.getMapConfig().cellResources)}
                                {#each keys as value, i}
                                    <option value={value} selected={0}>{names[i]}</option>
                                {/each}
                        </DropdownMenu>

                        <!-- <div id="gmCellResourceGuide" style="display: none;">
                            <div class="gmCRGuideBox1">1-2</div>
                            <div class="gmCRGuideBox2">3-5</div>
                            <div class="gmCRGuideBox3">6-10</div>
                            <div class="gmCRGuideBox4">11-20</div>
                            <div class="gmCRGuideBox5">21-50</div>
                            <div class="gmCRGuideBox6">+51</div>
                        </div> -->
                    {/if}
                {/if}
            </div>
        </LayerOptionsContainer>
    {/if}
</markup>

<style>
    .layer_widget_root {
        position: absolute;
        z-index: 900;
        bottom: var(--padding_minimum);
        left: var(--padding_minimum);
        width: fit-content;
        max-width: var(--search_pane_width);
        display: flex;
    }

    .layer_widget_options {
        background-color: var(--primary_variant_light);
        border-radius: var(--padding_minimum);
        margin-left: var(--padding_small);
        width: auto;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        position: relative;
        display: flex;
    }

    .layer_widget_options:before {
        content: "\A";
        border-style: solid;
        border-width: 10px 15px 10px 0;
        border-color: transparent var(--primary_variant_light) transparent transparent;
        position: absolute;
        left: -5%;
        top: 35%;
        height: 10px;
    }

    .layer-name {
        font-size: 0.75rem;
        font-weight: bold;
        pointer-events: none;
        text-align: center;
        position: relative;
        bottom: 3px;
    }

    #btn_layer_widget_switcher {
        flex-shrink: 0;
        height: var(--layer_widget_dimen);
        width: var(--layer_widget_dimen);
        background-repeat:no-repeat;
        background-position: center center;
        background-size: 165%;
        border-radius: var(--padding_minimum);
        box-shadow: 0px 1.5px 4px 4px var(--shadow), inset 0 -7px 16px -7px rgba(0,0,0,0.9);
        border-style: solid;
        border-color: var(--primary);
        transition: all 0.4s;
        padding-top: 36px;
        font-weight: bold;
        color: white;
        text-shadow: 0px 0px 6px var(--background);
        cursor: pointer;
        background-color: var(--text_low_emphasis);
    }

    .hasLayerImage .material-icons {
        display: none;
    }

    #btn_layer_widget_switcher:hover {
        border-color: var(--surface_variant_dark);
        background-color: var(--surface_dark_variant);
        background-size: 250%;
        box-shadow: 0px 1.5px 4px 4px var(--shadow), inset 0px 0px 10px rgba(0,0,0,0.9);
    }

    #btn_layer_widget_switcher.hasLayerImage:hover {
        padding-top: 30px;
    }

    #btn_layer_widget_switcher #layer-name {
        transition: all 0.4s;
        opacity: 0;
    }

    #btn_layer_widget_switcher.hasLayerImage:hover #layer-name {
        opacity: 1;
    }

    #btn_layer_widget_switcher:active {
        background-size: 150%;
        background-color: var(--surface_dark);
    }
    .cell_grid_options {
        pointer-events: visible;
        display: inline-block;
        background-color: var(--primary);
        padding: var(--padding_small);
        width: auto;
        min-width: 240px;
        box-shadow: 0px 0px 10px 6px var(--shadow) !important;
        margin: 0 auto;
        color:black;
        border-radius: var(--padding_medium) !important;
    }

    #close_button {
        display: block;
        float: right;
    }

</style>