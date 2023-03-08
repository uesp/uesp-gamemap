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
    export let description;
    export let hasIcon = false;
    export let icon;
    export let iconTooltip;
    export let isWorld;
    export let destinationID;
    export let selected;
    export let timestamp;
    export let compact;
    export let user;
    let iconIsURL = false;
    let isLocation = false;

    // create event dispatcher
    const dispatch = createEventDispatcher();

    // determine if location is world or not
    if (isWorld == null) {
        isWorld = icon == null && description == null && (destinationID != null && destinationID > 0);
    }

    // do the same for if it is a location
    isLocation = (destinationID != null && destinationID < 0);

    if (hasIcon) {
        // set tooltip
        if (iconTooltip == null && icon != null) {
            if (!isNaN(icon) && icon != false){
                iconTooltip = gamemap.getMapConfig().icons[icon];
            }
        } else if (icon == null && isWorld || isLocation) {
            iconTooltip = (isWorld) ? "World" : (isLocation) ? "Location" : "";
        }

        // get icon
        if (icon != null && icon != false) {
            // is the icon numeric?
            if (!isNaN(icon)) {
                icon = gamemap.getMapConfig().iconPath + icon + ".png";
                iconIsURL = true;
            }
        } else if (icon == null) {
            icon = (isWorld) ? "public" : (isLocation) ? "location_on" : null;
        }
    }

    function onClick() {
        dispatch("click", destinationID);
    }

</script>

<markup>
    <div class='collection' class:selected={selected}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class='collection-item waves-effect list-item' class:avatar={hasIcon} on:click={onClick} class:compact={compact}>
            {#if hasIcon}
                {#if iconIsURL}
                    <!-- svelte-ignore missing-declaration -->
                    <img class='circle' src={icon} width={gamemap.getMapConfig().iconSize} height={gamemap.getMapConfig().iconSize} title={iconTooltip}/>
                {:else}
                    <i class="material-icons circle" title={iconTooltip}>{icon}</i>
                {/if}
            {/if}
            <b class="list_title" class:bold={isWorld}>{title}</b>
            {#if timestamp != null}
                <!-- svelte-ignore missing-declaration -->
                <small class="timestamp" title={timestamp}>{getTimeAgo(Date.parse(timestamp))}</small>
            {/if}
            <!-- svelte-ignore missing-declaration -->
            {#if !(isLocation && !gamemap.hasMultipleWorlds()) && description}
                <br><small style='color: var(--text_low_emphasis);'>{description}</small>
            {/if}

            {#if user != null}
                <small class="author"> <Icon name="person" size="tiny"></Icon>{user}</small>
            {/if}
        </a>
    </div>
</markup>

<style>

    .list_title {
        font-weight: normal;
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
        padding-left: 58px;
    }

    .compact .circle {
        width: 40px !important;
        height: 40px !important;
        left: 6px !important;
    }

    .compact b {
        display: -webkit-inline-box;
        white-space: nowrap;
        max-width: 72%;
        overflow: clip;
    }

    .author {
        float: right;
        align-content: center;
        display: flex;
        align-items: center;
        color: var(--text_low_emphasis);
    }

    .timestamp {
        float: right;
        display: flex;
        align-items: center;
        color: var(--text_low_emphasis);
    }
</style>