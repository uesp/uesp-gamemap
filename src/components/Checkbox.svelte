<!-- @component
### Description
 Checkbox component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (1st Feb, 2023) -->

<script>

    // import svelte stuff
    import { createEventDispatcher } from "svelte";

    // state vars
    export let label;
    export let checked = false;

    const dispatch = createEventDispatcher();

    function onChange() {
        checked = !checked;
        dispatch("change", checked);
    }
</script>

<markup>
    <label class="waves-effect" style="width: 100%; padding-top: 8px;">
        <input type="checkbox" class="filled-in" on:change={onChange} checked={checked}/>
        <span>{label}</span>
    </label>
</markup>


<style>

    span {
        color: var(--text_low_emphasis);
    }

</style>