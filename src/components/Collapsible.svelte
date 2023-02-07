<!-- @component
### Description
 Collapsible header component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->

<script>
    // import svelte core stuff
	import { onMount } from 'svelte';

    export let title = "This is a header";
    export let data;
    let expanded = false;
    let collapsible = null;

    // initiate collapsible
    onMount(async () => {
        var elems = document.querySelectorAll('.collapsible');
        M.Collapsible.init(elems, {
            onOpenStart : () => { expanded = true },
            onCloseStart : () => { expanded = false },
        });
	});
</script>

<markup>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <ul class='collapsible' class:expanded={expanded} bind:this={collapsible}>
        <li class:active={expanded}>
            <div class='collapsible-header waves-effect'>
                {title}
                <i class='material-icons'>expand_more</i>
            </div>
            <div class='collapsible-body'>
                {#if expanded}
                    <b>ligma balls</b>
                    if (worldID >= 0) output += createLocationRowHTML(worldID);
                    output += createGroupListHTML(world["children"]);
                    output += "
                {/if}
            </div>
        </li>
    </ul>
</markup>

<style>
    ul.collapsible {
        background-color: aquamarine;
        position: relative;
    }

    .collapsible-header {
        background-color: var(--surface_variant_dark);
        font-weight: bold;
        justify-content: space-between;
        padding-left: 1.4em;
    }

    li div.collapsible-header i {
        transition: all 0.2s ease-out;
    }

    ul.collapsible li.active div.collapsible-header i {
        transform: rotate(180deg);
    }
</style>