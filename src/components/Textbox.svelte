<!-- @component
### Description
 Text entry box component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (15th March, 2023) -->

<script>

    // import svelte stuff
    import { createEventDispatcher } from "svelte";
    import { onMount } from 'svelte';

    // state vars
    export let label;
    export let hint = "Enter text...";
    export let placeholder;
    export let block = false;
    export let subtext;
    export let text;
    export let value = text;
    export let textArea;
    export let tooltip;
    export let type = "text";
    export let hideSpinner = type == "float";
    export let min;
    export let max;
    export let column;
    type = (type == "float") ? "number" : type;

    const dispatch = createEventDispatcher();

    let textbox;
    let id = Math.random().toString(36).substr(2, 10); // generate unique random string
    block = (textArea != null) ? true : block;

    $: {
        if (type == "number") {
            dispatch("change", Number(value));
        } else {
            dispatch("change", value);
        }
    };

    function expand() {

        //simulate keypress event to expand the textarea
        var keyboardEvent = document.createEvent('KeyboardEvent');
        var initMethod = typeof keyboardEvent.initKeyboardEvent !== 'undefined' ? 'initKeyboardEvent' : 'initKeyEvent';


        keyboardEvent[initMethod]('keydown', true, true, window, false, false, false, false, 40, 0);
        textbox.dispatchEvent(keyboardEvent);
    }

    // on component load
    onMount(async() => { expand() });

    function typeAction(node) {node.type = type}
</script>

<markup>
    <div class="textbox" class:inline={!block} title={tooltip} class:column={column}>
        {#if label}<p class="label" class:hasSubtext={subtext}>{label}</p>{/if}
        <div class="input-field" class:inline={!block} class:isNumber={type == "number"} class:compact={!label && type == "number"}>
            {#if textArea}
                <textarea id={id} placeholder={(placeholder != null) ? placeholder : null} class="materialize-textarea input"
                bind:value={value} bind:this={textbox} style="margin-left: -8px; padding-left: 8px; width: calc(100%); padding-right: 8px;"
                on:click={expand}/>
            {:else}
                <input id={id}
                    placeholder={(placeholder != null) ? placeholder : null}
                    type="text"
                    class="input"
                    bind:value={value} bind:this={textbox}
                    use:typeAction
                    min={min}
                    max={max}
                    step="any"
                    class:hideSpinner={hideSpinner}>
            {/if}
            {#if !placeholder}
                 <label for={id} class:active={value != null || (textbox != null && textbox === document.activeElement)}>{hint}</label>
            {/if}
            {#if subtext}<span class="supporting-text subtext" title={subtext}>{subtext}</span>{/if}
        </div>
    </div>
</markup>

<style>

    .input-field {
        margin-top: 4px;
        margin-bottom: 4px;
        margin-left: var(--padding_minimum);
        width: 100%;
    }

    .input-field > label {
        color: var(--text_low_emphasis);
        opacity: 0.75;
    }

    .textbox.inline {
        display: flex;
        align-content: center;
        align-items: center;
    }

    .label {
        display: contents;
        margin: 0;
        margin-right: var(--padding_medium);
        white-space: nowrap;
        width: 50%;
    }

    .inline.isNumber label {
	    margin-left: var(--padding_minimum) !important;
    }

    .textbox.inline .label {
        flex-grow: 1;
        display: inline-flex;
    }

    .subtext {
        color: var(--text_low_emphasis);
        font-size: small;
        white-space: nowrap;
        display: inline-block;
        max-width: 85%;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .textbox.inline .input {
        flex-grow: 1;
    }

    .input:not([type]), .input[type="text"]:not(.browser-default) {
        border-bottom: 1px solid var(--divider);
    }

    .input-field.inline .input {
        margin-bottom: unset;
    }

    .input {
        margin: 0;
        border-radius: 4px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        background-color: var(--surface_variant_dark);
        font-size: 1rem;
    }

    input::placeholder {
        font-size: 1rem;
    }

    .input[type="text"] {
        padding-left: 8px;
        margin-left: -8px;
    }

    .input:focus {
        box-shadow: 0 1px 0 0 var(--secondary) !important;
    }

    .isNumber {
        margin-left: -4px;
    }

    .compact {
        margin-left: 0px;
    }

    .hasSubtext {
        position: relative;
        top: -12px;
    }

    .column {
        flex-direction: column;
    }

    .column .label {
        width: 100%;
        padding-left: 8px;
    }

</style>

<!-- Global event listeners -->
<svelte:window on:resize={() => {if(textArea) {expand()}}}/>