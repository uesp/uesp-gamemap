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

	// set up state variables
	print("Initialising gamemap...");
	let isLoading = true;
	let loadingReason = "Loading map";
	let isError = false;
	let errorReason = "";

	// get game name from URL
	let gameParam = (window.location.pathname.replace(/\\|\//g,'') != "") ? window.location.pathname.replace(/\\|\//g,'') : null;
	print("Game parameter: " + gameParam);

	if (gameParam != null && gameParam.match(/^([a-z]+)/)) {

	} else {
		setError("No valid game provided.");
		// TODO: maybe show list of games here to select
	}


	function setLoading(reason) {
		if (reason == false) {
			isLoading = reason;
		} else {
			isLoading = true;
			loadingReason = reason;
		}
	}

	function setError(reason) {
		if (reason == false) {
			isError = reason;
		} else {
			setLoading(false);
			isError = true;
			errorReason = reason;
		}
	}

	// if (gameParam != null && gameParam != "" && ) { // check if game name is valid

	// 	// we've got a valid game, now to check whether it has a valid config file, and merge with the client's default
	// 	log("URL has game param!");


	// 	// get default map config
	// 	Utils.getJSON(Constants.DEFAULT_MAP_CONFIG_DIR, function(error, defaultMapConfig) {
	// 		if (error == null) {

	// 			// set up default map config
	// 			window.DEFAULT_MAP_CONFIG = defaultMapConfig;

	// 			// format: /assets/maps/{gameParam}/config/{gameParam}-config.json
	// 			// example: /assets/maps/eso/config/eso-config.json
	// 			let configURL = (Constants.MAP_ASSETS_DIR + gameParam + "/config/" + gameParam + "-" + Constants.MAP_CONFIG_FILENAME);
	// 			log("Getting map config at " + configURL + "...");

	// 			// check if provided map's map config exists before continuing
	// 			if (Utils.doesFileExist(configURL)) {

	// 				Utils.getJSON(configURL, function(error, object) {
	// 					if (error !== null) {
	// 						showError("Could not load map: " + error);
	// 					} else {
	// 						log("Imported map config successfully!");
	// 						mapConfig = object;

	// 						log("Merging with default map config...")
	// 						let mergedMapConfig = Utils.mergeObjects(DEFAULT_MAP_CONFIG, mapConfig);
	// 						mapConfig = mergedMapConfig;

	// 						// set up map config assets
	// 						mapConfig.assetsPath = mapConfig.assetsPath + mapConfig.database + "/";
	// 						mapConfig.missingMapTilePath = mapConfig.assetsPath + "images/outofrange.jpg";
	// 						mapConfig.iconPath = mapConfig.assetsPath + "icons/";
	// 						mapConfig.imagesPath = mapConfig.assetsPath + "images/";
	// 						mapConfig.tileURL = (mapConfig.tileURLName != null) ? mapConfig.baseTileURL + mapConfig.tileURLName + "/" : mapConfig.baseTileURL + mapConfig.database + "map/"; // note: sometimes tileURLs on the server are not consistent with the databaseName+"map" schema, so you can define an tileURLName in the map config to override this.

	// 						log("Completed merged map config:")
	// 						log(mapConfig);

	// 						// load map
	// 						loadGamemap(mapConfig);
	// 					}
	// 				})
	// 			} else { showError("Provided game doesn't exist. Please check the URL.");}
	// 		} else { showError("There was an error getting the default map config." + error);}})
	// } else { showError("No valid game provided."); }







	function zoom(event) {
		console.log("ligma");
	}


	setTimeout(function() {
		isLoading = false;
		print("joe mama");
	}, 3000);


	// Enable google analytics on release mode
	if (isRelease) {
		let _gaq = [];
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



<!-- Preload components -->
{#if isLoading}
	 <LoadingBox reason={loadingReason+"..."}/>
{/if}

{#if isError}
	 <ErrorBox reason={errorReason}/>
{/if}

<!-- Show debug tag in top right corner if app is in dev mode -->
<!-- svelte-ignore missing-declaration -->
{#if isDebug}
	<DebugTag/>
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