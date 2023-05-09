<!-- @component
### Description
 Icon/avatar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (9th May, 2023) -->

<script>

    import Icon from "./Icon.svelte";




    let canChangeIcon = false;

    // hover over avatar = "change icon"
    // also tooltip of name of icon
    // click icon, opens dropdown with list of icons


    //icon={(RCItem.icon != null) ? gamemap.getMapConfig().iconPath + RCItem.icon + ".png" : (isWorld) ? "public" : "location_on"}



</script>


<markup>

    <div class="avatar_container">
        <div class="avatar circle">
            <Icon name="sun"></Icon>
            <div class="overlay">
                <b>Change Icon</b>
            </div>
        </div>

        <div class="form_container">
            <slot>
                <!-- form items go here -->
            </slot>
        </div>

    </div>



    <!-- <a class='collection-item waves-effect mdc-ripple-surface list-item' class:avatar={icon != null} on:click={onClicked} class:compact={compact}>
     svelte-ignore missing-declaration -->
        <!-- {#if icon}
            {@const iconTooltip = (icon.includes("/")) ? gamemap.getMapConfig().icons[icon.replace(/\D/g, "")] : (destinationID > 0) ? "World" : "Location"}
            {#if icon.includes("/")} -->
                <!-- svelte-ignore missing-declaration -->
                <!-- <img class='circle' src={icon} width={gamemap.getMapConfig().iconSize} height={gamemap.getMapConfig().iconSize} title={iconTooltip}/>
            {:else}
                <i class="material-icons circle" title={iconTooltip}>{icon}</i>
            {/if}
            {#if action}
                {@const icon = (action.includes("edit") ? "edit" : action.includes("delete") ? "delete_forever" : "add")}
                <div title={comment} class="action" class:add={action.includes("add")} class:delete={action.includes("delete")} class:edit={action.includes("edit")}>
                    <Icon name={icon} size=13></Icon>
                </div>
            {/if}
        {/if}
        <div class="text"> -->
            <!-- svelte-ignore missing-declaration -->
            <!-- <div class="title">
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
    </a> -->


</markup>

<style>

    :root {
        --avatar_size: 90px;
    }

    .avatar_container {
        padding-top: 12px;
        padding-bottom: 8px;
        display: flex;
    }

    .avatar {
        flex-shrink: 0;
        width: var(--avatar_size);
        height: var(--avatar_size);
    }

    .avatar:hover {
        background-color: var(--shadow) !important;
    }

    .form_container {
        flex-grow: 1;
        margin-left: 12px;
        display: flex;
        flex-direction: column;
        place-content: center;
    }

</style>