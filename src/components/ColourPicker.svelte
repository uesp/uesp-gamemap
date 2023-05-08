<!-- @component
### Description
 Colour picker component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (8th May, 2023) -->

<script>

	// import svelte stuff
	import { onMount } from 'svelte';
    import { createEventDispatcher } from "svelte";

	// import ui components
	import Textbox from "./Textbox.svelte";
	import Picker from 'vanilla-picker';

	// state vars
	export let label;
	export let placeholder;
	export let showTextBox = true;
	export let colour;
	let picker;
	let colourPickerAnchor;
	let colourPickerPreview;

	// on component load
	onMount(async() => {

		colourPickerPreview.style.background = colour;

		picker = new Picker({
			parent: colourPickerAnchor,
			popup : "left",
			editorFormat : "rgb",
			color : colour,
		});

		picker.onChange = function(color) {
			colourPickerPreview.style.background = color.rgbaString;
			colour = color.rgbaString;
		};
	});


</script>



<markup>

	<div class="colour-picker-container">
		{#if showTextBox}
			 <Textbox placeholder={placeholder} block={true} label={label} text={colour} bind:value={colour}/>
		{/if}

		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div class="colour-picker" class:hasTextbox={showTextBox} on:click={() => picker.show()}>
			<div class="colour-preview" bind:this={colourPickerPreview}/>
		</div>
		<!-- svelte-ignore a11y-missing-content -->
		<a id="colour-picker-anchor" bind:this={colourPickerAnchor}></a>
	</div>


    <!-- export let label;
    export let hint = "Enter text...";
    export let block = false;
    export let subtext;
    export let text;
    export let value = text;
    export let tooltip;
    export let type = "text";
    export let hideSpinner = type == "float"; -->




</markup>

<style>

	:root {
		--checkerboard-dark-grey: #808080;
  		--checkerboard-light-grey: #a9a9a9;
	}

	.colour-picker {
		height: 30px;
		width: 30px;
		margin: var(--padding_minimum);
		background: linear-gradient(45deg, lightgrey 25%, transparent 25%, transparent 75%, lightgrey 75%) 0 0/2em 2em,linear-gradient(45deg, lightgrey 25%, white 25%, white 75%, lightgrey 75%) 1em 1em/2em 2em;
		border: 3px solid white;
		border-radius: 6px;
		cursor: pointer;
		box-shadow: 0px 0px 0px 1px var(--divider);
		overflow: hidden;
	}

	.colour-picker:hover {
		filter: brightness(0.8);
	}

	.colour-picker:active {
		filter: brightness(0.7);
	}

	.hasTextbox {
		position: absolute;
		bottom: 10px;
		right: 8px;
	}

	.colour-preview {
		width: auto;
		height: inherit;
		position: relative;
	}

	#colour-picker-anchor {
		margin: var(--padding_minimum);
		position: absolute;
		bottom: 10px;
		right: 8px;
		height: 30px;
		width: 30px;
		pointer-events: none;
	}

</style>