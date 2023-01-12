<script>
	// import UI components
	import ErrorBox from "./components/ErrorBox.svelte";
	import Icon from "./components/Icon.svelte";
	import Divider from "./components/Divider.svelte";
	import ProgressBar from "./components/ProgressBar.svelte"
	import LoadingBox from "./components/LoadingBox.svelte";
	import ZoomWidget from "./components/ZoomWidget.svelte";
	import DebugTag from "./components/DebugTag.svelte";


	// import commons
	import * as Utils from "./common/utils.js";


	function zoom(event) {
		console.log("ligma");
	}

	// state variables
	let loading = true;
	let loadingReason = "Loading config";

	setTimeout(function() {
		loading = false;
		print("joe mama");

	}, 5000);


	// Enable google analytics on release mode
	if (isRelease) {
		let _gaq = _gaq || [];
		_gaq.push(['_setAccount', 'UA-1386039-6']);
		_gaq.push(['_trackPageview']);

		(function() {
			let ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
			ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
			let s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		})();
	}
</script>

<!-- App container -->
<main id="app">
	<h1>Svelte Testing</h1>
	<p>Testing using <a href="https://svelte.dev/tutorial">Svelte</a>.</p>

	<Icon name="settings" size=80></Icon>
	<!-- <Divider direction="vertical"></Divider>
	<ProgressBar/> -->


	<ZoomWidget on:zoomclicked={zoom}/>

	<!-- Gamemap container -->
	<div id="gamemap"></div>



</main>

<!-- Show debug tag in top right corner if app is in dev mode -->
<!-- svelte-ignore missing-declaration -->
{#if isDebug}
	<DebugTag/>
{/if}

<!-- Preloader component -->
{#if loading}
	 <LoadingBox reason={loadingReason+"..."}/>
{/if}

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		color: white;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>