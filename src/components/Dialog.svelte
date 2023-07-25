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
    export let cancel = "Cancel";
    export let confirm;
    export let dismissible = true;
    let isShown = false;
    let dialog;
    let callback;

    const dispatch = createEventDispatcher();

    export function show(callbackFn) {
        isShown = true;
        callback = callbackFn;
        setTimeout(() => { init() }, 1);
    }

    function init() {
        dialog?.showModal();
        if (dismissible) {
            dialog.addEventListener('click', ({target:dialog}) => {
                if (dialog.nodeName === 'DIALOG') {
                    dismiss();
                }
            });
        }

        // hack to fix urls
        setTimeout(() => {
            let links = dialog.querySelectorAll('[href]')
            for (let element of links) {
                let link = element.href.replace(location.origin, "");
                element.href = decodeURIComponent(link).substring(1);
            }
         }, 500);

    }

    export function showWithCallback(callback) {
        show(callback);
    }

    export function dismiss() {
        isShown = false;
        dispatch("dismiss");
        if (callback) {
            callback("dismiss");
        }
    }

    function doConfirm() {
        isShown = false;
        if (callback) {
            callback("confirm");
        }
        dispatch("confirm");
    }

    function escPressed(event) {
        if (event.key == "Escape") {
            dismiss();
        }
    }
</script>

<markup>
    {#if isShown}
        <dialog bind:this={dialog} class="modal" class:modal-fixed-footer={fixedFooter} in:scale out:scale={{duration: 250, opacity: 0}} on:keyup={escPressed}>
            <div class="modal-content">
                <h4>{title}</h4>
                <slot>
                    <p>Loading...</p>
                </slot>
            </div>
            <div class="modal-footer">

                <!-- cancel button -->
                <Button on:click={() => dismiss()} flat={true} ripple="dark">{cancel?.toSentenceCase()}</Button>

                <!-- confirm button -->
                {#if confirm}
                     <Button on:click={() => doConfirm()}>Confirm</Button>
                {/if}
            </div>
        </dialog>
    {/if}
</markup>

<style>
    .modal {
        display: block;
        border: 0;
        width: fit-content;
    }

    .modal.modal-fixed-footer {
        width: 65%;
    }

    dialog::backdrop {
        background-color: black;
        opacity: 0.5;
    }

    .modal-footer {
        display: flex;
        flex-direction: row;
        gap: var(--padding_minimum) !important;
        padding-left: var(--padding_medium) !important;
        padding-right: var(--padding_medium) !important;
        justify-content: flex-end;
    }

</style>