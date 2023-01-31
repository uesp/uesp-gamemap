<!-- @component
### Description
 The UESP Gamemap is web app for displaying Elder Scrolls games' maps.
 It supports a variety of other map formats, and can be modified to support other games if desired.

 See @gamemap.js for actual map viewer implementation.

### Author(s)
- Dave Humphrey <dave@uesp.net> (21st Jan 2014)
- Thal-J <thal-j@uesp.net> (16th Aug 2022)

### Note
 To disable the unused css warnings in this file, follow
 the instructions on this page:
 https://stackoverflow.com/a/60720816 -->

<!-- App -->
<script>

	/*================================================
						Initialisation
	================================================*/

	// import svelte core stuff
	import { onMount } from 'svelte';

	// import material UI
	import "materialize-css";
	import 'materialize-css/dist/css/materialize.min.css';
	import 'material-design-icons-iconfont';

	// import UI components
	import ErrorBox from "./components/ErrorBox.svelte";
	import ProgressBar from "./components/ProgressBar.svelte"
	import LoadingBox from "./components/LoadingBox.svelte";
	import ZoomWidget from "./components/ZoomWidget.svelte";
	import DebugBadge from "./components/DebugBadge.svelte";
	import LayerSwitcher from './components/LayerSwitcher.svelte';
	import Watermark from './components/Watermark.svelte';
	import MapChooser from './components/MapChooser.svelte';

	// import commons
	import * as Utils from "./common/utils.js";
	import * as Constants from "./common/constants.js";

	// import gamemap
	import Gamemap from "./map/gamemap.js";

	print("Initialising app...");

	// set up state variables
	let isLoading = true;
	let loadingReason = "";
	let isLoaded = false;
	let isError = false;
	let errorReason = "";
	let mapConfig = null;
	let gamemap = null;
	let editingEnabled = false;
	let isEmbedded = window.self !== window.top;
	let uespEmbed = isEmbedded && Utils.getURLParams.has("uespEmbed");
	let currentZoom = Utils.getURLParams().has("zoom") ? Utils.getURLParams().get("zoom") : 0;
	let showUI = true;
	let showLayerSwitcher = false;
	let showMaps = false;
	$: editMode = false;

	// on document load
	onMount(async () => {

		// remove noscript message
		var element = document.getElementsByTagName("noscript");
		for (let index = element.length - 1; index >= 0; index--) {
			element[index].parentNode.removeChild(element[index]);
		}

		// disable zooming on mobile
		setTimeout(function() {
			document.firstElementChild.style.zoom = "reset";
			let viewportmeta = document.querySelector('meta[name="viewport"]');
			viewportmeta.content = 'user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0';
			print("App zoom disabled.");
		}, (location.toString().includes("dev") ? 10000 : 0)); // wait 10s on dev to bypass google lighthouse accessibility check

		// get game name from URL
		let gameParam = (location.pathname.replace(/\\|\//g,'') != "") ? location.pathname.replace(/\\|\//g,'') : (location.search != null) ? Utils.getURLParams().get("game") : null;
		setLoading("Loading map");

		if (gameParam != null && gameParam.match(/^([a-z]+)/)) {
			print("Game parameter was: " + gameParam);

			// begin getting map config
			Utils.getJSON(Constants.DEFAULT_MAP_CONFIG_DIR, function(error, defaultMapConfig) {
				if (!error) {

					// set up default map config
					window.DEFAULT_MAP_CONFIG = defaultMapConfig;

					// example: /assets/maps/eso/config/eso-config.json
					let configURL = (Constants.MAP_ASSETS_DIR + gameParam + "/config/" + gameParam + "-" + Constants.MAP_CONFIG_FILENAME);
					setLoading("Loading config");
					print("Getting map config at " + configURL + "...");

					Utils.getJSON(configURL, function(error, object) {
						if (!error) {
							print("Imported map config successfully.");
							mapConfig = object;

							print("Merging with default map config...")
							let mergedMapConfig = Utils.mergeObjects(DEFAULT_MAP_CONFIG, mapConfig);
							mapConfig = mergedMapConfig;

							// set up map config assets
							mapConfig.assetsPath = mapConfig.assetsPath + mapConfig.database + "/";
							mapConfig.missingMapTilePath = mapConfig.assetsPath + "images/outofrange.jpg";
							mapConfig.iconPath = mapConfig.assetsPath + "icons/";
							mapConfig.imagesPath = mapConfig.assetsPath + "images/";
							// note: sometimes tileURLs on the server are not consistent with the databaseName+"map" schema, so you can define an tileURLName in the map config to override this.
							mapConfig.tileURL = (mapConfig.tileURLName != null) ? mapConfig.baseTileURL + mapConfig.tileURLName + "/" : mapConfig.baseTileURL + mapConfig.database + "map/";
							mapConfig.hasGrid = mapConfig.cellSize != null;
							mapConfig.hasResources = mapConfig.hasGrid && false; // TODO

							print("Completed merged map config:")
							print(mapConfig);

							// load map
							loadGamemap(mapConfig);

						} else {
							error.toString().includes("JSON.parse") ? setError("Provided game doesn't exist. Please check the URL.") : setError("Could not load map: " + error);
						}});
				} else { setError("There was an error getting the default map config." + error);}})
		} else {

			print.warn("Game parameter was missing or invalid.");

			// if debug mode, redirect to eso map by default
			if (location.href.includes("localhost") && isDebug) {
				location.href = "http://localhost:8080/?game=eso";
			}

			// hide loading spinner and show map selector
			setLoading(false);
			showMaps = true;
		}
	});

	/*================================================
						General
	================================================*/

	function setLoading(reason) {

		// are we being passed a boolean?
		if (typeof reason === "boolean"){
			isLoading = reason;
			loadingReason = "";
		} else { // else we're being passed a string
			isLoading = true;
			loadingReason = reason;
			print(loadingReason+"...");
		}
	}

	function setError(reason) {
		if (reason == false) {
			isError = reason;
		} else {
			setLoading(false);
			isError = true;
			errorReason = reason;
			print.error(reason);
		}
	}

	function onKeyPressed(key) {

		// if "Insert" key pressed, hide UI
		if (key.keyCode == 45) {
			showUI = !showUI;
			print("UI " + ((showUI) ? "shown." : "hidden."));
		}

	}

	/*================================================
							Gamemap
	================================================*/

	function loadGamemap(mapConfig) {

		print("Is embedded: " + isEmbedded);

		// define callbacks
		let mapCallbacks = {
			onWorldsLoaded,
			onPermissionsLoaded,
			onWorldChanged,
			onZoom,
			hideMenus,
			onMapLoaded,
			setLoading,
		};

		window.gamemap = new Gamemap(document.querySelector('#gamemap'), mapConfig, mapCallbacks);
		gamemap = window.gamemap;
	}

	function setWindowTitle(worldName) {

		// default dynamic map title
		document.title = mapConfig.mapTitle;

		if (gamemap.hasMultipleWorlds()) { // show map world in title if there is one
			document.title = worldName + " | " + document.title;
		}

		document.title = document.title + (" (UESP)");
	}

	/*================================================
						Callbacks
	================================================*/

	function onMapLoaded() {
		setLoading(false);
		currentZoom = gamemap.getCurrentZoom();
	}

	function onWorldsLoaded(mapWorlds) {

		print("Worlds loaded!");
		print(mapWorlds);

		showLayerSwitcher = (mapConfig.tileLayers.length > 1 || mapConfig.hasResources || mapConfig.hasGrid);

		setLoading(false); // hide loading spinner

		if (gamemap.hasMultipleWorlds()) {

			// // only show the location switcher if there are more than two worlds
			// $("#btn_location_switcher").show();
			// $("#btn_goto_article").show();

			// // populate location switcher
			// createWorldLists(mapWorlds);

		}

		if (mapConfig.hasCellGrid) {
			// $("#btn_toggle_grid").show();
		}
	}

	function onWorldChanged(newWorld) {
		// $('#current_location_label').text(newWorld.displayName);
		setWindowTitle(newWorld.displayName);
		isLoaded = true;
		//setContext("currentWorld", newWorld);
		// updateWorldList(newWorld.name);
		// clearSearch();
	}

	function onZoom(data) {

		// if data an int, then update zoom level
		// however, if its an event, then send zoom back to gamemap

		if (!isNaN(data)) {
            currentZoom = data;
        } else {
			gamemap.setZoomTo(data.detail)
		}

	}

	function hideMenus(newWorld) {
		// $('#current_location_label').text(newWorld.displayName);
		// setWindowTitle(newWorld.displayName);
		// updateWorldList(newWorld.name);
		// clearSearch();
	}

	function onPermissionsLoaded(enableEditing) {
		print("Editing permissions loaded, editing is: " + enableEditing);
		editingEnabled = enableEditing;
	}

	/*================================================
						Analytics
	================================================*/

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

<!-- App markup -->
<markup>

	<!-- Gamemap container -->
	<div id="gamemap"></div>
	{#if gamemap}

		<!-- only show ui when ui is enabled -->
		{#if showUI}

			<!-- only show loading bar when map is loading -->
			{#if isLoading}
				<ProgressBar/>
			{/if}

			<!-- otherwise, show these elements when fully loaded -->
			{#if isLoaded}
				<!-- only show these elements when not being embedded -->
				{#if !isEmbedded}

					<ZoomWidget currentZoom = {currentZoom} on:zoomclicked={onZoom} />

					<!-- show layer switcher when available -->
					{#if showLayerSwitcher}
						<LayerSwitcher />
					{/if}

				{/if}
			{/if}

	 		<Watermark mapName = {mapConfig.mapTitle} embedType = {(isEmbedded) ? (uespEmbed) ? "uesp" : "normal" : "none"}/>

			<!-- Show debug tag in top right corner if app is in dev mode -->
			<!-- svelte-ignore missing-declaration -->
			{#if isDebug}
				<DebugBadge/>
			{/if}

		{/if}

	{/if}

	<!-- Preloader components -->
	{#if isLoading && loadingReason != ""}
		<LoadingBox reason={loadingReason+"..."}/>
	{:else if isError}
		<ErrorBox reason={errorReason}/>
	{/if}

	<!-- Show map selection menu on 404 -->
	{#if showMaps}
		<MapChooser/>
	{/if}

</markup>

<!-- App stylesheet -->
<style global src="./styles.css"></style>

<!-- Global key listener -->
<svelte:window on:keydown={onKeyPressed}/>