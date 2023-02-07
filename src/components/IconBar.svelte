<!-- @component
### Description
 Responsive icon bar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->

<script>
    // import core svelte stuff
    import { fade, fly } from 'svelte/transition';

    // import UI components
    import IconButton from "./IconButton.svelte";

</script>

<markup>
    <div class="icon_bar" in:fly={{ x: 10, duration: 250 }} out:fade={{duration: 150}}>
        <div class="icon_bar_persistent">

            <IconButton icon="more_vert" tooltip="More" data-target='overflow-menu' on:click={() => (print("not implemented"))}/>

            <!-- Overflow Menu Items
            <ul id='overflow-menu' class='dropdown-content'>
                <li><a onclick="showHelp()" href="javascript:void(0);">Help</a></li>
                <li><a onclick="resetMap()" href="javascript:void(0);">Reset Map</a></li>
                <li><a onclick="toggleFullscreen();" href="javascript:void(0);" id="fullscreen-toggle"><i class="material-icons small">fullscreen</i>Fullscreen</a></li>
            </ul> -->
        </div>

        <IconButton icon="edit" tooltip="Toggle edit mode" noMobile="true" checked="false" on:checked={() => (print("not implemented"))}/>

        <div class="icon_bar_responsive">
            <IconButton icon="explore" tooltip="Jump to location" dropdown="true" on:checked={() => (print("not implemented"))}/>

            <IconButton icon="article" label="Goto Article" tooltip="Goto this map's article" on:click={() => (print("not implemented"))}/>

            <IconButton icon="link" label="Copy Link" tooltip="Copy link to this location" on:click={() => (print("not implemented"))}/>
        </div>
    </div>
</markup>


<style>


</style>