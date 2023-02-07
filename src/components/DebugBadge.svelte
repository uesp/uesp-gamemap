<!-- @component
### Description
 Debug tag component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (10th Jan, 2023) -->

<div id="debug_tag">
    <b>Debug</b>
</div>

<style>
    b {
        color: white;
        text-shadow: 0px 0px 6px var(--background);
    }

    #debug_tag {
        opacity: 0.5;
        top: 15px;
        right: -35px;
        z-index: 9999;
        rotate: 45deg;
        position: fixed;
        background-color: var(--error_dark);
        padding-left: 3em;
        padding-right: 3em;
        padding-top: 2px;
        padding-bottom: 2px;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        pointer-events: none;
    }
</style>