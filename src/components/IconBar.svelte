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
    let actions = null;
    let actionCropIndex = 0;
    let actionWidthArray = [];
    let searchPaneWidth = null;
    $: isMobile = false;

    // some kind of check to see if mobile

    // work out what the width of the icon bar would be by getting the end of search panel to end of screen


    // initiate icon bar
    onMount(async () => {

        // actions = document.querySelector('#actions').children[0].children;
        // actionCropIndex = actions.length - 1;
        onResize();
    });

    function onResize() {
        isMobile = window.innerWidth < 670;
        searchPaneWidth = document.querySelector('#search_pane').clientWidth + 4;

        if (!isMobile) {
            iconBarSecondary.style.left = searchPaneWidth + "px";
            iconBarSecondary.style.removeProperty("right");
            iconBarSecondary.style.top = "8px";
        } else {
            iconBarSecondary.style.removeProperty("left");
            iconBarSecondary.style.right = "8px";
            iconBarSecondary.style.top = iconBarPrimary.clientHeight + 8 + "px";
        }

        // setIconBarPositioning();

        // let actionsWidth = document.querySelector('#actions').children[0].clientWidth;

        // // let delta = 1 - (document.querySelector('#actions').children[0].clientWidth / iconBar.clientWidth)

        // // print(Math.floor(delta * (actions.length - 1)));

        // if (iconBar.isOverflowing()) {

        //     print("overflowing!");
        //     print(actions);

        //     if (actionCropIndex != -1) {
        //         let action = actions[actionCropIndex];
        //         let beforeWidth = action.clientWidth;
        //         action.classList.add("noLabel");
        //         let afterWidth = action.clientWidth;
        //         actionWidthArray.push((beforeWidth - afterWidth));
        //         // if ()
        //         // actionCropIndex = (actionCropIndex != 0) ? actionCropIndex-- : 0;
        //     }

        //     print(actionWidthArray);
        // } else {
        //     print(actions[actionCropIndex].clientWidth);
        //     if (actions[actionCropIndex].clientWidth + actionWidthArray[(actionCropIndex.length - 1) - actionCropIndex] < actionsWidth) {
        //         actions[actionCropIndex].classList.remove("noLabel");
        //         actionCropIndex++;
        //         print("aaaaa");
        //     }
        // }

    }

    function setIconBarPositioning() {
        let screenWidth = window.innerWidth;
        if (screenWidth > 500) {
            let iconBarWidth = screenWidth - (searchPaneWidth + iconBarPrimary.clientWidth + 19);

            iconBarSecondary.style.maxWidth = iconBarWidth + "px";

            if (iconBarSecondary.clientWidth > iconBarSecondary.style.maxWidth) {
                iconBarSecondary.style.width = iconBarWidth + "px";
            }
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
        flex-direction: row-reverse;
        gap: var(--padding_medium);
        pointer-events: none;
        display: flex;
        flex-wrap: nowrap;
        top: var(--padding_minimum);
    }

    .icon_bar_primary {
        right: var(--padding_minimum);
    }

    .icon_bar_secondary {
        flex-direction: row !important;
        width: fit-content;
    }

</style>

<!-- Global event listeners -->
<svelte:window on:resize={onResize}/>