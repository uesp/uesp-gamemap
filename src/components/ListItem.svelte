<!-- @component
### Description
 Location list item component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (2nd Feb, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";
    import Icon from "./Icon.svelte";

    // declare state vars
    export let title;
    export let subtitle;
    export let icon;
    export let bold;
    export let destinationID;
    export let selected;
    export let timestamp;
    export let compact;
    export let user;

    // create event dispatcher
    const dispatch = createEventDispatcher();

    function onClick() {
        dispatch("click", destinationID);
    }

</script>

<markup>
    <div class='collection' class:selected={selected}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class='collection-item waves-effect list-item' class:avatar={icon != null} on:click={onClick} class:compact={compact}>
            <!-- svelte-ignore missing-declaration -->
            {#if icon}
                {@const iconTooltip = (icon.includes("/")) ? gamemap.getMapConfig().icons[icon.replace(/\D/g, "")] : (destinationID > 0) ? "World" : "Location"}
                {#if icon.includes("/")}
                    <!-- svelte-ignore missing-declaration -->
                    <img class='circle' src={icon} width={gamemap.getMapConfig().iconSize} height={gamemap.getMapConfig().iconSize} title={iconTooltip}/>
                {:else}
                    <i class="material-icons circle" title={iconTooltip}>{icon}</i>
                {/if}
            {/if}
            <div class="text">
                <!-- svelte-ignore missing-declaration -->
                <div class="title">
                    <b class="list_title" class:bold={bold} title={title}>{title}</b>
                    {#if timestamp}
                        <small class="timestamp" title={timestamp}>{getTimeAgo(Date.parse(timestamp))}</small>
                    {/if}
                </div>
                <div class="subtitle">
                    {#if subtitle}
                        <small class="list_subtitle" style='color: var(--text_low_emphasis);'>{subtitle}</small>
                    {/if}
                    {#if user}
                        <small class="author">
                            <Icon name="person" size="tiny"/>
                            {user}
                        </small>
                    {/if}
                </div>
            </div>
        </a>
    </div>
</markup>

<style>

    .list_title {
        font-weight: normal;
        font-size: 14px;
    }

    .list_title.bold {
        font-weight: bold;
    }

    .collection-item {
        font-size: 14px;
    }

    .selected {
        background-color: var(--selection);
    }

    .compact {
        min-height: 50px;
        max-height: 50px;
        padding: 8px 8px !important;
        padding-left: 57px !important;
    }

    .compact .circle {
        width: 40px !important;
        height: 40px !important;
        left: 6px !important;
    }

    .author {
        align-content: center;
        display: flex;
        align-items: center;
        color: var(--text_low_emphasis);
    }

    .timestamp {
        align-items: center;
        color: var(--text_low_emphasis);
        white-space: nowrap;
    }

    .title, .subtitle {
        display: flex;
        overflow-x: hidden;
    }

    .list_title, .list_subtitle {
        flex-grow: 1;
        width: 70%;
        padding-right: 12px;
        white-space: nowrap;
        overflow: clip;
        text-overflow: ellipsis;
    }
</style>