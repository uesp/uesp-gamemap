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
    export let title;

    const dispatch = createEventDispatcher();

    function onChange() {
        checked = !checked;
        dispatch("change", checked);
    }
</script>

<markup>
    <label class="waves-effect" style="width: 100%; padding-top: 8px;" title={title}>
        <input type="checkbox" class="filled-in" on:change={onChange} checked={checked}/>
        <span>{label}</span>
    </label>
</markup>

<style>
    span {
        color: rgba(0, 0, 0, 0.87);
    }
</style>