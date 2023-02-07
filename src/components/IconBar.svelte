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
    <div class="icon_bar" in:fly={{ x: 5, duration: 250 }} out:fade={{duration: 75}}>
        <div class="icon_bar_primary">
            <slot name="primary"></slot>
        </div>

        <div class="icon_bar_secondary">
            <slot name="secondary"></slot>
        </div>
    </div>
</markup>


<style>
    .icon_bar {
        padding-top: var(--padding_minimum);
        padding-bottom: var(--padding_minimum);
        right:  var(--padding_minimum);
        position: absolute;
        display: flex;
        flex-wrap: nowrap;
        width: calc(100% - (var(--side_panel_width) + var(--padding_minimum))) !important;
        overflow: hidden;
        pointer-events: none;
    }

    div[class^="icon_bar"] {
        z-index: var(--zindex_floating);
        display: flex;
        flex-direction: row-reverse;
        justify-content: flex-end;
        gap: var(--padding_medium);
    }

    .icon_bar_responsive {
        flex: none;
        flex-direction: row !important;
        overflow: hidden;
        margin-right: auto;
    }
</style>