<!-- @component
### Description
 Appbar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (6th March, 2023) -->



<script>
    import IconButton from "./IconButton.svelte";

    export let icon = "close";
    export let title = "This is an appbar."

</script>

<markup>

    <div class="appbar">
        <IconButton icon={icon} hasBackground="false"></IconButton>
        <b class="appbar-title">{title}</b>
    </div>

</markup>



<style>

    .appbar-title {
        font-size: 1.1rem;
    }

    .appbar {
        /* height: var(--appbar_dimen); */
        width: 100%;
        background-color: var(--primary_variant_light);
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        padding-top: var(--padding_minimum);
        padding-left: 4px;
        padding-right: var(--padding_minimum);
        align-items: center;
    }

</style>