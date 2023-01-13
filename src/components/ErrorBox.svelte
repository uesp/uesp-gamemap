<!-- /*================================================
				   Error box
================================================*/ -->
<script>
    import PreloadBox from "./PreloadBox.svelte";
    import Icon from "./Icon.svelte";
    import Divider from "./Divider.svelte";
    export let reason = "Try refreshing and try again.";
</script>

<PreloadBox>
    <span class="error_title">
        <Icon name="error" size="medium"></Icon><br>
        <b style="margin-bottom: 10px;">Something went wrong.</b>
    </span>
    <p></p>
    <Divider direction="horizontal"/>
    <p id="error_box_reason">{reason}</p>
</PreloadBox>

<style>

    .error_title {
        color: var(--error_dark);
        vertical-align: middle;
        font-size: 1.2em !important;
        vertical-align: middle;
    }
</style>