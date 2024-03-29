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
    export let lock;

    const dispatch = createEventDispatcher();

    $: canZoomIn = currentZoom < (gamemap.getMaxZoom());
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
        let doReportZoom = true;

        if (typeof amount === "string") {

            if (amount == "out") {

                if (gamemap.getCurrentZoom() > gamemap.getMaxBoundsZoom()) {
                    doReportZoom = false;
                    gamemap.reset(true);
                } else {
                    zoomAmount = gamemap.getMinZoom();
                }
            } else if (amount == "in") {

                if (gamemap.getCurrentZoom() < gamemap.getMaxBoundsZoom()) {
                    doReportZoom = false;
                    gamemap.reset(true);
                } else {
                    zoomAmount = gamemap.getMaxZoom();
                }

            }

        } else {
            zoomAmount = gamemap.getCurrentZoom() + amount;
        }

        if (doReportZoom) {
            gamemap.setZoomTo(zoomAmount);
        }

    }

</script>

<markup>
    <!-- svelte-ignore missing-declaration -->
    <div id="zoom_widget" in:fly|global="{{ x: 5, duration: 250 }}" out:fade|global="{{duration: 75}}" class:lock={lock == MAPLOCK.FULL} class:disabled={lock == MAPLOCK.FULL} on:contextmenu={(e) => e.stopPropagation()}>
        <!-- svelte-ignore missing-declaration -->
        <button on:click={() => zoom(gamemap.getMapObject().options.zoomDelta)} class="btn_zoom waves-effect long-press" id="btn_zoom_in" tabindex="-1" title="Zoom in" disabled={!canZoomIn} data-long-press-delay="600"><Icon name="add"/></button>
        <Divider/>
        <!-- svelte-ignore missing-declaration -->
        <button on:click={() => zoom(-gamemap.getMapObject().options.zoomDelta)} class="btn_zoom waves-effect long-press" id="btn_zoom_out" tabindex="-1" title="Zoom out" disabled={!canZoomOut} data-long-press-delay="600"><Icon name="remove"/></button>
    </div>
</markup>

<style>
    #zoom_widget {
        cursor: auto;
        position: absolute;
        background: var(--primary_variant_light);
        border-radius: var(--radius_largest);
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

    .lock {
        opacity: 0.5;
        pointer-events: none;
    }

    .btn_zoom {
        width: 100%;
        flex-grow: 1;
        background: transparent;
        border: none;
        transform: translateZ(0);
        z-index: 1001;
        border-radius: var(--radius_largest);
        transition: all ease-in-out 50ms;
    }

    .btn_zoom:hover:disabled  {
        cursor: default;
    }

    .btn_zoom:hover:enabled, .btn_zoom:active:enabled {
        background: var(--divider);
    }

</style>