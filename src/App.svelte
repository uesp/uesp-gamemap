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

<script>

	/*================================================
					   Initialisation
	================================================*/

	// import UI components
	import ErrorBox from "./components/ErrorBox.svelte";
	import Icon from "./components/Icon.svelte";
	import Divider from "./components/Divider.svelte";
	import ProgressBar from "./components/ProgressBar.svelte"
	import LoadingBox from "./components/LoadingBox.svelte";
	import ZoomWidget from "./components/ZoomWidget.svelte";
	import DebugBadge from "./components/DebugBadge.svelte";

	// import commons
	import * as Utils from "./common/utils.js";
	import * as Constants from "./common/constants.js";
	import Gamemap from "./map/gamemap.js";

	// set up state variables
	print("Initialising app...");
	let isLoading = true;
	let loadingReason = "";
	let isError = false;
	let errorReason = "";
	let mapConfig = null;
	let gamemap = null;
	$: isLoaded = !isError && !isLoading;

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

				// format: /assets/maps/{gameParam}/config/{gameParam}-config.json
				// example: /assets/maps/eso/config/eso-config.json
				let configURL = (Constants.MAP_ASSETS_DIR + gameParam + "/config/" + gameParam + "-" + Constants.MAP_CONFIG_FILENAME);
				setLoading("Loading config");
				print("Getting map config at " + configURL + "...");

				// check if provided map's map config exists before continuing
				if (Utils.doesFileExist(configURL)) {

					Utils.getJSON(configURL, function(error, object) {
						if (error !== null) {
							setError("Could not load map: " + error);
						} else {
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
						}
					})
				} else { setError("Provided game doesn't exist. Please check the URL.");}
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
		};

		setLoading("Loading world");
		let gamemapRoot = document.querySelector('#gamemap');
		print(gamemapRoot);
		window.gamemap = new Gamemap(gamemapRoot, mapConfig, mapCallbacks);
		gamemap = window.gamemap;
	}

	function setLoading(reason) {
		if (reason == false) {
			isLoading = reason;
		} else {
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
		isLoading = false;
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
	<!-- App container -->
	<main id="app">

		<ZoomWidget on:zoomclicked={zoom}/>

		<!-- Gamemap container -->
		<div id="gamemap"></div>

		<!-- Preload components -->
		{#if isLoading}
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
	</main>

	<aside id="editor"></aside>
	<aside id="drawer"></aside>
</markup>


<style global>
/* Import Material Design CSS */
@import url("https://fonts.googleapis.com/icon?family=Material+Icons");
@import url("https://cdn.jsdelivr.net/npm/@materializecss/materialize@1.2.1/dist/css/materialize.min.css");
@import url("https://unpkg.com/leaflet@1.9.3/dist/leaflet.css");

html, body, main {
	position: absolute;
	width: 100%;
	height: 100%;
	margin: 0 auto;
	color: white;
}

body {
	background-color: var(--surface_dark_variant_dark);
}

#gamemap {
	top: 0px;
	position: absolute;
	width: inherit;
	height: inherit;
}

/*================================================
					 General
================================================*/

/* prevent icons being selectable */
.material-icons {
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
}

/* hide these elements by default */
.onlymobile {
	display: none !important;
}
.hidedefault {
	visibility: hidden;
}
.banishdefault {
	display: none;
}

::placeholder {
	color: var(--text_low_emphasis);
}

.horizontal_divider {
	background: var(--divider);
	height: 1.8px;
	margin: 0 auto;
	margin-top: 2px;
	margin-bottom: 2px;
	width: 75%;
}

/*================================================
					Accessibility
================================================*/

/* disable animations for browsers requesting reduced motion */
@media (prefers-reduced-motion) {
	* {
		transition: none 0ms !important;
		animation: none !important;
	}
}

/*================================================
				   Mobile CSS
================================================*/

@media only screen and (max-device-width:900px) {

	#location_switcher_root {
		left: calc(50% - var(--appbar_dimen) + var(--padding_large)) !important;
		width: 75% !important;
	}

	#location_switcher_root:before {
		left: calc(100% - 2px) !important;
		top: 15px !important;
		transform: rotate(180deg) !important;
	}

	.search_root {
		width: 100% !important;
	}

	.search_container {
		width: calc(100% - 80px) !important;
  	}

	.layer_widget_root {
		max-width: calc(100% - 80px) !important;
	}

	/* hide these elements on mobile */
	[class*='nomobile'] {
		display: none !important;
	}

	/* show these elements only on mobile */
	[class*='onlymobile'] {
		display: inline-block !important;
	}

	div[class^="icon_bar"] {
		flex-direction: column !important;
		width: var(--appbar_dimen) !important;
	}

	.icon_bar_responsive {
		flex-direction: column !important;
	}

}

