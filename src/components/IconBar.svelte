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
        isMobile = window.innerWidth <= 670;
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

            let iconBarWidth = screenWidth - (searchPaneWidth + (screenWidth - iconBarPrimary.getBoundingClientRect().left) + 19);
            iconBarSecondary.style.width = iconBarWidth + "px";
        }
    }

</script>

<markup>
    <div class="icon_bar_primary" in:fly|global={{ x: 5, duration: 250 }} out:fade|global={{duration: 75}} bind:this={iconBarPrimary} on:contextmenu={(e) => e.stopPropagation()}>
        <slot name="primary"></slot>
    </div>

    <div class="icon_bar_secondary" in:fly|global={{ x: 5, duration: 250 }} out:fade|global={{duration: 75}} bind:this={iconBarSecondary} on:contextmenu={(e) => e.stopPropagation()}>
        <slot name="secondary"></slot>
    </div>
</markup>

<style>
    div[class^="icon_bar"] {
        position: absolute;
        gap: var(--padding_medium);
        pointer-events: none;
        display: inline;
        top: var(--padding_minimum);
        z-index: 1000;
    }

    .icon_bar_primary {
        right: var(--padding_minimum);
    }

    .icon_bar_secondary {
        width: fit-content;
        max-height: calc(var(--appbar_dimen) + var(--padding_small));
        overflow-y: hidden;
        z-index: 900 !important;
    }

</style>

<!-- Global event listeners -->
<svelte:window on:resize={onResize}/>