<!-- @component
### Description
 Segmented button component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (13th April, 2023) -->

<script>
  import Divider from "./Divider.svelte";

    export let label;



</script>

<markup>

    {#if label}<p class="label">{label}</p>{/if}

    <div class="container">

        <b class="item waves-effect">thing</b>
        <Divider direction="vertical"></Divider>
        <b class="item">thing</b>
        <Divider direction="vertical"></Divider>
        <b class="item">thing</b>

        <div class="slider waves-effect">
            <b class="slider-label">Name</b>
        </div>

    </div>




</markup>

<style>

    .label {
        margin: 0;
        white-space: nowrap;
        margin-top: 2px;
    }

    .item {
        text-align: center;
        pointer-events: visible;
        border-radius: var(--padding_large);
        color: rgba(0, 0, 0, 0.87);
        font-weight: normal;
        width: 100%;
        height: 100%;
        line-height: 36px;
    }

    .item.active {
        font-weight: bold;
        color: var(--text_on_primary);
        pointer-events: none;
    }

    .item:hover {
        background-color: var(--selection);
    }

    .container {
        margin-top: 4px;
        margin-bottom: 4px;
        background-color: var(--surface_variant_dark);
        width: 100%;
        height: 40px;
        border-radius: var(--padding_large);
        border-style: solid;
        border-color: var(--divider);
        border-width: 1px;
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        flex-flow: row;
        overflow: clip;
    }

    .slider {
        height: 35px;
        width: 30%;
        background-color: var(--secondary_variant_light);
        border-radius: 32px;
        position: absolute;
        box-shadow: 0px 1px 4px 0 var(--shadow);
        display: flex;
        align-content: center;
        align-items: center;
        flex-flow: column;
    }

    .slider:hover {
        background-color: var(--secondary_variant);
    }

    .slider-label {
        margin-top: auto;
        margin-bottom: auto;
    }

</style>