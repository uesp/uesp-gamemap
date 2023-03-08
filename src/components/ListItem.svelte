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
    let iconName = "";
    //let iconTooltip = (icon != null && )

    print(icon);

    // create event dispatcher
    const dispatch = createEventDispatcher();

    function onClick() {
        dispatch("click", destinationID);
    }

    // iconTooltip = gamemap.getMapConfig().icons[icon];
    //         }
    //     } else if (icon == null && isWorld || isLocation) {
    //         iconTooltip = (isWorld) ? "World" : (isLocation) ? "Location" : "";
    //     }

</script>

<markup>
    <div class='collection' class:selected={selected}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class='collection-item waves-effect list-item' class:avatar={icon != null} on:click={onClick} class:compact={compact}>
            {#if icon}
                {@const iconTooltip = (icon.includes("/")) ? "IS URL" : (destinationID > 0) ? "World" : "Location"}
                {#if icon.includes("/")}
                    <!-- svelte-ignore missing-declaration -->
                    <img class='circle' src={icon} width={gamemap.getMapConfig().iconSize} height={gamemap.getMapConfig().iconSize} title={iconTooltip}/>
                {:else}
                    <i class="material-icons circle" title={iconTooltip}>{icon}</i>
                {/if}
            {/if}
            <b class="list_title" class:bold={bold}>{title}</b>
            {#if timestamp}
                <!-- svelte-ignore missing-declaration -->
                <small class="timestamp" title={timestamp}>{getTimeAgo(Date.parse(timestamp))}</small>
            {/if}
            <!-- svelte-ignore missing-declaration -->
            {#if subtitle}<br><small style='color: var(--text_low_emphasis);'>{subtitle}</small>{/if}

            {#if user}<small class="author"> <Icon name="person" size="tiny"></Icon>{user}</small>{/if}
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