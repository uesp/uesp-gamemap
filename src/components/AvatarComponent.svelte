<!-- svelte-ignore a11y-missing-attribute -->
<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- @component
### Description
 Icon/avatar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (9th May, 2023) -->

<script>

    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // import ui components
    import Icon from "./Icon.svelte";
    import DropdownMenu from './DropdownMenu.svelte';

    //state variables
    export let icon;
    export let isWorld;
    export let locType;
    let canChangeIcon = true;
    let showOverlay = false;
    let iconTooltip;
    let iconID;

    const dispatch = createEventDispatcher();

    $: {
        iconID = icon;
        icon = (icon != null) ? icon = gamemap.getMapConfig().iconPath + icon + ".png" : isWorld ? "public" : (locType != LOCTYPES.PATH) ? "add" : "location_on";
        canChangeIcon = locType != LOCTYPES.PATH && !isWorld;
        iconTooltip = (canChangeIcon) ? icon.includes("/") ? gamemap.getMapConfig().icons.get(Number(icon.replace(/\D/g, ""))) : "Add Icon" : (isWorld) ? "World" : "Location";
    }

    function change(iconID) {
        print(iconID);

        if (iconID != "null" || iconID == null) {
            dispatch("change", Number(iconID));
            icon = iconID;
        } else {
            dispatch("change", null);
            icon = null;
        }
    }

</script>

<markup>

    <div class="avatar_container">

        <div class="avatar circle" title={iconTooltip} class:waves-effect={canChangeIcon} on:mouseover={() => {showOverlay = canChangeIcon}} on:mouseout={() => showOverlay = false}>

            {#if icon}
                 {#if icon.includes("/")}
                     <img src={icon}/>
                 {:else}
                     <Icon size="medium" name={icon}></Icon>
                 {/if}
            {/if}

            {#if canChangeIcon}
                <DropdownMenu hint="Select icon..." on:change={(e) => change(e.detail)} invisible={true}>
                    <option value={null} selected={iconID == null}>None</option>
                    {#each [...gamemap.getMapConfig().icons] as [id, name]}
                        <option value={id} selected={id == iconID} data-icon={gamemap.getMapConfig().iconPath + id + ".png"} title={name}>{name}</option>
                    {/each}
                </DropdownMenu>
            {/if}

            {#if showOverlay}
                <div class="overlay">
                    <b class="overlay-text">Select Icon</b>
                </div>
            {/if}

        </div>

        <div class="form_container">
            <slot>
                <!-- form items go here -->
            </slot>
        </div>

    </div>

</markup>

<style>

    .avatar_container {
        padding-top: 12px;
        display: flex;
        --avatar_size: 80px;
        z-index: 9999;
        padding-bottom: 12px;
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
        z-index: 9999999999999999;
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
        backdrop-filter: opacity(90%);
        backdrop-filter: brightness(60%);
        backdrop-filter: contrast(40%);
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
        object-fit: contain;
    }
</style>