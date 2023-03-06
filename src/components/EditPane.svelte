<!-- @component
### Description
 UESP gamemap edit panel.

### Author(s)
- Thal-J <thal-j@uesp.net> (21st Feb, 2023) -->

<script>

    // import svelte core stuff
    import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
    import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

    const progress = tweened(0, {
		duration: 400,
		easing: cubicOut,
	});

    let editPanel;
    const PANEL_WIDTH = 500;
    const ANIMATION_DURATION = 350;

	onMount(async() => {


        progress.set(1);

        print($progress);

    });

</script>


<markup>
    <aside id="edit-panel" bind:this={editPanel} in:fade={{duration: ANIMATION_DURATION}} style="width: {$progress * PANEL_WIDTH}px;">

        <b>{$progress}</b>


    </aside>
</markup>


<style>
    #edit-panel {
        background-color: var(--surface);
        width: 0px;
        height: 100%;
        z-index: 100;
        position: relative;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
    }
</style>