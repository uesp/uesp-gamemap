<!-- @component
### Description
 Text entry box component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (15th March, 2023) -->


<script>

    export let label;
    export let hint = "Enter text...";
    export let block = false;
    export let validate = false;
    export let subtext;

    let id = Math.random();

</script>

<markup>
    <div class="textbox" class:inline={!block}>
        {#if label}<p class="label">{label}</p>{/if}
        <div class="input-field" class:inline={!block}>
            <input id={id} type="text" class:validate={validate}>
            <label for={id}>{hint}</label>
            {#if subtext}<span class="supporting-text subtext">{subtext}</span>{/if}
        </div>
    </div>
</markup>


<style>

    .input-field {
        margin-top: 3px;
        margin-bottom: 3px;
        margin-left: var(--padding_minimum);
    }

    .input-field > label {
        color: var(--text_low_emphasis);
    }

    .textbox.inline {
        display: flex;
        align-content: center;
        align-items: center;
    }

    .label {
        display:contents;
        margin: 0;
        margin-right: var(--padding_medium);
        white-space: nowrap;
    }

    .textbox.inline .label {
        flex-grow: 1;
        display: inline-flex;
    }

    .subtext {
        color: var(--text_low_emphasis);
        font-size: small;
    }

    .textbox.inline input {
        flex-grow: 1;
    }

    input:not([type]), input[type="text"]:not(.browser-default) {
        border-bottom: 1px solid var(--divider);
    }

    .input-field.inline input {
        margin-bottom: unset;
    }

    input {
        margin: 0;
        border-radius: 4px;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        background-color: var(--surface_variant_dark);
    }

    input[type="text"] {
        padding-left: 8px;
        margin-left: -8px;
    }

    input:focus {
        box-shadow: 0 1px 0 0 var(--secondary) !important;
    }

</style>