<!-- @component
### Description
 Collapsible location header component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->

<script>
    // import svelte core stuff
	import { onMount } from 'svelte';

    export let data;
    export let expanded = false;

    let title = "This is a title";

    let collapsible = null;

        // 	// init collapsers
    // 	$('.collapsible').collapsible({
    // 		accordion: true,

    // 		onOpenStart: function(element) {
    // 			// darken collapsible
    // 			$(element).find(".collapsible-header:first").css("background-color", "var(--surface_variant)");
    // 			$(element).find("i:first").css("transform", "rotate(180deg)");
    // 		},

    // 		onCloseStart: function(element){
    // 			$(element).find(".collapsible-header:first").css("background-color", "var(--surface_variant_dark)");
    // 			$(element).find("i:first").css("transform", "rotate(360deg)");

    // 		}
    // 	});

    // }

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
    // 				if (worldID == -1) displayName = "Orphaned Maps";
    // 				if (worldID == -1337) displayName = "Beta Maps";
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
            <div class='collapsible-header waves-effect'>
                {title}
                <i class='material-icons'>expand_more</i>
            </div>
            <div class='collapsible-body'>
                {#if expanded}
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