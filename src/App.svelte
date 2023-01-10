<script>

	// import UI components
	import ErrorBox from "./components/ErrorBox.svelte";
	import Icon from "./components/Icon.svelte";
	import Divider from "./components/Divider.svelte";
	import ProgressBar from "./components/ProgressBar.svelte"
</script>

<main>
	<h1>Svelte Testing</h1>
	<p>Deez nuts jerma adadada e adad <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	<ErrorBox/>
	<Icon name="settings" size=80></Icon>
	<Divider direction="vertical"></Divider>
	<ProgressBar/>

</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>