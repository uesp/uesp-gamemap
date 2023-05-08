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
	let colourPicker;

	// on component load
	onMount(async() => {

		let picker = new Picker({
			parent: colourPicker,
			popup : "left",
		});


		picker.onChange = function(color) {
			//parent.style.background = color.rgbaString;
		};

	});





</script>



<markup>

	<div class="colour-picker-container">
		{#if showTextBox}
			 <Textbox placeholder={placeholder} block={true} label={label}/>
		{/if}


		<div class="colour-picker" class:hasTextbox={showTextBox} bind:this={colourPicker}>
			<div class="colour-preview">

			</div>
		</div>
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
		background-image: conic-gradient(var(--checkerboard-dark-grey) 25%, var(--checkerboard-light-grey) 25%, var(--checkerboard-light-grey) 50%, var(--checkerboard-dark-grey) 50%, var(--checkerboard-dark-grey) 75%, var(--checkerboard-light-grey) 75%);
		background-size: var(--padding_minimum) var(--padding_minimum);
		border: 3px solid white;
		border-radius: 6px;
		z-index: 9999;
		cursor: pointer;
		box-shadow: 0px 0px 0px 1px var(--divider);
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
		background: #74a6a6;
		width: auto;
		height: inherit;
		position: relative;
	}

</style>