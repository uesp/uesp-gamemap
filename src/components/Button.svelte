<!-- @component
### Description
 Button component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (7th March, 2023) -->


<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";
  import LoadingSpinner from "./LoadingSpinner.svelte";

    export let icon;
    export let iconDirection = "left";
    export let text = "button";
    export let flat;
    export let size;
    export let disabled;
    export let type;
    export let bold;

    const dispatch = createEventDispatcher();

    function onClicked() {
        dispatch("click", "clicked");
    }
</script>

<markup>
    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <a class="waves-effect waves-light btn{flat != null ? "-flat" : ""}{size != null ? "-"+{size} : ""}" class:disabled={disabled}
    on:click={onClicked} class:loadingButton={icon == "loading"} class:deleteButton={type == "delete"} class:saveButton={type=="save"} class:bold={bold}>
        {#if icon}
            {#if icon != "loading"}
                 <i class="material-icons {iconDirection}">{icon}</i>
            {:else}
                <div class="spinner"><LoadingSpinner size=36px/></div>
            {/if}
        {/if}
        {text}
    </a>
</markup>

<style>
    a {
        text-transform: capitalize;
        background-color: var(--secondary);
        letter-spacing: 0px;
        margin: 2px;
        padding: 0 var(--padding_minimum);
    }

    i.left {
        margin-right: var(--padding_minimum);
    }

    a:hover {
        background-color: var(--secondary_light);
    }

    .spinner {
        width: 32px;
        height: 100%;
        display: inline-block;
        margin-right: var(--padding_minimum);
        filter: brightness(10);
    }

    .loadingButton {
        align-content: center;
        align-items: center;
        display: flex;
    }

    .saveButton {
        background-color: var(--save);
    }

    .bold {
        font-weight: bold;
    }

    .saveButton:hover {
        background-color: var(--save_light);
    }

    .deleteButton {
        background-color: var(--delete);
    }

    .deleteButton:hover {
        background-color: var(--delete_light);
    }

</style>