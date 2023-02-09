<!-- @component
### Description
 Responsive icon bar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->

<script>
    // import core svelte stuff
    import { fade, fly } from 'svelte/transition';
    import { onMount } from 'svelte';

    let iconBarPrimary = null;
    let iconBarSecondary = null;
    let searchPaneWidth = null;
    $: isMobile = false;

    // initiate icon bar
    onMount(async () => { onResize(); });

    function onResize() {
        isMobile = window.innerWidth < 670;
        searchPaneWidth = document.querySelector('#search_pane').clientWidth + 4;
        let screenWidth = window.innerWidth;

        if (!isMobile) {
            iconBarSecondary.style.left = searchPaneWidth + "px";
            iconBarSecondary.style.removeProperty("right");
            iconBarSecondary.style.top = "8px";
        } else {
            iconBarSecondary.style.removeProperty("left");
            iconBarSecondary.style.right = "8px";
            iconBarSecondary.style.top = iconBarPrimary.clientHeight + 8 + "px";
        }

        if (!isMobile) {
            let iconBarWidth = screenWidth - (searchPaneWidth + iconBarPrimary.clientWidth + 19);
            iconBarSecondary.style.width = iconBarWidth + "px";
        }
    }

</script>

<markup>
    <div class="icon_bar_primary" in:fly={{ x: 5, duration: 250 }} out:fade={{duration: 75}} bind:this={iconBarPrimary}>
        <slot name="primary"></slot>
    </div>

    <div class="icon_bar_secondary" in:fly={{ x: 5, duration: 250 }} out:fade={{duration: 75}} bind:this={iconBarSecondary}>
        <slot name="secondary"></slot>
    </div>
</markup>

<style>
    div[class^="icon_bar"] {
        position: absolute;
        z-index: var(--zindex_floating);
        gap: var(--padding_medium);
        pointer-events: none;
        display: inline;
        top: var(--padding_minimum);
    }

    .icon_bar_primary {
        right: var(--padding_minimum);
    }

    .icon_bar_secondary {
        width: fit-content;
        max-height: calc(var(--appbar_dimen) + var(--padding_small));
        overflow-y: hidden;
    }

</style>

<!-- Global event listeners -->
<svelte:window on:resize={onResize}/>