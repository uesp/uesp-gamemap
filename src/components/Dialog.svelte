<!-- @component
### Description
 Dialog component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (10th Feb, 2023) -->

<script>

	// import svelte core stuff
	import { onMount } from 'svelte';
    import { createEventDispatcher } from "svelte";
    import { scale } from 'svelte/transition';
  import Button from './Button.svelte';

    export let title = "Dialog title";
    export let fixedFooter = false;
    export let cancel = "Close";
    export let dismissible = true;
    let isShown = false;
    let dialog;

    const dispatch = createEventDispatcher();
    // onMount(async () => {
    //      dialog.showModal();
    // });

    export function show() {
        isShown = true;
        setTimeout(() => { dialog?.showModal() }, 1);
    }

    export function dismiss() {
        isShown = false;
    }

    function onConfirm() {
        dispatch("confirm", "confirmed");
    }
</script>

<markup>
    {#if isShown}
        <dialog bind:this={dialog} class="modal" class:modal-fixed-footer={fixedFooter} in:scale out:scale>
            <div class="modal-content">
                <h4>{title}</h4>
                <slot>
                    <!-- Default loading text when nothing provided -->
                    <p>Loading...</p>
                </slot>
            </div>
            <div class="modal-footer">

                <!-- confirm button -->

                <!-- decline button -->

                <!-- cancel button -->
                <Button on:click={() => dismiss()}>{cancel}</Button>
                <a href="#!" class="modal-close waves-effect btn-flat">{cancel}</a>
            </div>
        </dialog>
    {/if}
</markup>

<style>
    .modal {
        display: block;
        border: 0;
    }

    dialog::backdrop {
        background-color: black;
        opacity: 0.5;
    }
</style>