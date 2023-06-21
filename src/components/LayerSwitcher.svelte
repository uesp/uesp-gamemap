<!-- @component
### Description
 Layer switcher widget for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (24th Jan, 2023) -->

<script>
    // import core svelte stuff
    import { fade, fly, slide } from 'svelte/transition';
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
    export let gridEnabled = gamemap.isGridShown();
    export let lock;
    $: hasMultipleLayers = world.hasMultipleLayers();
    $: layers = world.layers;
    $: layerName = gamemap.getNextTileLayerName();
    $: layerImage = (hasMultipleLayers) ? gamemap.getMapTileImageURL(world, layerName, true) : null;

    const dispatch = createEventDispatcher();

    let isHovered = false;
    let resourceGridEnabled = world.hasCellResources();
    let expandGridOptions = getPrefs("expandgridoptions", true);
    let currentCellResource = "None";
    let doCellGrid = true;

    // event listeners
    function onMouseEnter() {
        if (world != gamemap.getCurrentWorld()) {
            world = gamemap.getCurrentWorld();
        }
        isHovered = true;
        gridEnabled = gamemap.isGridShown();
        resourceGridEnabled = world.hasCellResources();
    }
    function onMouseExit() {
        isHovered = false;
        gridEnabled = gamemap.isGridShown();
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
        gamemap.toggleGrid(event.detail, doCellGrid, currentCellResource);
        dispatch("gridChecked", event.detail);
    }

</script>

<markup>
    <!-- Layer switcher Widget -->
    <div class="layer_widget_root" on:mouseenter={onMouseEnter} on:mouseleave={onMouseExit} in:fly="{{ x: -5, duration: 250 }}" out:fade="{{duration: 75}}" class:lock={lock} on:contextmenu={(e) => e.stopPropagation()}>

        <!-- Primary layer switcher button -->
        <button id="btn_layer_widget_switcher" class:hasLayerImage={hasMultipleLayers} class="waves-effect" on:click={onLayerClicked} style="background-image: url({layerImage});">
            Layers
            <i class="small material-icons" style="position: relative; bottom: 45px;">layers</i>
            {#if hasMultipleLayers}
                <p id="layer-name" class="layer-name" style="bottom: 12px;">{layerName.toSentenceCase()}</p>
            {/if}
        </button>

        <!-- Additional layer options (on hover) -->
        {#if isHovered}
            <div class="layer_widget_options" in:fly="{{ x: -15, duration: 200 }}" out:fade="{{duration: 125}}">

                <!-- Dynamic map layers -->
                {#if hasMultipleLayers}
                    {#each layers as layer}
                        <!-- svelte-ignore missing-declaration -->
                        <LayerButton on:onClick={onLayerClicked} label={layer.name.toSentenceCase()} image={gamemap.getMapTileImageURL(gamemap.getCurrentWorld(), layer.name, true)}/>
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
            <div class="cell_grid_options" on:contextmenu={(e) => e.stopPropagation()}>
                <!-- svelte-ignore missing-declaration -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div id="close_button" class="waves-effect" title="Close" on:click={() => onGridChecked({detail: false})}><Icon name="close" size="tiny"></Icon></div>

                <!-- svelte-ignore missing-declaration -->
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <b class="waves-effect" title="Click to show/hide grid options" style="display: -webkit-box; width: fit-content;" on:click={() => {setPrefs("expandgridoptions", !getPrefs("expandgridoptions")); expandGridOptions = getPrefs("expandgridoptions");}}>Grid Options <Icon name={(expandGridOptions) ? "expand_less" : "expand_more"} size="tiny"></Icon></b>

                {#if expandGridOptions}
                    <div in:slide out:slide>
                        <Switch label="Show Cell Grid" tooltip="Toggle cell grid" enabled={doCellGrid} on:change={(e) => {doCellGrid = e.detail; onGridChecked({detail: true})}}></Switch>

                        <!-- Cell resource dropdown -->
                        {#if world.hasCellResources()}
                            <!-- svelte-ignore missing-declaration -->
                            <DropdownMenu label="Show Resource" hint="Select resource..." tooltip="Select cell resource" on:change={(e) => {currentCellResource = e.detail; onGridChecked({detail: true})}} align="left">
                                {@const keys = Object.keys(gamemap.getMapConfig().cellResources)}
                                {@const names = Object.values(gamemap.getMapConfig().cellResources)}
                                    {#each keys as value, i}
                                        <option value={value} selected={currentCellResource == value}>{names[i]}</option>
                                    {/each}
                            </DropdownMenu>

                            <div id="cell_resource_key">
                                <b style="display: flex; padding-right: 4px;" title="Cell resource count">Key:</b>
                                <!-- svelte-ignore missing-declaration -->
                                {#each gamemap.getMapConfig().cellResourceColours as style,i}
                                    {@const cellResourceKeyList = ["<2", "~5", "~10", "~20", "~40", "50+"]}
                                    <div class="cell_resource_key_item" style="background-color:{style};">{cellResourceKeyList[i]}</div>
                                {/each}
                            </div>
                        {/if}
                    </div>
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
        pointer-events: visible;
        cursor: auto;
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

    #cell_resource_key {
        display: flex;
        margin-top: 8px;
        justify-content: space-between;
    }

    .cell_resource_key_item {
        padding-left: 2px;
        padding-right: 2px;
        border-style: solid;
        border-width: 1.5px;
        border-color: var(--divider);
        border-radius: 6px;
    }

    .lock {
        opacity: 0.5;
        pointer-events: none;
    }


</style>