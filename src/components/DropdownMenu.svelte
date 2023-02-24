
<!-- @component
### Description
 Dropdown menu component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (21st Feb, 2023) -->

<script>
    // import svelte stuff
    import { onMount } from 'svelte';
    import { createEventDispatcher } from "svelte";

    // state vars
    export let label;
    export let hint;
    export let tooltip;

    const dispatch = createEventDispatcher();

    // initiate dropdown menu
    onMount(async () => {
        M.FormSelect.init(document.querySelectorAll('select'), {
            dropdownOptions : {alignment: 'right', constrainWidth: false}
        });
    });

    function onChanged(event) {
        dispatch("change", event.target.value);
    }

</script>

<markup>
    <div class="input-field col s12">
        <label class="label truncate" title={tooltip} for="form-select-1">{label}</label>
        <select id="form-select-1" on:change={onChanged}>
            <!-- Hint -->
            {#if hint != null}<option value="" disabled>{hint}</option>{/if}
            <slot>
                <!-- Menu items go here -->
            </slot>
        </select>
      </div>
</markup>

<style>

    .label {
        color: var(--text_low_emphasis);
        font-size: 1rem;
    }

    .input-field.col label {
        left: 0px;
        top: 2.5px;
    }

    .input-field {
        display: inline-block;
        width: 100%;
        margin-top: 2px;
        margin-bottom: -10px;
    }

</style>