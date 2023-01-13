<!-- Bidirectional divider component -->

<script>
    export let direction = "horizontal" // default: horizontal
</script>

{#if direction == "horizontal"}
    <hr id="horizontal_divider">
{:else if  direction == "vertical"}
    <div id="vertical_divider"></div>
{/if}

<style>

    hr {
        border: 0;
        border-top: 3px solid var(--divider);
        margin-top: 2px;
        margin-bottom: 2px;
        width: 75%;
    }

    #vertical_divider {
        border-left: 2px solid var(--divider);
        width: 2px; /* Width instead of height */
        margin-left: 2px;
        margin-right: 2px;
        height: 75%;
    }

</style>
