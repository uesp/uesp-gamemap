<!-- @component
### Description
 Collapsible location header component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->

<script>
    // import svelte core stuff
	import { onMount } from 'svelte';
  import ListItem from './ListItem.svelte';

    // state vars
    export let data;
    export let expanded = false;
    let title = "This is a title";
    let collapsible = null;

    print(data);

    let worldID = data.id;
    if (worldID < 0) {
        if (worldID == -1) title = "Orphaned Maps";
        if (worldID == -1337) title = "Beta Maps";
    } else {
        title = gamemap.getWorldDisplayNameFromID(worldID);
    }

    // let hasChildren = data["children"];
    // let isWorld = !hasChildren;
    // let isCollapsible = hasChildren;


    // function createGroupListHTML(groups) {
    // 	let output = "";
    // 	let name;
    // 	let displayName;
    // 	let worldID;

    // 	// if the passed grouplist is an array of objects
    // 	if (Array.isArray(groups)) {
    // 		groups.forEach(world => {
    // 			worldID = world.id;
    // 			if (worldID < 0) {

    // 			} else {
    // 				name = gamemap.getWorldNameFromID(worldID);
    // 				displayName = gamemap.getWorldDisplayNameFromID(worldID);
    // 			}

    // 			if (world["children"]) {

    // 				output += "<ul class='collapsible'><li><div class='collapsible-header waves-effect'>" + displayName + "<i class='material-icons'>expand_more</i></div><div class='collapsible-body''>"
    // 				if (worldID >= 0) output += createLocationRowHTML(worldID);
    // 				output += createGroupListHTML(world["children"]);
    // 				output += "</div></li></ul>";
    // 			} else {
    // 				output += createLocationRowHTML(worldID);
    // 			}

    // 		});
    // 	}
    // 	return output;
    // }

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
            <div class='collapsible-header waves-effect' class:expanded={expanded}>
                {title}<i class='material-icons'>expand_more</i>
            </div>
            <div class='collapsible-body'>
                {#if expanded}
                    {#if Array.isArray(data)}
                        {#each data as item}
                            {#if item["children"]}
                                <svelte:self data={item["children"]}/>
                            {:else}
                                <ListItem title={gamemap.getWorldDisplayNameFromID(item.id)}></ListItem>
                            {/if}
                        {/each}
                    {:else if data["children"]}
                        <svelte:self data={data["children"]}/>
                    {:else}
                        <!-- svelte-ignore missing-declaration -->
                        <ListItem title={gamemap.getWorldDisplayNameFromID(data.id)}></ListItem>
                    {/if}

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
        background-color: var(--surface_variant_dark) !important;
        font-weight: bold;
        justify-content: space-between;
        padding-left: 1.4em;
    }

    .collapsible-header.expanded {
        background-color: var(--surface_variant) !important;
    }

    li div.collapsible-header i {
        transition: all 0.2s ease-out;
    }

    ul.collapsible li.active div.collapsible-header i {
        transform: rotate(180deg);
    }
</style>