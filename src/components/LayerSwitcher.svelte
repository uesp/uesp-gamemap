<!-- @component
### Description
 Layer switcher widget for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (24th Jan, 2023) -->

<script>

    // import ui components
    import Divider from "./Divider.svelte";
    import LayerButton from "./LayerButton.svelte";

    // state vars
    let isHovered = false;
    let hasMultipleLayers = gamemap.hasMultipleMapLayers();
    let layers = gamemap.getCurrentWorld().layers;
    $: gridEnabled = gamemap.isGridEnabled();
    let resourceGridEnabled = gamemap.isResourceGridEnabled();

    $: layerName = gamemap.getNextTileLayerName();
    $: layerImage = (hasMultipleLayers) ? gamemap.getMapTileImageURL(gamemap.getCurrentWorld(), layerName, true) : null;

    // event listeners
    function onMouseEnter() {
        isHovered = true;
        gridEnabled = gamemap.isGridEnabled();
        resourceGridEnabled = gamemap.isResourceGridEnabled();
    }
    function onMouseExit() {
        isHovered = false;
        gridEnabled = gamemap.isGridEnabled();
        resourceGridEnabled = gamemap.isResourceGridEnabled();
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
    <div class="layer_widget_root" on:mouseenter={onMouseEnter} on:mouseleave={onMouseExit}>

        <!-- Primary layer switcher button -->
        <button id="btn_layer_widget_switcher" class:hasLayerImage={hasMultipleLayers} class="waves-effect" on:click={onLayerClicked} style="background-image: url({layerImage});">
            Layers
            <i class="small material-icons" style="position: relative; bottom: 45px;">layers</i>
            {#if hasMultipleLayers}
                <p id="layer-name" class="layer-name" style="bottom: 12px;">{layerName.toLowerCase().replace(/\.\s*([a-z])|^[a-z]/gm, s => s.toUpperCase())}</p>
            {/if}
        </button>

        <!-- Additional layer options (on hover) -->
        <div class="layer_widget_options" class:isShown={isHovered}>

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
            {#if gamemap.getCurrentWorld().hasGrid}
                <LayerButton label="Cell Grid" tooltip="Toggle cell grid" icon="grid_on" checked={gridEnabled} on:onClick={(event) => (gamemap.toggleCellGrid(event.detail))}/>
            {/if}

            <!-- svelte-ignore missing-declaration -->
            {#if gamemap.getCurrentWorld().hasCellResources}
                <LayerButton label="Resources" tooltip="Toggle resource grid" icon="local_florist" checked={resourceGridEnabled}/>
            {/if}
        </div>
    </div>
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
        opacity: 0;
        display: none;
    }

    .isShown {
        display: flex;
        animation: fadein 0.2s;
        opacity: 1;
    }

    @keyframes fadein {
        0% {
            opacity: 0;
            left: -10px;
        }

        100% {
            opacity: 1;
            left: 0px;
        }
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

</style>