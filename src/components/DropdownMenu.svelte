
<!-- @component
### Description
 Dropdown menu component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (21st Feb, 2023) -->

<script>

    // import svelte stuff
    import { onMount } from 'svelte';

    export let label;
    export let hint;

    // initiate dropdown menu
    onMount(async () => {
        M.FormSelect.init(document.querySelectorAll('select'), {
            dropdownOptions : {alignment: 'right', constrainWidth: false}
        });
    });

</script>

<markup>
    <div class="input-field col s12">
        <label class="label truncate" for="form-select-1">{label}</label>
        <select id="form-select-1">
            <!-- Hint -->
            {#if hint != null}<option value="" disabled>{hint}</option>{/if}

            <!-- Options -->
            <option value="1" selected>None</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
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
    }

    .input-field {
        display: inline-block;
        width: 100%;
        margin-top: 2px;
    margin-bottom: 2px;
    }

</style>