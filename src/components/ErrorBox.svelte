<!-- /*================================================
				   Error box
================================================*/ -->
<script>
    import PreloadBox from "./PreloadBox.svelte";
    export let errorReason = "There should be an error reason here.";
</script>



<PreloadBox>
    <span class="error_title">
        <i class="medium material-icons">error</i><br/>
        <b>Something went wrong.</b>
    </span>
    <div class="horizontal_divider"></div>
    <p id="error_box_reason">{errorReason}</p>
</PreloadBox>

<style>

.horizontal_divider {
	margin-top: var(--padding_small);
}

.error_title {
	color: var(--error_dark);
	vertical-align: middle;
	font-size: 1.2em !important;
	vertical-align: middle;
}

</style>