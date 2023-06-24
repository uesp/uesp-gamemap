<!-- @component
### Description
 Switch component  for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (21st Feb, 2023) -->

<script>
    // import core svelte stuff
    import { createEventDispatcher } from "svelte";
    import { slide } from 'svelte/transition';

    // state vars
    export let label;
    export let enabled = false;
    export let tooltip;
    export let expand;

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

    <!-- optional child UI component if togged -->
    {#if (expand != null && expand == true || expand == null && enabled)}
        <div class="optional-component" in:slide out:slide>
            <slot/>
        </div>
    {/if}
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

