<!-- @component
### Description
 Suggestion bar component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (6th July, 2023) -->

<script>
	// import svelte stuff
    import { createEventDispatcher } from "svelte";
	import { slide, scale } from 'svelte/transition';

	// import ui components
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';

	export let suggestion = "suggestion";

	const dispatch = createEventDispatcher();

	function confirm() {
		dispatch("confirm");
	}

</script>

<markup>
	<div id="suggestion_bar" in:slide out:slide style = "margin-bottom:6px;">
		<hr style="margin-top:12px;" in:scale out:scale>
		<div id="suggestion_container">
			<Icon name="emoji_objects"/>
			<b style="flex-grow: 1;">Use suggested settings for "{suggestion}"?</b>
			<Button text="OK" on:click={confirm}></Button>
		</div>
		<hr in:scale out:scale>
	</div>
</markup>

<style>

	#suggestion_container {
		display: flex;
		padding: var(--padding_medium);
		align-content: center;
		align-items: center;
		gap: var(--padding_medium);
		padding-bottom: 8px;
		padding-top: 8px;
	}

	hr {
		width: 95%;
	}

</style>