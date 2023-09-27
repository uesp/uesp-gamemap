<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-invalid-attribute -->
<!-- @component
### Description
 Infobar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (24th Jan, 2023) -->

<script>

    import Icon from "./Icon.svelte";

    export let mapName = "Gamemap";
    export let embedded = false;
    export let lock;

</script>

<markup>
    <div id="watermark" class:watermark={!embedded && !lock} on:contextmenu={(e) => e.stopPropagation()}>
        {#if !embedded}
            {#if lock == MAPLOCK.FULL}
                <Icon name = "lock" size={16}/>
                <b title="Map is locked whilst editing worlds.">Map locked</b>
            {:else if lock == MAPLOCK.PARTIAL}
                <Icon name = "lock" size={16}/>
                <b title="Map is partially locked whilst reverting locations.">Map locked</b>
            {:else if lock >= MAPLOCK.PARTIAL_MARKER}
                <span class="highlight">
                    <Icon name="info" size={16}/>
                    <small><b>Editing Tip</b></small>
                </span>

                {#if lock == MAPLOCK.PARTIAL_MARKER}
                    You can drag the selected marker to move it to a new position.
                {/if}

                {#if lock == MAPLOCK.PARTIAL_NEW_MARKER}
                    Click to add the new marker to the map.
                {/if}

                {#if lock == MAPLOCK.PARTIAL_POLYGON}
                     Drag handles to move them, right click to remove them.<br>
                     Click the green plus (+) to add new points.
                {/if}

                {#if lock == MAPLOCK.PARTIAL_NEW_POLYGON}
                    Click to add new points. Close the shape when you're done.
                {/if}

                {#if lock == MAPLOCK.PARTIAL_NEW_LINE}
                    Click to add new points. Click any handle again when you're done.
                {/if}

            {:else}
                <b><span class="wikiTitle"><a href="//www.uesp.net/wiki/Main_Page" title="Go to UESP home" target='_top'>UESP</a></span> • <a title="Reset this map" href="javascript:void(0);" onclick="gamemap.reset();">{mapName}</a></b>
            {/if}
        {:else}
            <b><span class="wikiTitle"><a href="//www.uesp.net/wiki/Main_Page" title="Go to UESP home" target='_top'>UESP</a></span> • View larger map <Icon name="open_in_new" size="tiny"/></b>
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
        cursor: auto;
        border-radius: var(--padding_small);
        margin-left: 100px;
        margin-right: 100px;
        margin-bottom: 8px;
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


    small {
        text-transform: uppercase;
    }

    .highlight {
        color: var(--highlight_light);
        display: flex;
        align-content: center;
        align-self: center;
        justify-content: center;
        flex-wrap: wrap-reverse;
        gap: 3px;
        padding-top: 3px;
    }

</style>