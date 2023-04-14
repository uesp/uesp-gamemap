<!-- @component
### Description
 Switch component  for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (21st Feb, 2023) -->

<script>

    // import core svelte stuff
    import { createEventDispatcher } from "svelte";

    // state vars
    export let label;
    export let enabled = false;
    export let tooltip;

    const dispatch = createEventDispatcher();

    function onChanged(event) {
        enabled = !enabled;
        dispatch("change", enabled);
    }
</script>

<markup>
    <div class="switch">
        <label>
          <p class="label" title={tooltip}>{label}</p>
          <input type="checkbox" checked={enabled} on:change={onChanged}>
          <span class="lever"></span>
        </label>
    </div>
</markup>

<style>

    .switch {
        text-align: justify;
        padding-top: 4px;
        padding-bottom: 2px;
        margin-top: 8px;
        margin-bottom: 8px;
    }

    .label {
        display: inline;
        font-size: 1rem;
        color: rgba(0, 0, 0, 0.87);
        width: 66%;
    }

    .lever {
        float: right;
        margin-right: 2px !important;
    }

</style>

