<!-- @component
### Description
 Error box component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (9th Jan, 2023) -->

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
    <p/>
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