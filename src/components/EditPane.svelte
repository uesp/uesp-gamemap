<!-- @component
### Description
 UESP gamemap edit panel.

### Author(s)
- Thal-J <thal-j@uesp.net> (21st Feb, 2023) -->



<script>

    import { fade } from 'svelte/transition';


</script>


<markup>
    <aside id="edit-panel" in:fade>


    </aside>
</markup>


<style>
    #edit-panel {
        background-color: var(--surface);
        width: var(--side_panel_width);
        height: 100%;
        z-index: 100;
        position: relative;
    }
</style>