@media only screen and (min-width: 0) {
	html {
	  font-size: 14px;
	}
  }
  @media only screen and (min-width: 993px) {
	html {
	  font-size: 14.5px;
	}
  }
  @media only screen and (min-width: 1201px) {
	html {
	  font-size: 15px;
	}
  }

/*================================================
					Colours
================================================*/

:root {
	/* surface colours */
	--background: #000000;
	--background_dark: #1D1D1D;

	--surface: #FBF1DA;
	--surface_variant: #eee5cf;
	--surface_variant_dark: #F7E9CB;

	--surface_dark: #2E2E2E;
	--surface_dark_variant: #353535;
	--surface_dark_variant_dark: #252525;

	--primary: #f8f2e1;
	--primary_variant:#e5dfd0;
	--primary_variant_light: #faf4e6;
	--primary_variant_dark: #E6DDC5;

	--primary_dark: #3E3E3E;
	--primary_dark_variant: #373737;

	--highlight_dark:#6B5F50;
	--highlight_light: #FFE893;

	/* text colours */
	--text_loc_name: #33ff33;
	--text_link: rgba(138,90,68,1);
	--text_on_primary: black;
	--text_on_secondary: white;
	--text_low_emphasis: #474747;

	/* misc colours */
	--divider: rgba(164, 163, 163, 0.30);
	--shadow: rgba(0, 0, 0, 0.35);
	--secondary: #8a5a44;
	--secondary_variant: #A69480;
  	--selection: rgba(138, 90, 68, 0.152);
	--bubble_selection: rgba(84, 84, 84, 0.5);
	--error: #C2571B;
	--error_dark: #DD8A5B;
}

/*================================================
					Dimensions
================================================*/

:root {
	/* heights, widths, and volume */
	--appbar_dimen: 48px;
	--layer_widget_dimen: 64px;
	--search_pane_width: 420px;
	--zindex_floating: 900;
	--zindex_overlay: 9998;

	/* padding */
	--padding_minimum: 8px;
	--padding_small: 12px;
	--padding_medium: 16px;
	--padding_large: 32px;
}

/*================================================
					  Fonts
================================================*/

@font-face {
	font-family: 'wikiType';
	src: url('../assets/fonts/Goudy_Medieval_Alternate.ttf') format('embedded-opentype'), /* Internet Explorer */
		 url('../assets/fonts/Goudy_Medieval_Alternate.ttf') format('woff2'),             /* Super Modern Browsers */
		 url('../assets/fonts/Goudy_Medieval_Alternate.ttf') format('woff'),              /* Pretty Modern Browsers */
		 url('../assets/fonts/Goudy_Medieval_Alternate.ttf') format('truetype'),          /* Safari, Android, iOS */
		 url('../assets/fonts/Goudy_Medieval_Alternate.ttf') format('svg');               /* Legacy iOS */
}

body {
	line-height: 1.5;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
	font-weight: normal;
	color: rgba(0, 0, 0, 0.87);
}

.wikiTitle{
	font-family: 'wikiType', Arial, sans-serif;
}


