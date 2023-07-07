<!-- svelte-ignore a11y-missing-attribute -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- @component
### Description
 Dropdown menu component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (21st Feb, 2023) -->

<script>
    // import svelte stuff
    import { onMount } from 'svelte';
    import { createEventDispatcher } from "svelte";

    // state vars
    export let label;
    export let hint;
    export let tooltip;
    export let align = "left";
    export let invisible;
    export let selected;
    let id = Math.random().toString(36).substr(2, 10); // generate unique random string
    let container;
    let dropdown;
    let dropdownWrapper;
    let selectedIcon;


    const dispatch = createEventDispatcher();
    $: updateLabel(selected);

    // initiate dropdown menu
    onMount(async () => {
        M.FormSelect.init(document.querySelectorAll(`#form-select-${id}`), { dropdownOptions : {alignment: align, constrainWidth: false}});
        dropdownWrapper = container.querySelector('.select-dropdown.dropdown-trigger');
        onChanged();
        updateLabel(selected);
    });

    function updateLabel(selected) {
        if (dropdownWrapper && selected != null) {
            dropdown.value = selected;
            dropdownWrapper.value = dropdown.querySelector(`[value='${selected}']`).innerText;
        }
    }

    function onChanged(event) {

        if (event && event.type != "click") {
            dispatch("change", event.target.value);
        }

        // get dropdown selection icon if available
        let selected = container.querySelector('.selected');
        if (selected && selected.querySelector("img")) {
            let img = selected.querySelector("img");
            selectedIcon = img.src;
        } else {
            selectedIcon = null;
        }

    }

</script>

<markup>
    <div class="input-field col s12" on:click={onChanged} bind:this={container} class:invisible={invisible}>
        {#if label}
             <label class="label truncate" title={tooltip} for="form-select-{id}">{label}</label>
        {/if}
        <select id="form-select-{id}" bind:this={dropdown} on:change={onChanged}>
            {#if hint}<option value="" disabled>{hint}</option>{/if}
            <slot> <!-- Menu items go here --> </slot>
        </select>
        {#if selectedIcon && !invisible}
             <img class="selected-icon" src={selectedIcon}>
        {/if}
      </div>
</markup>

<style>

    .label {
        color: rgba(0, 0, 0, 0.87);
        font-size: 1rem;
    }

    .input-field.col label {
        left: 0px;
        top: 2.5px;
    }

    .input-field {
        display: inline-block;
        width: 100%;
        margin-top: 2px;
        margin-bottom: -10px;
    }

    .selected-icon {
        position: absolute;
        top: 10px;
        bottom: 8px;
        right: 4px;
        pointer-events: none;
        width: 24px;
        height: 24px;
    }

</style>