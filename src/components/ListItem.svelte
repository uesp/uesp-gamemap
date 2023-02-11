<!-- @component
### Description
 Location list item component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (2nd Feb, 2023) -->

<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // declare state vars
    export let title;
    export let description;
    export let icon;
    export let iconTooltip;
    export let isWorld;
    export let destinationID;
    export let date;
    let iconIsURL = false;
    let isLocation = false;
    let hasIcon = false;

    // create event dispatcher
    const dispatch = createEventDispatcher();

    // determine if location is world or not
    if (isWorld == null) {
        isWorld = icon == null && description == null && (destinationID != null && destinationID > 0);
    }

    // do the same for if it is a location
    isLocation = (destinationID != null && destinationID < 0);

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
    hasIcon = icon != null && icon != false;

    function onClick() {
        dispatch("click", destinationID);
    }

</script>

<markup>
    <div class='collection'>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class='collection-item waves-effect list-item' class:avatar={hasIcon} on:click={onClick} title={(isWorld) ? "Click to visit this map" : (isLocation) ? "Click to centre on this location" : null}>
            {#if hasIcon}
                {#if iconIsURL}
                    <img class='circle' src={icon} width=30 height=30 title={iconTooltip}/>
                {:else}
                    <i class="material-icons circle" title={iconTooltip}>{icon}</i>
                {/if}
            {/if}
            <b class="list_title" class:bold={isWorld}>{title}</b>
            <!-- svelte-ignore missing-declaration -->
            {#if !(isLocation && !gamemap.hasMultipleWorlds()) && description}
                <br><small style='color: var(--text_low_emphasis);'>{description}</small>
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
</style>