/*================================================
					Gamemap
================================================*/

#gamemap {
	position: absolute;
	overflow: hidden;
	bottom: 0px;
	top: 0px;
	left: 0px;
	right: 0px;
	background-color: var(--background_dark);
}

#gamemap * {
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
}

.location-label {
	border-radius: var(--padding_large);
	position: absolute;
	white-space: nowrap;
	z-index: 20;
	color: var(--text_loc_name);
	font-weight: bolder;
	font-family: "Arial", sans-serif;
	font-size: 11px;
	text-shadow: 0px 0px 5px var(--background);
	background-color: var(--shadow);
	display: inline-block;
	border: none;
	box-shadow: 0px 0px 10px 6px var(--shadow);
	cursor: pointer;
	padding: 0px !important;
}

.leaflet-interactive {
	animation: fadein 0.3s;
}

.location-tooltip {
	z-index: 45;
	position: absolute;
	border: 2px solid #606030;
	background-color: rgba(0,0,0,0.85);
	padding: 3px;
	display: inline-block;
	color: #ffffff;
	font-size: 11px;
	font-weight: bold;
	font-family: sans-serif;
	white-space: nowrap;
	border-image: url(../assets/images/tooltip-border.png) 2 2 2 2 stretch;
}

.leaflet-tooltip::before {
	display: none;
}


.tooltip-desc {
	font-weight: normal;
	font-size: 0.9em;
}

.leaflet-marker-icon {
	-webkit-user-select: none !important;
	-moz-user-select: none !important;
	-ms-user-select: none !important;
	user-select: none !important;
}

.cellGrid {
	opacity: 0.45;
}

/*================================================
				 	 Pop-ups
================================================*/

.leaflet-popup-content-wrapper {
	display: block;
	background-color: var(--surface);
	border: none;
	z-index: 30;
	font-family: "Arial", sans-serif;
	font-size: 13px;
	padding: 4px;
	box-shadow: 0px 0px 2px 2px var(--shadow);
}

.leaflet-popup-content {
	margin: 13px var(--padding_minimum) 13px var(--padding_minimum);
}

.leaflet-popup-tip {
	box-shadow: 0px 0px 2px 2px var(--shadow);
	background-color: var(--surface);
}

.popupTitle a {
	font-weight: bolder;
	font-size: 14px;
	color: var(--text_low_emphasis);
}

.popupTitle a[href] {
	color: #0078A8;
}

.popupTitle a[href]:hover {
	text-decoration: underline !important;
}

.popupDesc, .popupDesc * {
	color: var(--text_on_primary);
	font-size: 10px;
	user-select: text !important;
}

.popupInfo, .popupInfo * {
	font-size: 9px;
	color: var(--text_low_emphasis);
	user-select: text !important;
}

hr {
	border: 0;
	border-top: 3px solid var(--divider);
}

.popupEditButton {
	margin-top: 10px;
	text-align: center;
	font-weight: normal;
	width: 100%;
	color: var(--text_link);
	cursor: pointer;
}

.popupEditButton:hover {
	background: var(--selection);
}

.popupEditButton:active {
	background: var(--bubble_selection);
}

/*================================================
				   	Infobar
================================================*/

.leaflet-control-attribution {
	position: fixed;
	background: var(--primary_dark_variant) !important;
	z-index: 1000;
	bottom: 0;
	right: 0;
	width: auto;
	padding: 3px;
	padding-left: 12px;
	padding-right: 12px;
	border-radius: 12px 0px 0px 0px;
	font-size: 12px;
	color: white;
	opacity: 0.45;
	transition: opacity ease-in-out 150ms;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;

}

.leaflet-control-attribution:hover {
	opacity: 1.0;
}

.leaflet-control-attribution a {
	text-decoration: none !important;
	color: white;
}

.leaflet-control-attribution a:hover {
	text-decoration: underline;
	border-bottom: solid white;
	border-width: medium;
}

</style>