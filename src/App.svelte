<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-missing-attribute -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- @component
### Description
 The UESP Gamemap is web app for displaying Elder Scrolls games' maps.
 It supports a variety of other map formats, and can be modified to support other games if desired.

 See @gamemap.js for actual map viewer implementation.

### Author(s)
- Dave Humphrey <dave@uesp.net> (21st Jan 2014)
- Thal-J <thal-j@uesp.net> (16th Aug 2022)-->

<script>

	/*================================================
						Initialisation
	================================================*/

	// import svelte core stuff
	import { onMount } from 'svelte';
	import { marked } from 'marked';

	// import commons
	import './common.js';

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
	import Infobar from './components/Infobar.svelte';
	import MapChooser from './components/MapChooser.svelte';
	import SearchPane from './components/SearchPane.svelte';
	import LayerOptionsContainer from './components/LayerOptionsContainer.svelte';
	import IconButton from './components/IconButton.svelte';
	import LocationList from './components/LocationList.svelte';
	import IconBar from './components/IconBar.svelte';
	import Icon from './components/Icon.svelte';
	import Dialog from './components/Dialog.svelte';
	import EditPane from './components/Editor.svelte';

	// import gamemap
	import Gamemap from "./map/gamemap.js";

	// initialise app
	print("Initialising app...");
	document.getElementById('app').addEventListener('DOMSubtreeModified', function () {
			// prevent scroll events in svelte components propagating to gamemap
			let svelteElements = document.querySelectorAll("[class*='svelte']");
			for (let i = 0; i < svelteElements.length; i++) {
				let element = svelteElements[i];
				L.DomEvent.disableScrollPropagation(element);
			}
	}, false);

	// state variables
	let isLoading = true;
	let loadingReason = "";
	let isLoaded = false;
	let isError = false;
	let isFullscreen = false;
	let errorReason = "";
	let mapConfig = null;
	let gamemap = null;
	let gamemapContainer = null;
	let canEdit = false;
	let editPane;
	let isEditing;
	let mapLock = null;
	let mapState;
	let showUI = true;
	let locationList;
	let locationListShown = false;
	let showMaps = false;
	let helpDialog;
	let mapKeyDialog;

	// on app start
	onMount(async() => {

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
		}, (location.toString().includes("dev") ? 10000 : 0)); // wait 10s on dev to bypass google lighthouse accessibility check

		// get game name from URL
		let gameParam = (location.pathname.replace(/\\|\//g,'') != "") ? location.pathname.replace(/\\|\//g,'') : (location.search != null) ? getURLParams().get("game") : null;
		setLoading("Loading map");

		if (gameParam != null && gameParam.toLowerCase().match(/^([a-z]+)/)) {
			print("Game parameter was: " + gameParam);

			// begin getting map config
			getJSON(DEFAULT_MAP_CONFIG_DIR).then(defaultMapConfig => {

				// set up default map config
				window.DEFAULT_MAP_CONFIG = defaultMapConfig;

				// example: /assets/maps/eso/config/eso-config.json
				let configURL = (MAP_ASSETS_DIR + gameParam.toLowerCase() + "/config/" + gameParam + "-" + MAP_CONFIG_FILENAME);
				setLoading("Loading config");
				print("Getting map config at " + configURL + "...");
				getJSON(configURL).then(object => {
					print("Imported map config successfully.");
					mapConfig = object;

					print("Merging with default map config...")
					let mergedMapConfig = mergeObjects(DEFAULT_MAP_CONFIG, mapConfig);
					mapConfig = mergedMapConfig;

					// set up map config assets
					mapConfig.assetsPath = mapConfig.assetsPath + mapConfig.database + "/";
					mapConfig.iconPath = mapConfig.assetsPath + "icons/";
					mapConfig.db = mapConfig.database;
					// sometimes tileURLs on the server are not consistent with the dbName+"map" schema, so you can define an tileURLName in the map config to override this
					mapConfig.tileURL = (mapConfig.tileURLName) ? mapConfig.baseTileURL + mapConfig.tileURLName + "/" : mapConfig.baseTileURL + mapConfig.database + "map/";

					// sort icon list to be alphabetical
					let icons = Object.entries(mapConfig.icons).map(( [k, v] ) => ({ [k]: v }));
					icons.sort((a, b) => Object.values(a)[0].localeCompare(Object.values(b)[0], 'en', {'sensitivity': 'base'}));
					mapConfig.icons = new Map(icons.map(obj => [Number(Object.keys(obj)[0]), Object.values(obj)[0]]));

					print("Completed merged map config:")
					print(mapConfig);
					window.MAPCONFIG = mapConfig; // make global

					// load map
					loadGamemap(mapConfig);

				}).catch(error => error.toString().includes("JSON.parse") ? setError("Provided game doesn't exist. Please check the URL.") : setError(`Could not load map: ${error}`));
			}).catch(error => setError(`There was an error getting the default map config: ${error}`));
		} else {
			// hide loading spinner and show map selector
			setLoading(false);
			showMaps = true;
		}
	});

	/*================================================
						  Gamemap
	================================================*/

	// init gamemap
	function loadGamemap(mapConfig) {

		// define callbacks
		let mapCallbacks = {
			onPermissionsLoaded: (enableEditing) => {
				print("Editing permissions: " + enableEditing);
				canEdit = enableEditing;
			},
			onMapLoaded: () => setLoading(false),
			onMapLockChanged: (lockType) => { mapLock = lockType },
			edit: (object) => { editPane.edit(object) },
			onMapStateChanged,
			setLoading,
		};

		// load up gamemap
		window.gamemap = new Gamemap(gamemapContainer, mapConfig, mapCallbacks);
		gamemap = window.gamemap;
	}

	function onMapStateChanged(newMapState) {
		mapState = newMapState;
		setWindowTitle(mapState.world.displayName);
		locationList?.dismiss();
		isLoaded = true;
	}

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
	window.onunhandledrejection = event => { setError(event.reason) };
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

	// rename browser tab function
	function setWindowTitle(worldName) {

		// get current map title
		document.title = mapConfig.mapTitle;

		// show current world in tab title if available
		if (gamemap.hasMultipleWorlds()) {
			document.title = worldName + " | " + document.title;
		}

		document.title = document.title + (" (UESP)");
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

</script>

<!-- Markup -->
<markup>

	<!-- Map selector -->
	{#if showMaps}
		<MapChooser/>
	{/if}

	<!-- Gamemap container -->
	<div id="gamemap" bind:this={gamemapContainer}>
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

						<ZoomWidget currentZoom = {mapState?.getZoom()} lock={mapLock}/>
						<SearchPane lock={mapLock}/>

						<!-- show layer switcher when available -->
						{#if mapState.world.hasLayerMenu()}
							<LayerSwitcher mapState={mapState} lock={mapLock}/>
						{/if}

						<IconBar>
							<slot:template slot="primary">
								{#if canEdit}
									<IconButton icon="edit" tooltip="Toggle map editor" noMobile="true" checked={isEditing} on:checked={(e) => {
										if (e.detail.checked && e.detail.shift) {
											editPane.edit(gamemap.getCurrentWorld());
										} else {
											editPane.show(e.detail.checked);
										}}} lock={mapLock}/>
								{/if}
								<IconButton icon="more_vert" tooltip="More actions" menu='overflow-menu' lock={mapLock}>
									<!-- Menu Items -->
									<ul id='overflow-menu' class='dropdown-content'>
										<li class="waves-effect"><a title="See help info" on:click={() => helpDialog.show()}><Icon name="help_outline"/>Help</a></li>
										<li class="waves-effect"><a href="https://en.uesp.net/wiki/UESPWiki_talk:Maps" title="Tell us your thoughts"><Icon name="messenger_outline"/>Feedback</a></li>
										<li class="waves-effect"><a title="Show map key" on:click={() => mapKeyDialog.show()}><Icon name="list"/>Map Key</a></li>
										<li class="waves-effect"><a on:click={toggleFullscreen} id="fullscreen-toggle" title="Toggle fullscreen mode"><Icon name={(!isFullscreen) ? "fullscreen" : "fullscreen_exit"}/>{(!isFullscreen) ? "Fullscreen" : "Exit"}</a></li>
									</ul>
								</IconButton>
							</slot:template>

							<slot:template slot="secondary">
								{#if gamemap.hasMultipleWorlds()}
									<IconButton icon="explore" label={mapState.world.displayName} tooltip="Show location list" dropdown="true"  lock={mapLock} checked={locationListShown} on:checked={() => locationList.toggle()}/>
									<IconButton icon="article" label="Goto Article" tooltip="Goto this map's article" lock={mapLock} on:click={() => {
										print("Getting article link...");
										let link = mapState.world.getWikiLink();
										if (link != null && link != "") window.open(link);
									}}/>
								{/if}

								<IconButton icon="link" label="Copy Link" lock={mapLock} tooltip="Copy link to current map view" on:click={() => {
									print("Copying link to clipboard...");
									M.toast({html: 'Map link copied to clipboard!'});
									navigator?.clipboard?.writeText(window.location);
								}}/>

							</slot:template>
						</IconBar>

						<LocationList bind:this={locationList} on:toggled={(e) => locationListShown = e.detail}/>

					{/if}
				{/if}

				<!-- Infobar / Layer options -->
				{#if !mapState?.isGridEnabled()}
					<LayerOptionsContainer>
						<Infobar mapName={mapConfig.mapTitle} embedded={gamemap.isEmbedded()} lock={mapLock}/>
					</LayerOptionsContainer>
				{/if}
			{/if}
		{/if}
	</div>

	<!-- Preloader components -->
	{#if !isLoaded && loadingReason != ""}
		<LoadingBox reason={loadingReason+"..."}/>
	{:else if isError}
		<ErrorBox reason={errorReason}/>
	{/if}

	<!-- Map editor panel -->
	{#if canEdit}
		<EditPane bind:this={editPane} bind:shown={isEditing}/>
	{/if}

	<!-- Help dialog -->
	<Dialog title="Help" bind:this={helpDialog} fixedFooter={true} cancel="close">
		{@const helpPromise = fetch(ASSETS_DIR+'help.md').then(response => response.text()).then((data) => { return data; })}
		{#await helpPromise}
			<p>Loading...</p>
		{:then helpText}
			{@html marked.parse(helpText)}
		{:catch error}
			<p style="color: red">{error.message}</p>
		{/await}
	</Dialog>

	<!-- Map key dialog -->
	{#if mapConfig}
		<Dialog title="Map Key" bind:this={mapKeyDialog} fixedFooter={true} cancel="close">
			<div id="map_key_container">
				{#each [...mapConfig.icons] as [id, name]}
					<div class="map_key_item left-align">
						<img title={name} alt={name} src={mapConfig.iconPath + id + ".png"}/>
						<b class="left-align">{name}</b>
					</div>
				{/each}
			</div>
		</Dialog>
	{/if}

	<!-- Show debug tag in top right corner if dev build -->
	{#if isDebug}
		 <DebugBadge/>
	{/if}

</markup>

<!-- Stylesheet -->
<style global src="./app.css"></style>

<!-- Global event listeners -->
<svelte:window on:keydown={onKeyPressed} on:fullscreenchange={toggleFullscreen}/>