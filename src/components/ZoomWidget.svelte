<!-- @component
### Description
 Zoom widget component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (10th Jan, 2023) -->

<script>
	// import svelte core stuff
	import { getContext } from 'svelte';
    import { createEventDispatcher } from "svelte";

    // import ui components
    import Icon from "./Icon.svelte";
    import Divider from "./Divider.svelte";

    const dispatch = createEventDispatcher();

    let maxZoomLevel = gamemap.getMaxZoom();
    let currentZoomLevel = gamemap.getCurrentZoom();

    let canZoomIn = true;
    let canZoomOut = true;


    function zoomIn() {
        let zoomStep = 	gamemap.getMapObject().options.zoomDelta;
        console.log("Zooming in");
        dispatch("zoomclicked", "in");
    }

    function zoomInLongClick() {
        console.log("Zooming in");
        // zoom in to max zoom level
    }

    function zoomOut() {
        let zoomStep = 	gamemap.getMapObject().options.zoomDelta;
        console.log("Zooming out");
        dispatch("zoomclicked", "out");
        print(gamemap);
        print(zoomStep);
    }
</script>

<markup>
    <div id="zoom_widget">
        <button on:click={zoomIn} class="btn_zoom waves-effect" id="btn_zoom_in" tabindex="-1" title="Zoom in" disabled={!canZoomIn}><Icon name="add"/></button>
        <Divider/>
        <button on:click={zoomOut} class="btn_zoom waves-effect" id="btn_zoom_out" tabindex="-1" title="Zoom out"><Icon name="remove" disabled={!canZoomOut}/></button>
    </div>
</markup>

<style>
    #zoom_widget {
        position: absolute;
        background: var(--primary_variant_light);
        border-radius: 64px;
        z-index: 1000;
        bottom: var(--padding_medium);
        right: var(--padding_minimum);
        width: var(--appbar_dimen);
        height: 100px;
        display: flex;
        flex-direction: column;
        flex: auto;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
    }

    .btn_zoom {
        width: 100%;
        flex-grow: 1;
        background: transparent;
        border: none;
        transform: translateZ(0);
        z-index: 1001;
        border-radius: 64px;
        transition: all ease-in-out 50ms;
    }

    .btn_zoom:hover:disabled  {
        cursor: default;
    }

    .btn_zoom:hover:enabled, .btn_zoom:active:enabled {
        background: var(--divider);
    }

</style>