<!-- @component
### Description
 UESP gamemap edit panel.

### Author(s)
- Thal-J <thal-j@uesp.net> (6th March, 2023) -->

<script>

    // import svelte core stuff
    import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
    import { tweened } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
  import AppBar from './AppBar.svelte';

    // state vars and constants
    let editPanel;
    const PANEL_WIDTH = 480;
    const ANIMATION_DURATION = 350;
    const TWEEN = tweened(0, {duration: ANIMATION_DURATION, easing: cubicInOut });
    TWEEN.set(1);

    // slide out animation
    function slideOut() { TWEEN.set(0);
        return { ANIMATION_DURATION, css: () => `width: ${$TWEEN * PANEL_WIDTH}`};
    }
</script>


<markup>
    <aside id="edit-panel" bind:this={editPanel} style="width: {$TWEEN * PANEL_WIDTH}px;" out:slideOut>
        <div id="edit-panel-content" in:fade={{duration: ANIMATION_DURATION / 2}} out:fade={{duration: ANIMATION_DURATION / 2}}>

            <AppBar title="Edit"></AppBar>
            <b>stuff coming here soon</b>

        </div>
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