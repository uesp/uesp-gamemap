<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore missing-declaration -->
<!-- @component
    ### Description
 Layer switcher widget for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (24th Jan, 2023) -->

<script>
    // import core svelte stuff
    import { fade, fly, slide } from 'svelte/transition';

    // import ui components
    import Divider from "./Divider.svelte";
    import LayerButton from "./LayerButton.svelte";
    import LayerOptionsContainer from './LayerOptionsContainer.svelte';
    import Switch from './Switch.svelte';
    import DropdownMenu from './DropdownMenu.svelte';
    import Icon from './Icon.svelte';

    // state vars
    export let mapState;
    export let lock;

    let isHovered = false;
    let expandGridOptions = getPrefs("expandgridoptions", true);

    $: world = mapState.world;
    $: gridData = mapState.gridData ?? {gridShown : true || true, cellResource: world.hasCellResources() ? "none" : null};
    $: isGridShown = mapState.gridData?.gridShown ?? mapState.isGridShown();
    $: gridEnabled = mapState.isGridEnabled();
    $: hasMultipleLayers = world.hasMultipleLayers();
    $: layers = world.layers;
    $: layerName = mapState && gamemap.getNextTileLayerName();
    $: layerImage = (mapState && hasMultipleLayers) ? gamemap.getMapTileImageURL(world, layerName, true) : null;

    function updateGrid(data) {
        if (data == true) {
            gamemap.toggleGrid(gridData);
        } else if (data == false || data == null) {
            gamemap.toggleGrid(null);
        } else {
            let mergedGridData = {...gridData, ...data};
            gamemap.toggleGrid(mergedGridData);
        }
        isHovered = false;
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
</script>

<markup>
    <!-- Layer switcher Widget -->
    <div class="layer_widget_root" on:mouseenter={() => isHovered = true} on:mouseleave={() => isHovered = false} in:fly|global="{{ x: -5, duration: 250 }}" out:fade|global="{{duration: 75}}" class:lock={lock} on:contextmenu={(e) => e.stopPropagation()}>

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
            <div id="layer_options_container" in:fly|global="{{ x: -15, duration: 200 }}" out:fade|global="{{duration: 125}}">
                <span id="pip"></span>
                <div class="layer_widget_options">
                    <!-- Dynamic map layers -->
                    {#if hasMultipleLayers}
                        {#each layers as layer}
                            <LayerButton on:onClick={onLayerClicked} label={layer.name.toSentenceCase()} image={gamemap.getMapTileImageURL(gamemap.getCurrentWorld(), layer.name, true)}/>
                        {/each}
                        {#if world.hasGrid()}<Divider direction="vertical"></Divider>{/if}
                    {/if}

                    <!-- Grid layers -->
                    {#if world.hasGrid()}
                        <LayerButton label="Cell Grid" tooltip="Toggle cell grid" icon="grid_on" checked={isGridShown} on:onClick={e => updateGrid(e.detail)}/>
                    {/if}

                </div>
            </div>
        {/if}
    </div>

    {#if gridEnabled}
        <LayerOptionsContainer>
            <div class="cell_grid_options" on:contextmenu={(e) => e.stopPropagation()}>

                <div id="close_button" class="waves-effect" title="Close" on:click={() => updateGrid(null)}><Icon name="close" size="tiny"></Icon></div>

                <b class="waves-effect" title="Click to show/hide grid options" style="display: -webkit-box; width: fit-content;" on:click={() => {setPrefs("expandgridoptions", !getPrefs("expandgridoptions")); expandGridOptions = getPrefs("expandgridoptions");}}>Grid Options <Icon name={(expandGridOptions) ? "expand_less" : "expand_more"} size="tiny"></Icon></b>

                {#if expandGridOptions}
                    <div in:slide|global out:slide|global>
                        <Switch label="Show Cell Grid" tooltip="Toggle cell grid" enabled={isGridShown} on:change={(e) => {updateGrid({gridShown: e.detail})}}></Switch>

                        <!-- Cell resource dropdown -->
                        {#if world.hasCellResources()}
                            <DropdownMenu label="Show Resource" hint="Select resource..." tooltip="Select cell resource" selected={gridData.cellResource} on:change={(e) => updateGrid({cellResource: e.detail})} align="right">
                                {@const keys = Object.keys(gamemap.getMapConfig().cellResources)}
                                {@const names = Object.values(gamemap.getMapConfig().cellResources)}
                                    {#each keys as value, i}
                                        <option value={value.toLowerCase()} selected={gridData.cellResource == value.toLowerCase()}>{names[i]}</option>
                                    {/each}
                            </DropdownMenu>

                            <div id="cell_resource_key">
                                <b style="display: flex; padding-right: 4px;" title="Cell resource count">Key:</b>
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
        width: auto;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        position: relative;
        display: flex;
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

    #layer_options_container {
        display: flex;
        flex-direction: row;
        margin-left: 4px;
    }

    #pip {
        content: "\A";
        border-style: solid;
        border-width: 10px 10px 10px 0;
        border-color: transparent var(--primary_variant_light) transparent transparent;
        position: relative;
        align-self: center;
        height: 10px;
        z-index: 10;
    }

</style>