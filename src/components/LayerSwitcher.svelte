<!-- @component
### Description
 Layer switcher widget for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (24th Jan, 2023) -->

<script>

    // state vars
    let isHovered = false;
    let hasLayerImage = gamemap.getMapConfig().tileLayers.length > 1;

    print(hasLayerImage);
    print(gamemap.getMapConfig().tileURL);

    // event listeners
    function onMouseEnter() { isHovered = true;}
    function onMouseExit() { isHovered = false;}

</script>

<markup>
    <!-- Layer switcher Widget -->
    <div class="layer_widget_root" on:mouseenter={onMouseEnter} on:mouseleave={onMouseExit}>

        <!-- Primary layer switcher button -->
        <button id="btn_layer_widget_switcher" has-background-image="true" class="waves-effect">
            Layers
            <i class="small material-icons" style="position: relative; bottom: 45px;">layers</i>
            <p id="layer-name" class="layer-name" style="bottom: 12px;">Gridmap</p>
        </button>

        <!-- Additional layer options (on hover) -->
        <div class="layer_widget_options" class:isShown={isHovered}>

            <div id="btn_toggle_grid waves-effect" class='btn_layer_toggle layer-button' title="Toggle cell grid">
                <i class="material-icons">grid_on</i>
                <p class="layer-name">Cell Grid</p>
                <input type="checkbox" onchange="toggleCellGrid(this.checked)">
            </div>

            <div id="btn_toggle_resource_grid waves-effect" class='btn_layer_toggle layer-button' title="Toggle resource grid">
                <i class="material-icons">local_florist</i>
                <p class="layer-name">Resources</p>
                <input type="checkbox" onchange="toggleCellResources(this.checked)">
            </div>
        </div>
    </div>
</markup>


<style>
    .layer_widget_root {
        position: absolute;
        z-index: 900;
        bottom: var(--padding_medium);
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
        position: relative;
        left: -7%;
        top: 32%;
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
        background-image: url('https://cdn.discordapp.com/attachments/979030537773650013/1061026748684320838/eso64_2022-10-15_23-05-09_1.jpg');
        background-repeat:no-repeat;
        background-position: center center;
        background-size: 120%;
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

    #btn_layer_widget_switcher[has-background-image="true"] .material-icons {
        display: none;
    }

    #btn_layer_widget_switcher:hover {
        border-color: var(--surface_variant_dark);
        background-color: var(--surface_dark_variant);
        background-size: 250%;
        box-shadow: 0px 1.5px 4px 4px var(--shadow), inset 0px 0px 10px rgba(0,0,0,0.9);
    }

    #btn_layer_widget_switcher[has-background-image="true"]:hover {
        padding-top: 30px;
    }

    #btn_layer_widget_switcher #layer-name {
        transition: all 0.4s;
        opacity: 0;
    }

    #btn_layer_widget_switcher[has-background-image="true"]:hover #layer-name {
        opacity: 1;
    }

    #btn_layer_widget_switcher:active {
        background-size: 150%;
        background-color: var(--surface_dark);
    }


</style>