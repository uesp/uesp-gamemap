<!-- @component
### Description
 Colour preview component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (19th June, 2023) -->

<script>

    export let data;

    let isHovered = false;
    $: fillColour = (!isHovered) ? data.fillColour : data.fillColourHover;
    $: strokeColour = (!isHovered) ? data.strokeColour : data.strokeColourHover;
    $: strokeWidth = (!isHovered) ? data.strokeWidth : data.strokeWidthHover;

</script>

<markup>

    <div id="colour-preview-container">
        <div class="colour-picker" title="Colour preview">
            <div class="colour-preview" style:--fillColour={fillColour} style:--strokeColour={strokeColour} style:--strokeWidth={strokeWidth+"px"} on:mouseenter={() => isHovered = true} on:mouseleave={() => isHovered = false}></div>
        </div>

        <small class="label">Preview</small>
    </div>

</markup>

<style>

    .colour-preview {
        width: auto;
		height: inherit;
		position: relative;
        border: var(--strokeWidth) solid var(--strokeColour);
        background: var(--fillColour);
        border-radius: var(--radius_large);
	}

    #colour-preview-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .colour-picker {
		height: 100px;
		width: 100px;
		margin: var(--padding_minimum);
		background: linear-gradient(45deg, lightgrey 25%, transparent 25%, transparent 75%, lightgrey 75%) 0 0/2em 2em,linear-gradient(45deg, lightgrey 25%, white 25%, white 75%, lightgrey 75%) 1em 1em/2em 2em;
		border-radius: var(--radius_large);
		box-shadow: 0px 0px 0px 1px var(--divider);
		overflow: hidden;
	}

    .label {
        color: var(--text_low_emphasis);
        font-size: 85%;
    }

</style>