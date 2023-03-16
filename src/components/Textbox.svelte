<!-- @component
### Description
 Text entry box component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (15th March, 2023) -->


<script>

    export let label;
    export let hint = "Enter text...";
    export let inline;
    export let validate = false;

    let id = Math.random();

</script>

<markup>
    <div class="textbox" class:inline={inline}>
        {#if label}<p class="label">{label}</p>{/if}
        <div class="input-field" class:inline={inline}>
            <input id={id} type="text" class:validate={validate}>
            <label for={id}>{hint}</label>
        </div>
    </div>
</markup>


<style>

    .input-field {
        margin-top: var(--padding_minimum);
        margin-bottom: var(--padding_minimum);
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
    }

    .textbox.inline .label {
        flex-grow: 1;
        display: inline-flex;
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

    input:focus {
        box-shadow: 0 1px 0 0 var(--secondary) !important;
    }

</style>