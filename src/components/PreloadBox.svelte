<!-- /*================================================
				   Preload box
================================================*/ -->

<div class="preload_box"><slot/></div>

<style>
    div {
        position: absolute;
        background-color: var(--surface_dark_variant);
        color: var(--text_on_secondary);
        border-radius: var(--padding_medium);
        padding: var(--padding_medium);
        width: auto;
        text-align: center;
        vertical-align: middle;
        top: 50%;
        left: 50%;
        min-width: 200px;
        min-height: 50px;
        transform: translate(-50%, -50%);
    }
</style>