<!-- @component
### Description
 Form group component for the UESP gamemap.

 ### Author(s)
- Thal-J <thal-j@uesp.net> (28th March, 2023) -->


<script>
    import Icon from "./Icon.svelte";

    export let title = "Form group";
    export let icon;
</script>

<markup>

    <div class="group">
        <span class="title">
            {#if icon}
                <Icon name={icon} size=16/>
            {/if}
            <b>{title}</b>
        </span>

        <slot>
            <!-- forms go here -->
        </slot>
    </div>

</markup>

<style>

    .title {
        top: -13px;
        font-size: 15px;
        position: absolute;
        background-color: var(--surface);
        padding: 2px;
        padding-left: 4px;
        padding-right: 4px;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    .group {
        margin: var(--padding_minimum);
        margin-bottom: var(--padding_small);
        padding: var(--padding_minimum);
        border-color: var(--divider);
        border-width: 3px;
        border-style: solid;
        border-radius: var(--padding_minimum);
        position: relative;
    }

    .title {
        align-items: center;
        display: flex;
        gap: 4px;
    }
</style>