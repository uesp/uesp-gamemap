<!-- @component
### Description
 Watermark component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (24th Jan, 2023) -->



<!-- TODO: make ctll click make watermark clickable -->

<script>
    export let mapName = "Gamemap";
    export let embedType = "none";
    let isEmbedded = false;
    if (embedType != "none") {
        isEmbedded = true;
    }

</script>


<markup>
    <div id=watermark_container>
        <div id="watermark">

            {#if !isEmbedded}
                <b><span class="wikiTitle"><a href="//www.uesp.net/wiki/Main_Page" title="Go to UESP home">UESP</a></span> • {mapName}</b>
            {:else}
                <b>Open bigger map</b>
            {/if}
        </div>
    </div>
</markup>


<style>

    #watermark_container {
        width: 100%;
        pointer-events: none;
        position: fixed;
        bottom: var(--padding_medium);
        color: white;
        z-index: 800;
        text-align: center;
    }

    #watermark {
        pointer-events: visible;
        display: inline-block;
        width: auto;
        margin: 0 auto;
        font-size: 1.3rem;
        text-shadow: 0px 0px 5px var(--background) !important;
        background-color: var(--shadow) !important;
        border: none !important;
        box-shadow: 0px 0px 10px 6px var(--shadow) !important;
        padding-left: 5px;
        padding-right: 5px;
        opacity: 0.60;
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

</style>


<!--
let coords = (isDebug && this.getCurrentWorld().totalWidth != null ) ? this.toXY(map.getCenter(), true) : null;
map.attributionControl.setPrefix('<a href="//www.uesp.net/wiki/Main_Page" title="Go to UESP home">);
map.attributionControl.addAttribution("<span id='mapAttribution'></span>");
document.querySelector('#mapAttribution').innerHTML = '<a id="mapNameLink" onclick="resetMap()" href="javascript:void(0);"
title="Reset the map view">'+ mapConfig.mapTitle +'</a>  |  ' + ((coords != null) ? "XY: " + Math.trunc(coords.x) + ", " + Math.trunc(coords.y)  + "  |  " : "") + '
<a id="mapFeedbackLink" href="https://en.uesp.net/wiki/UESPWiki_talk:Maps" title="Give feedback about this map">Send Feedback</a>'; -->