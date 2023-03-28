<!-- @component
### Description
 Form group component for the UESP gamemap.

 ### Author(s)
- Thal-J <thal-j@uesp.net> (28th March, 2023) -->


<script>
    export let title = "Form group";
</script>

<markup>

    <div class="group">
        <b>{title}</b>
        <slot>
            <!-- forms go here -->
        </slot>
    </div>

</markup>

<style>

    .group {
        margin: var(--padding_minimum);
        margin-bottom: var(--padding_small);
        padding: var(--padding_minimum);
        border-color: var(--divider);
        border-width: 3px;
        border-style: solid;
        border-radius: var(--padding_minimum);
    }

    b {
        top: 4px;
        font-size: 15px;
        position: absolute;
        background-color: var(--surface);
        padding: 2px;
        padding-left: 4px;
        padding-right: 4px;
    }
</style>