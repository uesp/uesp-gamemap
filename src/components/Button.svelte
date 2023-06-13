<!-- @component
### Description
 Button component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (7th March, 2023) -->


<script>
    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // import ui components
    import LoadingSpinner from "./LoadingSpinner.svelte";

    // state vars
    export let icon;
    export let iconDirection = "left";
    export let text = "button";
    export let flat;
    export let size;
    export let disabled;
    export let type;
    export let bold;

    disabled = (icon == "loading") ? true : disabled;

    const dispatch = createEventDispatcher();

    function onClicked() {
        dispatch("click", "clicked");
    }
</script>

<markup>
    <!-- svelte-ignore a11y-missing-attribute -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <a class="waves-effect waves-light btn{flat ? "-flat" : ""}{size ? "-"+{size} : ""}" class:disabled={disabled} class:saving={type=="save" && icon == "loading"} class:error={type=="save" && icon == "warning"}
    on:click={onClicked} class:loadingButton={icon == "loading"} class:deleteButton={type == "delete"} class:saveButton={type=="save"} class:bold={bold}>

        {#if icon}
            {#if icon != "loading"}
                 <i class="material-icons {iconDirection}">{icon}</i>
            {:else}
                <div class="spinner"><LoadingSpinner size=36px/></div>
            {/if}
        {/if}
        <p>{text}</p>
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

    .btn-flat {
        background-color: unset;
        color: var(--secondary_variant_light) !important;
    }

    .btn-flat:hover {
        background-color: var(--selection_variant) !important;
    }

    p {
        margin: 0;
        display: inline;
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
        position: relative;
        left: -6px;
    }

    .loadingButton {
        align-content: center;
        align-items: center;
        display: flex;
    }

    .loadingButton p {
        flex-grow: 1;
    }

    .saving {
        background-color: #3c5822 !important;
        color: darkgrey  !important;
        pointer-events: none;
    }

    .saving p {
        animation: fade 2.5s infinite !important;
    }

    @keyframes fade {
        0% {
        opacity: 1;
        }

        50% {
            opacity: 0.5;
        }

        100% {
        opacity: 1;
        }
    }

    .disabled {
        color: var(--text_low_emphasis) !important;
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

    .error {
        background-color: var(--error);
        animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
        perspective: 1000px;
    }

    .error:hover {
        background-color: var(--error_light);
    }

    @keyframes shake {
        10%, 90% {
            transform: translate3d(-1px, 0, 0);
        }

        20%, 80% {
            transform: translate3d(2px, 0, 0);
        }

        30%, 50%, 70% {
            transform: translate3d(-4px, 0, 0);
        }

        40%, 60% {
            transform: translate3d(4px, 0, 0);
        }
    }

</style>