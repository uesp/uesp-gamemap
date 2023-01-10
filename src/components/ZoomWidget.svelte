
<script>
    import Icon from "./Icon.svelte";
</script>

<!-- Zoom widget -->
<div id="zoom_widget">
    <button class="btn_zoom waves-effect" onclick="zoomIn()" id="btn_zoom_in" tabindex="-1" title="Zoom in"><Icon name="add"/></button>
    <div class="horizontal_divider"></div>
    <button class="btn_zoom waves-effect" onclick="zoomOut()" id="btn_zoom_out" tabindex="-1" title="Zoom out"><Icon name="remove"/></button>
</div>

<style>
    /*================================================
                        Zoom Widget
    ================================================*/

    #zoom_widget {
        position: absolute;
        background: var(--primary_variant_light);
        border-radius: 64px;
        z-index: 1000;
        bottom: var(--padding_large);
        right: var(--padding_minimum);
        width: var(--appbar_dimen);
        height: 100px;
        display: flex;
        flex-direction: column;
        flex: auto;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
    }

    .btn_zoom {
        width: 100%;
        flex-grow: 1;
        background: transparent;
        border: none;
        transform: translateZ(0);
        z-index: 1001;
        border-radius: 64px;
        transition: all ease-in-out 50ms;
    }

    .btn_zoom:hover:disabled  {
        cursor: default;
    }

    .btn_zoom:hover:enabled, .btn_zoom:active:enabled {
        background: var(--divider);
    }

</style>