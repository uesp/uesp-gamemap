<!-- @component
### Description
 The UESP Gamemap is web app for displaying Elder Scrolls games' maps.
 It supports a variety of other map formats, and can be modified to support other games if desired.

 See @gamemap.js for actual map viewer implementation.

### Author(s)
- Dave Humphrey <dave@uesp.net> (21st Jan 2014)
- Thal-J <thal-j@uesp.net> (16th Aug 2022)-->

<!-- App -->
<script>

	/*================================================
						Initialisation
	================================================*/

	// import svelte core stuff
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	// import commons
	import './commons.js';

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
	import Search from './components/SearchPane.svelte';
	import WatermarkContainer from './components/WatermarkContainer.svelte';
	import IconButton from './components/IconButton.svelte';
	import LocationList from './components/LocationList.svelte';
	import IconBar from './components/IconBar.svelte';
	import Icon from './components/Icon.svelte';
	import Modal from './components/Modal.svelte';

	// import gamemap
	import Gamemap from "./map/gamemap.js";

	print("Initialising app...");

	// set up state variables
	let isLoading = true;
	let loadingReason = "";
	let isLoaded = false;
	let isError = false;
	let isFullscreen = false;
	let errorReason = "";
	let mapConfig = null;
	let gamemap = null;
	let canEdit = false;
	let currentZoom = getURLParams().has("zoom") ? getURLParams().get("zoom") : 0;
	$: currentWorld = null;
	let showUI = true;
	let showLayerSwitcher = false;
	let showLocationList = false;
	let locationListTab = 0;
	let showMaps = false;
	let showHelp = false;
	let showMapKey = false;
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
		let gameParam = (location.pathname.replace(/\\|\//g,'') != "") ? location.pathname.replace(/\\|\//g,'') : (location.search != null) ? getURLParams().get("game") : null;
		setLoading("Loading map");

		if (gameParam != null && gameParam.match(/^([a-z]+)/)) {
			print("Game parameter was: " + gameParam);

			// begin getting map config
			getJSON(DEFAULT_MAP_CONFIG_DIR, function(error, defaultMapConfig) {
				if (!error) {

					// set up default map config
					window.DEFAULT_MAP_CONFIG = defaultMapConfig;

					// example: /assets/maps/eso/config/eso-config.json
					let configURL = (MAP_ASSETS_DIR + gameParam + "/config/" + gameParam + "-" + MAP_CONFIG_FILENAME);
					setLoading("Loading config");
					print("Getting map config at " + configURL + "...");

					getJSON(configURL, function(error, object) {
						if (!error) {
							print("Imported map config successfully.");
							mapConfig = object;

							print("Merging with default map config...")
							let mergedMapConfig = mergeObjects(DEFAULT_MAP_CONFIG, mapConfig);
							mapConfig = mergedMapConfig;

							// set up map config assets
							mapConfig.assetsPath = mapConfig.assetsPath + mapConfig.database + "/";
							mapConfig.iconPath = mapConfig.assetsPath + "icons/";
							// note: sometimes tileURLs on the server are not consistent with the databaseName+"map" schema, so you can define an tileURLName in the map config to override this.
							mapConfig.tileURL = (mapConfig.tileURLName != null) ? mapConfig.baseTileURL + mapConfig.tileURLName + "/" : mapConfig.baseTileURL + mapConfig.database + "map/";

							print("Completed merged map config:")
							print(mapConfig);

							// load map
							loadGamemap(mapConfig);

						} else {
							error.toString().includes("JSON.parse") ? setError("Provided game doesn't exist. Please check the URL.") : setError("Could not load map: " + error);
						}});
				} else { setError("There was an error getting the default map config." + error);}})
		} else {
			// hide loading spinner and show map selector
			setLoading(false);
			showMaps = true;
		}
	});

	/*================================================
						General
	================================================*/

	// set loading reason function
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

	// set error function
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

	// handle keypresses
	function onKeyPressed(key) {

		// if "Insert" key pressed, hide UI
		if (key.keyCode == 45) {
			showUI = !showUI;
			print("UI " + ((showUI) ? "shown." : "hidden."));
		}

	}

	// handle toggling fullscreen
	function toggleFullscreen(event) {

		isFullscreen = document.fullscreenElement != null;

		if (event.type != "fullscreenchange") {
			if (isFullscreen) {
				document.exitFullscreen();
			} else {
				document.documentElement.requestFullscreen();
			}
			isFullscreen = document.fullscreenElement != null;
		} else if (event.type == "fullscreenchange") {
			isFullscreen = document.fullscreenElement != null;
		}
	}

	/*================================================
						  Gamemap
	================================================*/

	// init gamemap
	function loadGamemap(mapConfig) {

		// define callbacks
		let mapCallbacks = {
			onWorldsLoaded,
			onPermissionsLoaded,
			onWorldChanged,
			onZoom,
			onMapLoaded,
			setLoading,
		};

		window.gamemap = new Gamemap(null, mapConfig, mapCallbacks);
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
		setLoading(false); // hide loading spinner
	}

	function onWorldChanged(world) {
		setWindowTitle(world.displayName);
		currentWorld = world;
		isLoaded = true;
		showLayerSwitcher = (currentWorld.layers.length > 1 || currentWorld.hasGrid());
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

	function onPermissionsLoaded(enableEditing) {
		print("Editing permissions loaded, editing is: " + enableEditing);
		canEdit = enableEditing;
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
				{#if !gamemap.isEmbedded()}

					<ZoomWidget currentZoom = {currentZoom} on:zoomclicked={onZoom}/>
					<Search/>

					<!-- show layer switcher when available -->
					{#if showLayerSwitcher}
						<LayerSwitcher world={currentWorld}/>
					{/if}

					<IconBar>
						<slot:template slot="primary">
							{#if canEdit}<IconButton icon="edit" tooltip="Toggle edit pane" noMobile="true" checked="false" on:checked={() => (print("not implemented"))}/>{/if}
							<IconButton icon="more_vert" tooltip="More actions" menu='overflow-menu'>
								<!-- Menu Items -->
								<ul id='overflow-menu' class='dropdown-content'>
									<li class="waves-effect"><a class="modal-trigger" title="See help info" href="#help_modal" on:click={() => (showHelp = true)}><Icon name="help_outline"/>Help</a></li>
									<li class="waves-effect"><a href="https://en.uesp.net/wiki/UESPWiki_talk:Maps" title="Tell us your thoughts"><Icon name="messenger_outline"/>Feedback</a></li>
									<li class="waves-effect"><a class="modal-trigger" title="Show map key" href="#map_key_modal" on:click={() => (showMapKey = true)}><Icon name="list"/>Map Key</a></li>
									<!-- svelte-ignore a11y-click-events-have-key-events -->
									<li class="waves-effect"><a on:click={toggleFullscreen} id="fullscreen-toggle" title="Toggle fullscreen mode"><Icon name={(!isFullscreen) ? "fullscreen" : "fullscreen_exit"}/>{(!isFullscreen) ? "Fullscreen" : "Exit"}</a></li>
								</ul>
							</IconButton>
						</slot:template>

						<slot:template slot="secondary">

							{#if gamemap.hasMultipleWorlds()}
								<IconButton icon="explore" label={currentWorld.displayName} tooltip="Show location list" dropdown="true" checked={showLocationList} on:checked={(e) => (showLocationList = e.detail)}/>
								<IconButton icon="article" label="Goto Article" tooltip="Goto this map's article" on:click={() => {
									print("Getting article link...");
									let link = gamemap.getArticleLink();
									if (link != null && link != "") {
										window.open(link);
									}
								}}/>
							{/if}

							<!-- svelte-ignore missing-declaration -->
							<IconButton icon="link" label="Copy Link" tooltip="Copy link to this location" on:click={() => {
								print("Copying link to clipboard...");
								M.toast({html: 'Map link copied to clipboard!'});
								navigator.clipboard.writeText(window.location);
							}}/>

						</slot:template>
					</IconBar>

					{@const tabName = "group_tab"}
					{#if showLocationList}
						 <LocationList on:dismiss={() => (showLocationList = false)} currentTab={locationListTab} on:tabChange={(e) => (locationListTab = e.detail)}/>
					{/if}

				{/if}
			{/if}

			<!-- Watermark -->
			<WatermarkContainer>
				<Watermark mapName = {mapConfig.mapTitle} embedded = {gamemap.isEmbedded()}/>

				<!-- if grid on and has cell resources, show grid options -->
			</WatermarkContainer>

			<!-- Show debug tag in top right corner if app is in dev mode -->
			<!-- svelte-ignore missing-declaration -->
			{#if isDebug}
				<DebugBadge/>
			{/if}
		{/if}
	{/if}

	<!-- Preloading components -->
	{#if isLoading && loadingReason != ""}
		<LoadingBox reason={loadingReason+"..."}/>
	{:else if isError}
		<ErrorBox reason={errorReason}/>
	{/if}

	<!-- Help dialog -->
	{#if showHelp}
		<!-- svelte-ignore missing-declaration -->
		<Modal title="Help" id="help_modal" fixedFooter="true" on:dismiss={() => (showMapKey = false)}>
			{@const helpPromise = fetch(ASSETS_DIR+'help.md').then(response => response.text()).then((data) => { return data; })}
			{#await helpPromise}
				<p>Loading...</p>
			{:then helpText}
				{@html marked.parse(helpText)}
			{:catch error}
				<p style="color: red">{error.message}</p>
			{/await}
		</Modal>
	{/if}

	<!-- Map key dialog -->
	{#if showMapKey}
		<Modal title="Map Key" id="map_key_modal" fixedFooter="true" on:dismiss={() => (showMapKey = false)}>
			{@const iconIDs = Object.keys(mapConfig.icons)}
			{@const iconNames = Object.values(mapConfig.icons)}
			<div id="map_key_container">
				{#each iconNames as name, i}
					<div class="map_key_item left-align">
						<img title={name} alt={name} src={mapConfig.iconPath + iconIDs[i] + ".png"}/>
						<b class="left-align">{name}</b>
					</div>
				{/each}
			</div>
		</Modal>
	{/if}

	<!-- Map selection menu -->
	{#if showMaps}
		<MapChooser/>
	{/if}

</markup>

<!-- App stylesheet -->
<style global src="./styles.css"></style>

<!-- Global key listener -->
<svelte:window on:keydown={onKeyPressed} on:fullscreenchange={toggleFullscreen}/>