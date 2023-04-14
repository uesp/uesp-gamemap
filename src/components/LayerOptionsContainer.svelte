<!-- @component
### Description
 Map options component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (06th Feb, 2023) -->

<script>
    // import svelte core stuff
    import { fade, fly } from 'svelte/transition';
</script>

<markup>
    <div in:fly="{{ y: 5, duration: 250 }}" out:fade="{{duration: 100}}" on:contextmenu={(e) => e.stopPropagation()}>
        <slot/>
    </div>
</markup>

<style>
    div {
        width: 100%;
        pointer-events: none;
        position: absolute;
        bottom: var(--padding_minimum);
        color: white;
        z-index: 800;
        text-align: center;
    }
</style>