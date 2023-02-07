<!-- @component
### Description
 Watermark component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (24th Jan, 2023) -->

<script>

    import Icon from "./Icon.svelte";

    export let mapName = "Gamemap";
    export let embedType = "none";
    let isEmbedded = false;
    if (embedType != "none") {
        isEmbedded = true;
    }

</script>

<markup>
    <div id="watermark" class:watermark={!isEmbedded}>
        {#if !isEmbedded}
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore missing-declaration -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-invalid-attribute -->
            <b><span class="wikiTitle"><a href="//www.uesp.net/wiki/Main_Page" title="Go to UESP home">UESP</a></span> • <a title="Reset this map" href="javascript:;" onclick="gamemap.reset();">{mapName}</a></b>
        {:else}
            <b>{#if embedType == "uesp"}<span class="wikiTitle"><a href="//www.uesp.net/wiki/Main_Page" title="Go to UESP home">UESP</a></span> • {/if}View larger map <Icon name="open_in_new" size="tiny"/></b>
        {/if}
    </div>
</markup>

<style>
    #watermark {
        pointer-events: visible;
        display: inline-block;
        width: auto;
        margin: 0 auto;
        font-size: 1.1rem;
        text-shadow: 0px 0px 5px var(--background) !important;
        background-color: var(--shadow) !important;
        border: none !important;
        box-shadow: 0px 0px 10px 6px var(--shadow) !important;
        padding-left: 5px;
        padding-right: 5px;
        transition: opacity ease 150ms;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    #watermark:hover {
        opacity: 1.0;
    }

    #watermark a {
        color: white;
        text-decoration: none !important;
    }

    #watermark a:hover {
        text-decoration: underline;
        border-bottom: solid white;
        border-width: medium;
    }

    .watermark {
        opacity: 0.55;
    }

</style>


<!--
let coords = (isDebug && this.getCurrentWorld().totalWidth != null ) ? this.toXY(map.getCenter(), true) : null;
map.attributionControl.setPrefix('<a href="//www.uesp.net/wiki/Main_Page" title="Go to UESP home">);
map.attributionControl.addAttribution("<span id='mapAttribution'></span>");
document.querySelector('#mapAttribution').innerHTML = '<a id="mapNameLink" onclick="resetMap()" href="javascript:void(0);"
title="Reset the map view">'+ mapConfig.mapTitle +'</a>  |  ' + ((coords != null) ? "XY: " + Math.trunc(coords.x) + ", " + Math.trunc(coords.y)  + "  |  " : "") + '
<a id="mapFeedbackLink" href="https://en.uesp.net/wiki/UESPWiki_talk:Maps" title="Give feedback about this map">Send Feedback</a>'; -->