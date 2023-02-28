<!-- @component
### Description
 Collapsible location header component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->

<script>
    // import svelte core stuff
    import { slide } from 'svelte/transition';

    // import ui components
    import ListItem from './ListItem.svelte';

    // state vars
    export let data;
    export let expanded = false;
    export let title = "This is a header";
    let isArray = Array.isArray(data);

    function onLocationClicked(id) {
        gamemap.goto(id);
    }

</script>

<markup>

    {#if isArray}
        <!-- svelte-ignore missing-declaration -->
        {#each data as item, i}
            {@const worldID = item.id}
            {@const worldName = gamemap.getWorldDisplayNameFromID(worldID)}
            {#if item["children"]}
                <svelte:self data={data[i]} title={worldName} />
            {:else}
                <!-- svelte-ignore missing-declaration -->
                <ListItem title={worldName} selected={gamemap.getCurrentWorld().displayName == worldName} on:click={() => onLocationClicked(gamemap.getWorldFromDisplayName(worldName).id)}/>
            {/if}
        {/each}

    {:else}
        <div class="collapsible">

            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class='collapsible-header waves-effect' class:expanded={expanded} on:click={() => expanded = !expanded}>
                {title}<i class='material-icons'>expand_more</i>
            </div>

            {#if expanded}
                <div class='collapsible-body' in:slide out:slide>
                    <!-- svelte-ignore missing-declaration -->
                    {#if data.id > 0}
                        {@const worldID = data.id}
                        {@const worldName = gamemap.getWorldDisplayNameFromID(worldID)}
                        <!-- svelte-ignore missing-declaration -->
                        <ListItem title={worldName} selected={gamemap.getCurrentWorld().displayName == worldName} on:click={() => onLocationClicked(gamemap.getWorldFromDisplayName(worldName).id)}/>
                    {/if}
                    <svelte:self data={data["children"]}/>
                </div>
            {/if}
        </div>
    {/if}

</markup>

<style>
    .collapsible {
        position: relative;
        border: none;
        margin: 0rem 0 0.2rem 0;
    }

    .collapsible-header {
        background-color: var(--surface_variant_dark) !important;
        font-weight: bold;
        justify-content: space-between;
        padding-left: 1.4em !important;
        display: flex;
        cursor: pointer;
        line-height: 1.5;
        padding: 0.8rem;
        margin-top: 5px;
        padding-left: 0.8rem;
        border-bottom: 2px solid var(--divider);
    }

    .collapsible-body {
        height: inherit;
        display: block !important;
        -webkit-box-sizing: border-box;
        box-sizing: border-box;
        border-bottom: 2px solid var(--divider);
        box-shadow: inset 0px 11px 8px -10px var(--shadow), inset 0px -11px 8px -10px var(--shadow);
        padding-top: var(--padding_small);
        padding-right: 0px;
        padding-bottom: 0px;
        padding-left: 0px;
    }

    .collapsible-header.expanded {
        background-color: var(--surface_variant) !important;
    }

    div.collapsible-header i {
        transition: all 0.2s ease-out;
    }

    .collapsible-header i {
        width: 2rem;
        font-size: 1.6rem;
        display: inline-block;
        text-align: center;
        margin-right: 0rem;
    }

    .collapsible-header.expanded i {
        transform: rotate(180deg);
    }
</style>