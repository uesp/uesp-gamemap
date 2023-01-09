<script>
	import PreloadBox from "./components/PreloadBox.svelte";
	import ErrorBox from "./components/ErrorBox.svelte";
	import Icon from "./components/Icon.svelte";
	let name = "joe";
</script>

<main>
	<h1>Hello {name}!</h1>
	<p>Deez nuts jerma adadada e adad<a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	<ErrorBox></ErrorBox>
	<Icon name="settings" size="small"></Icon>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>