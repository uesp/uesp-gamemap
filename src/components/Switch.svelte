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

    const dispatch = createEventDispatcher();

    function onChanged(event) {
        enabled = !enabled;
        dispatch("change", enabled);
    }
</script>

<markup>
    <div class="switch">
        <label>
          <p class="label">{label}</p>
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
    }

    .label {
        display: inline;
        font-size: 1rem;
        color: var(--text_low_emphasis);
        width: 66%;
    }

    .lever {
        float: right;
        margin-right: 2px !important;
    }

</style>

