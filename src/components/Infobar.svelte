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
            {#if lock == "full"}
                <Icon name = "lock" size={16}/>
                <b title="Map is locked while editing worlds">Locked</b>
            {:else if lock == "partial"}
                <Icon name = "lock_open" size={16}/>
                <b title="Map is partially locked while editing locations">Partially locked</b>
            {:else}
                <!-- svelte-ignore a11y-invalid-attribute -->
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