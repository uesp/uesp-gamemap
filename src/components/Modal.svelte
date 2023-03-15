<!-- @component
### Description
 Modal pop-up component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (10th Feb, 2023) -->

<script>

	// import svelte core stuff
	import { onMount } from 'svelte';
    import { createEventDispatcher } from "svelte";

    export let id;
    export let fixedFooter = false;
    export let title = "Modal dialog";
    export let cancel = "Close";
    export let dismissible = true;
    export let isShown = false;

    const dispatch = createEventDispatcher();
    onMount(async () => { initialise(); });

    function initialise() {
        // initiate modal dialog
        var elems = document.querySelectorAll('.modal');
        M.Modal.init(elems, {
            dismissible: dismissible,
            onCloseEnd: () => (dispatch("dismiss", "dismissed")),
        });
    }

    export function show() {
        isShown = true;
        setTimeout(function() {
            initialise();
            print("should be being shown")
        }, 100);
    }

    function onConfirm() {
        dispatch("confirm", "confirmed");
    }
</script>

<markup>
    <div id={id} class="modal" class:modal-fixed-footer={fixedFooter}>
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
            <a href="#!" class="modal-close waves-effect btn-flat">{cancel}</a>
        </div>
    </div>
</markup>