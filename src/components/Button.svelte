<!-- @component
### Description
 Button component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (7th March, 2023) -->


<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    export let icon;
    export let iconDirection = "left";
    export let text = "button";
    export let flat;
    export let size;
    export let disabled;

    const dispatch = createEventDispatcher();

    function onClicked() {
        dispatch("click", "clicked");
    }
</script>

<markup>
    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <a class="waves-effect waves-light btn{flat != null ? "-flat" : ""}{size != null ? "-"+{size} : ""}" class:disabled={disabled} on:click={onClicked}>
        {#if icon}
            <i class="material-icons {iconDirection}">{icon}</i>
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

</style>