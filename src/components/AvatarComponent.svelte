<!-- @component
### Description
 Icon/avatar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (9th May, 2023) -->

<script>

    // import ui components
    import Icon from "./Icon.svelte";
    import { onMount } from 'svelte';

    //state variables
    export let icon;
    export let isWorld;
    export let locType;
    let canHaveIcon = true;

    $: {

        if (icon == null) {
            if (isWorld) {
                icon = "public";
            } else if (locType != LOCTYPES.PATH) {
                icon = "add";
            } else {
                icon = "location_on"
            }
        } else {
            print(icon);
            icon = gamemap.getMapConfig().iconPath + icon + ".png";
        }

        canHaveIcon = locType != LOCTYPES.PATH && !isWorld;
    }


    onMount(async() => {
        //icon = (icon != null) ?  : (isWorld) ? "public" : locType != LOCTYPES.PATH ? "add_circle" : icon;
        print("afdadada");
        print(icon);
    });


    //if loctype == line, and icon null, then add icon

    let showOverlay = false;

    // hover over avatar = "change icon"
    // also tooltip of name of icon
    // click icon, opens dropdown with list of icons



</script>


<markup>

    <div class="avatar_container">
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->

        {#if canHaveIcon}
             <div class="avatar circle" title="icon name go here" class:waves-effect={canHaveIcon} on:mouseover={() => {showOverlay = canHaveIcon}} on:mouseout={() => showOverlay = false}>

                 {#if icon && icon.includes("/")}
                     <!-- svelte-ignore a11y-missing-attribute -->
                     <img src={icon}/>
                 {:else}
                     <Icon size="medium" name={icon}></Icon>
                 {/if}


                 <!-- {@const iconTooltip = (icon.includes("/")) ? gamemap.getMapConfig().icons[icon.replace(/\D/g, "")] : (destinationID > 0) ? "World" : "Location"} -->

                 {#if showOverlay}
                     <div class="overlay">
                         <b class="overlay-text">Change Icon</b>
                     </div>
                 {/if}
             </div>
        {/if}

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

    .avatar_container {
        padding-top: 12px;
        padding-bottom: 8px;
        display: flex;
        --avatar_size: 80px;
    }

    .avatar {
        flex-shrink: 0;
        width: var(--avatar_size);
        height: var(--avatar_size);
        position: relative;
        display: flex;
        place-items: center;
        place-content: center;
        margin-right: 12px;
    }

    .form_container {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        place-content: center;
    }

    .waves-effect:hover {
        background-color: var(--shadow) !important;
    }

    .overlay {
        pointer-events: none;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        text-anchor: middle;
        font-size: 1.2rem;
        text-align: center;
        display: flex;
        backdrop-filter: blur(2px);
    }

    .overlay-text {
        margin-top: auto;
        margin-bottom: auto;
        place-self: center;
        color: white;
    }

    img {
        height: 100%;
        width: 100%;
        padding: var(--padding_medium);
        object-fit: cover;
    }
</style>