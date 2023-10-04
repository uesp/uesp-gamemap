<!-- svelte-ignore missing-declaration -->
<!-- @component
### Description
 Map options component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (06th Feb, 2023) -->

<script>
    // import svelte core stuff
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';

    // state vars
    let isLoaded = false;
    onMount(() => { isLoaded = true;}); // wait to load ads until after page is loaded

</script>

<markup>
    <div in:fly|global="{{ y: 5, duration: 250 }}" out:fade|global="{{duration: 100}}" on:contextmenu={(e) => e.stopPropagation()} >
        <slot/>
        {#if isLoaded}  <!-- ad slot -->
            <slot name="ad"/> 
        {/if}
    </div>
</markup>

<style>
    div {
        display: flex;
        flex-direction: column;
        justify-items: center;
        place-items: center;
        width: 100%;
        pointer-events: none;
        position: absolute;
        bottom: 0px;
        color: white;
        z-index: 800;
        text-align: center;
    }
</style>