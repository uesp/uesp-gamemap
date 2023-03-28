<!-- @component
### Description
 Appbar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (6th March, 2023) -->



<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // import ui components
    import IconButton from "./IconButton.svelte";

    export let icon = "arrow_back";
    export let title = "This is an appbar."
    export let subtitle;

    const dispatch = createEventDispatcher();

    function onBackClicked() {
        dispatch("backClicked", "clicked");
    }

</script>

<markup>
    <div class="appbar">
        <IconButton icon={icon} hasBackground="false" on:click={onBackClicked}></IconButton>
        <div class="title-container">
            <b class="appbar-title">{title}</b>
            {#if subtitle != null}
                <small>{subtitle}</small>
            {/if}
        </div>
    </div>
</markup>

<style>

    .appbar-title {
        font-size: 1.1rem;
    }

    .appbar {
        width: 100%;
        background-color: var(--primary_variant_light);
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        padding-top: var(--padding_minimum);
        padding-left: 4px;
        padding-right: var(--padding_minimum);
        align-items: center;
        display: inline-flex;
        z-index: 99;
    }

    .title-container {
        display: inline-grid;
        top: -1px;
        position: relative;
        margin-left: 6px;
    }

    small {
        color: var(--text_low_emphasis);
    }

</style>