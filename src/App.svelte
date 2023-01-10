<script>
	// import UI components
	import ErrorBox from "./components/ErrorBox.svelte";
	import Icon from "./components/Icon.svelte";
	import Divider from "./components/Divider.svelte";
	import ProgressBar from "./components/ProgressBar.svelte"
	import LoadingBox from "./components/LoadingBox.svelte";
	import ZoomWidget from "./components/ZoomWidget.svelte";


	// state variables

	let loading = true;
</script>

<!-- App container -->
<main id="app">
	<h1>Svelte Testing</h1>
	<p>Deez nuts jerma adadada e adad <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	<LoadingBox reason="loading reason here"/>
	<Icon name="settings" size=80></Icon>
	<Divider direction="vertical"></Divider>
	<ProgressBar/>
	<ZoomWidget></ZoomWidget>



	<!-- Gamemap container -->
	<div id="gamemap"></div>

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