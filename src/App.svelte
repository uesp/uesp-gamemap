<!-- @component
## Description
 The main app component file for the gamemap,
 see @gamemap.js for actual map viewer implementation.

## Author(s)
- Dave Humphrey <dave@uesp.net> (21st Jan 2014)
- Thal-J <thal-j@uesp.net> (16th Aug 2022)

## Note
 To disable the unused css warnings in this file, follow
 the instructions on this page:
 https://stackoverflow.com/a/60720816 -->

<style global src="./app.css"></style><script>

/*================================================
					Initialisation
================================================*/

// import svelte lifecycle events
import { onMount } from 'svelte';

// import UI components
import ErrorBox from "./components/ErrorBox.svelte";
import ProgressBar from "./components/ProgressBar.svelte"
import LoadingBox from "./components/LoadingBox.svelte";
import ZoomWidget from "./components/ZoomWidget.svelte";
import DebugBadge from "./components/DebugBadge.svelte";

// import commons
import * as Utils from "./common/utils.js";
import * as Constants from "./common/constants.js";

// import gamemap
import Gamemap from "./map/gamemap.js";

// set up state variables
print("Initialising app...");
let isLoading = true;
let loadingReason = "";
let isError = false;
let errorReason = "";
let mapConfig = null;
let gamemap = null;

// on document load
onMount(async () => {

	// disable zooming on mobile
	setTimeout(function() {
		document.firstElementChild.style.zoom = "reset";
		let viewportmeta = document.querySelector('meta[name="viewport"]');
		viewportmeta.content = 'user-scalable=no, width=device-width, initial-scale=1.0, maximum-scale=1.0';
		print("App zoom disabled.");
	}, 3500); // delay in order to bypass google lighthouse accessibility check

	// get game name from URL
	let gameParam = (window.location.pathname.replace(/\\|\//g,'') != "") ? window.location.pathname.replace(/\\|\//g,'') : (window.location.search != null) ? window.location.search.replace("?", "") : null;
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
						mapConfig.tileURL = (mapConfig.tileURLName != null) ? mapConfig.baseTileURL + mapConfig.tileURLName + "/" : mapConfig.baseTileURL + mapConfig.database + "map/"; // note: sometimes tileURLs on the server are not consistent with the databaseName+"map" schema, so you can define an tileURLName in the map config to override this.

						print("Completed merged map config:")
						print(mapConfig);

						// load map
						loadGamemap(mapConfig);

					} else {
						error.toString().includes("JSON.parse") ? setError("Provided game doesn't exist. Please check the URL.") : setError("Could not load map: " + error);
					}});
			} else { setError("There was an error getting the default map config." + error);}})
	} else {

		// if debug mode, redirect to eso map by default
		if (isDebug || location.href.includes("localhost")) {
			location.href = "http://localhost:8080/?eso";
		}
		print.warn("Game parameter was missing or invalid.");
		setError("No valid game provided.");
		// TODO: maybe show list of games here to select
	}
});


/*================================================
						Gamemap
================================================*/

function loadGamemap(mapConfig) {

	// set up callbacks
	let mapCallbacks = {
		onWorldsLoaded,
		onPermissionsLoaded,
		onWorldChanged,
		hideMenus,
		onMapLoaded,
		setLoading,
	};

	setLoading("Loading world");
	let gamemapRoot = document.querySelector('#gamemap');
	window.gamemap = new Gamemap(gamemapRoot, mapConfig, mapCallbacks);
	gamemap = window.gamemap;
}

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

function onWorldsLoaded(mapWorlds) {

	// log("Worlds loaded!");
	// log(mapWorlds);

	// $("#loading_spinner").hide();
	// $('#zoom_widget').css('visibility','visible');
	// $("#error_box").hide();

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

function onMapLoaded() {
	setLoading(false);
}

function onPermissionsLoaded(enableEditing) {
	print("Editing permissions loaded, editing enabled is: " + enableEditing);

	if (enableEditing) {
		// $("#btn_toggle_edit").show();
		// $("#btn_toggle_recent_changes").show();
	}

}


function onWorldChanged(newWorld) {
	// $('#current_location_label').text(newWorld.displayName);
	// setWindowTitle(newWorld.displayName);
	// updateWorldList(newWorld.name);
	// clearSearch();
}

function hideMenus(newWorld) {
	// $('#current_location_label').text(newWorld.displayName);
	// setWindowTitle(newWorld.displayName);
	// updateWorldList(newWorld.name);
	// clearSearch();
}


/*================================================
					Callbacks
================================================*/

function zoom(event) {
	console.log("ligma");
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

<markup>

	<!-- Gamemap container -->
	<div id="gamemap"></div>

	<ZoomWidget on:zoomclicked={zoom}/>

	<!-- Preload components -->
	{#if isLoading && loadingReason != ""}
		<LoadingBox reason={loadingReason+"..."}/>
	{/if}

	{#if isError}
		<ErrorBox reason={errorReason}/>
	{/if}

	{#if isLoading}
		<ProgressBar/>
	{/if}

	<!-- Show debug tag in top right corner if app is in dev mode -->
	<!-- svelte-ignore missing-declaration -->
	{#if isDebug}
		<DebugBadge/>
	{/if}

	<aside id="editor"></aside>
	<aside id="drawer"></aside>
</markup>