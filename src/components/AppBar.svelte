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
    export let tooltip;
    export let buttonTooltip;
    export let unsavedChanges;

    const dispatch = createEventDispatcher();

    function onBackClicked() {
        dispatch("back", "clicked");
    }

</script>

<markup>
    <div class="appbar">
        <IconButton icon={icon} hasBackground="false" on:click={onBackClicked} tooltip={buttonTooltip}></IconButton>
        <div class="title-container">
            <b class="appbar-title" title={tooltip}>{title} {unsavedChanges ? " *" : ""}</b>
            {#if subtitle != null}
                <small>{subtitle}</small>
            {/if}
        </div>
    </div>
</markup>

<style>

    .appbar-title {
        font-size: 1.1rem;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
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
        z-index: 999999;
    }

    .title-container {
        display: inline-grid;
        top: -1px;
        position: relative;
        margin-left: 6px;
    }

    small {
        color: var(--text_low_emphasis);
        white-space: nowrap;
        max-width: 25vw;
        text-overflow: ellipsis;
        overflow: clip;
    }

</style>