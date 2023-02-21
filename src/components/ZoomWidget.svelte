<!-- @component
### Description
 Zoom widget component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (10th Jan, 2023) -->

<script>
	// import svelte core stuff
    import { fade, fly } from 'svelte/transition';
    import { createEventDispatcher } from "svelte";
    import "long-press-event";

    // import ui components
    import Icon from "./Icon.svelte";
    import Divider from "./Divider.svelte";

    export let currentZoom;

    const dispatch = createEventDispatcher();

    $: canZoomIn = currentZoom < (gamemap.getMaxZoom() - 0.03);
    $: canZoomOut = currentZoom > gamemap.getMinZoom();

    // long press listener
    document.addEventListener('long-press', function(e) {
        if (e.target.closest(".btn_zoom")) {
            let zoomButton = e.target.closest(".btn_zoom");
            zoom(zoomButton.id.replace("btn_zoom_", ""));
        }
    });

    // zoom function
    function zoom(amount) {

        let zoomAmount;

        if (typeof amount === "string") {
            zoomAmount = (amount == "in") ? gamemap.getMaxZoom() : 0;

            // if > defaultzoomlevel, and longpress zoom out, then
            // do gamemap.reset(false) where the boolean determines whether
            // just reset the current map view or go back to default map
            // if < default zoomlevel, then just zoomamount 0
        } else {
            zoomAmount = gamemap.getCurrentZoom() + amount;
        }

        dispatch("zoomclicked", zoomAmount);
    }

</script>

<markup>
    <div id="zoom_widget" in:fly="{{ x: 5, duration: 250 }}" out:fade="{{duration: 75}}">
        <!-- svelte-ignore missing-declaration -->
        <button on:click={() => zoom(gamemap.getMapObject().options.zoomDelta)} class="btn_zoom waves-effect long-press" id="btn_zoom_in" tabindex="-1" title="Zoom in" disabled={!canZoomIn} data-long-press-delay="600"><Icon name="add"/></button>
        <Divider/>
        <!-- svelte-ignore missing-declaration -->
        <button on:click={() => zoom(-gamemap.getMapObject().options.zoomDelta)} class="btn_zoom waves-effect long-press" id="btn_zoom_out" tabindex="-1" title="Zoom out" disabled={!canZoomOut} data-long-press-delay="600"><Icon name="remove"/></button>
    </div>
</markup>

<style>
    #zoom_widget {
        position: absolute;
        background: var(--primary_variant_light);
        border-radius: 64px;
        z-index: 1000;
        bottom: var(--padding_minimum);
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