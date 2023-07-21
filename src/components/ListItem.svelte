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
    export let action;
    export let comment;
    export let tooltip;

    // create event dispatcher
    const dispatch = createEventDispatcher();

    function onClicked(event) {
        if (event.shiftKey) {
            dispatch("shiftClick", destinationID);
        } else {
            dispatch("click", destinationID);
        }
    }

</script>

<markup>
    <div class='collection' class:selected={selected} title={tooltip}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-missing-attribute -->
        <a class='collection-item waves-effect mdc-ripple-surface list-item' class:avatar={icon != null} on:click={onClicked} class:compact={compact}>
            <!-- svelte-ignore missing-declaration -->
            {#if icon}
                {@const iconTooltip = (icon.includes("/")) ? gamemap.getMapConfig().icons.get(Number(icon.replace(/\D/g, ""))) : (destinationID > 0) ? "World" : "Location"}
                {#if icon.includes("/")}
                    <!-- svelte-ignore missing-declaration -->
                    <img class='circle' src={icon} width={gamemap.getMapConfig().iconSize} height={gamemap.getMapConfig().iconSize} title={iconTooltip}/>
                {:else}
                    <i class="material-icons circle" title={iconTooltip}>{icon}</i>
                {/if}
                {#if action}
                    {@const icon = (action.includes("edit") ? "edit" : action.includes("delete") ? "delete_forever" : action.includes("add") ? "add" : action.includes("revert") ? "history" : "add")}
                    <div title={comment} class="action" class:add={action.includes("add")} class:delete={action.includes("delete")} class:edit={action.includes("edit")} class:revert={action.includes("revert")}>
                        <Icon name={icon} size=13></Icon>
                    </div>
                {/if}
            {/if}
            <div class="text">
                <!-- svelte-ignore missing-declaration -->
                <div class="title">
                    <b class="list_title" class:bold={bold} title={title}>{title}</b>
                    {#if timestamp}
                        {@const UTCDate = new Date(Date.parse(timestamp))}
                        {@const localDate = UTCtoLocalDate(UTCDate)}
                        <small class="timestamp" title={localDate}>{getTimeAgo(Date.parse(localDate))}</small>
                    {/if}
                </div>
                <div class="subtitle">
                    {#if subtitle || user}
                        <small class="list_subtitle" style='color: var(--text_low_emphasis);'>{(user && !subtitle) ? "" : subtitle}</small>
                    {/if}
                    {#if user}
                        <small class="author">
                            <Icon name={user.toLowerCase() == "bot" ? "smart_toy" : "person"} size="tiny"/>
                            {(user.toLowerCase() == "bot") ? " "+ user : user}
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
        padding-left: 56.5px !important;
    }

    .compact .circle {
        left: 6px !important;
    }

    .author {
        align-content: center;
        display: flex;
        align-items: center;
        color: var(--text_low_emphasis);
        white-space: nowrap;
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
        width: 60%;
        padding-right: 12px;
        white-space: nowrap;
        overflow: clip;
        text-overflow: ellipsis;
    }

    .action {
        border-radius: 50%;
        width: 20px;
        height: 20px;
        background-color: var(--selection);
        position: absolute;
        bottom: 8px;
        left: 30px;
        align-items: center;
        display: flex;
        justify-content: center;
    }

    .action.delete {
        background-color: var(--delete_pastel);
    }

    .action.edit {
        background-color: var(--highlight_light);
    }

    .action.add {
        background-color: var(--add);
    }

    .action.revert {
        background-color: var(--revert_light);
    }
</style>