<!-- /*================================================
				   Preload box
================================================*/ -->

<div class="preload_box"><slot/></div>

<style>
    div {
        position: absolute;
        background-color: var(--surface_dark_variant);
        color: var(--text_on_secondary);
        border-radius: var(--radius_large);
        padding: var(--padding_medium);
        width: auto;
        text-align: center;
        vertical-align: middle;
        top: 50%;
        left: 50%;
        min-width: 200px;
        min-height: 50px;
        transform: translate(-50%, -50%);
        z-index: 900;
        transition-property: background-color, border-radius;
        transition-duration: 300ms;
        transition-timing-function: ease;
    }
</style>