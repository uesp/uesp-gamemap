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


    // import ui components
    import AppBar from './AppBar.svelte';
    import Button from './Button.svelte';

    // state vars and constants
    let editPanel;
    const PANEL_WIDTH = 480;
    const ANIMATION_DURATION = 350;
    const TWEEN = tweened(0, {duration: ANIMATION_DURATION, easing: cubicInOut } );
    TWEEN.set(1);

    // on added to DOM
    onMount(async () => {
        // call resize event whenever edit panel is resized
        const resizeObserver = new ResizeObserver(() => { window.dispatchEvent(new Event('resize'));});
        resizeObserver.observe(editPanel);
    });

    // slide out animation
    function slideOut() { TWEEN.set(0);
        gamemap.getMapObject().invalidateSize();
        return { ANIMATION_DURATION, css: () => `width: ${$TWEEN * PANEL_WIDTH}`};
    }



</script>


<markup>
    <aside id="edit-panel" bind:this={editPanel} style="width: {$TWEEN * PANEL_WIDTH}px;" out:slideOut>

        <div id="edit-overlay"></div>

        <AppBar title="Map Editor"></AppBar>


        <div id="edit-panel-content" in:fade={{duration: ANIMATION_DURATION / 2}} out:fade={{duration: ANIMATION_DURATION / 2}}>

            <b>Actions</b><br/>
            <div id="actions-container">
                <Button text="Edit World" icon="public"></Button>
                <Button text="Add Location" icon="add_location_alt"></Button>
                <Button text="Add Path" icon="polyline"></Button>
                <Button text="Add Area" icon="select"></Button>
            </div>
            <b>Recent Changes</b>
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

    #edit-overlay {
        background-color: rgba(0, 0, 0, 0.65);
        width: 100%;
        height: 100%;
        position: absolute;
        pointer-events: all;
        z-index: 5;
        display: none;
    }

    #edit-panel-content {
        padding: var(--padding_minimum);
    }

    b {
        font-size: 16px;
    }

    #actions-container {
        padding-top: 4px;
        padding-bottom: 6px;
    }

</style>