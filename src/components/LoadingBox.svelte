<!-- Loading box component -->

<script>
    import PreloadBox from "./PreloadBox.svelte";
    import LoadingSpinner from "./LoadingSpinner.svelte";
    export let reason = "Loading..."; // loading reason
</script>

<PreloadBox>
    <LoadingSpinner/>
    <p id="loading_reason">{reason}</p>
</PreloadBox>