<!-- /*================================================
				   Error box
================================================*/ -->
<script>
    import PreloadBox from "./PreloadBox.svelte";
    import Icon from "./Icon.svelte";
    import Divider from "./Divider.svelte";
    export let errorReason = "Try refreshing and try again.";
</script>

<PreloadBox>
    <span class="error_title">
        <Icon name="error" size="medium"></Icon><br>
        <b>Something went wrong.</b>
    </span>

    <Divider direction="horizontal"/>
    <p id="error_box_reason">{errorReason}</p>
</PreloadBox>

<style>
    .error_title {
        color: var(--error_dark);
        vertical-align: middle;
        font-size: 1.2em !important;
        vertical-align: middle;
    }
</style>