<!-- svelte-ignore missing-declaration -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- @component
### Description
 Map editor component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (6th March, 2023) -->

<script>
    // import core svelte stuff
    import { fade, fly } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';
    import { onMount } from 'svelte';
    import VirtualList from 'svelte-tiny-virtual-list';

    // import data classes
    import World from "../map/world";
    import Location from "../map/location";

    // import ui components
    import AppBar from './AppBar.svelte';
    import LoadingSpinner from './LoadingSpinner.svelte';
    import ListItem from './ListItem.svelte';
    import Icon from './Icon.svelte';
    import Button from "./Button.svelte";
    import Textbox from "./Textbox.svelte";
    import FormGroup from "./FormGroup.svelte";
    import InfoTextPair from "./InfoTextPair.svelte";
    import DropdownMenu from "./DropdownMenu.svelte";
    import Switch from "./Switch.svelte";
    import ColourPicker from "./ColourPicker.svelte";
    import AvatarComponent from "./AvatarComponent.svelte";
    import ColourPreview from "./ColourPreview.svelte";
    import SuggestionBar from './SuggestionBar.svelte';
    import Dialog from './Dialog.svelte';

    // constants
    let PANEL_WIDTH = getPrefs("editpanelwidth", 480);
    const ANIMATION_DURATION = 350;
    const RESIZE_OBSERVER = new ResizeObserver(() => { window.dispatchEvent(new Event('resize'));});
    const MIN_PANEL_WIDTH = 350;
    const MAX_PANEL_WIDTH = 700;

    // state vars
    export let shown = false; // whether the editor panel is visible

    let editPanel;
    let editPanelContent;
    let editor;
    let editorWindow;
    let overlay = null;
    let saveButton;
    let refreshTitleBar;
    let innerHeight;
    let discardDialog;
    let deleteDialog;

    let recentChanges = [];
    let editHistory = [];
    let currentZoom = gamemap.getCurrentZoom()?.toFixed(3);

    let liveEdit = false;
    let directEdit = null;
    let unsavedChanges = false;
    let hasBeenModified = false;
    let editObject = null;
    let modEditObject = null;
    $: isLocation = editObject instanceof Location;
    $: isWorld = editObject instanceof World;
    $: objectType = isWorld ? "world" : "location";
    $: isEditing = editObject && isLocation || isWorld;
    $: name = (isWorld ? modEditObject?.displayName : modEditObject?.name);
    $: linkWikiPage = modEditObject?.wikiPage == name || (modEditObject?.wikiPage == null || modEditObject?.wikiPage == "");

    $: { // prevent leaving the page on unsaved changes
        if (unsavedChanges || editObject?.unsavedLocation) {
            window.onbeforeunload = function() { return "" };
        } else {
            window.onbeforeunload = null;
        }
    }

    /*================================================
                        Editor Panel
    ================================================*/

    // public functions to show/hide the panel, or edit an object
    export function edit(object) { show(object); overlay = null; }
    export function dismiss() { show(false); window.onbeforeunload = null; }
    export function show(data) {

        // set edit data
        data = (data == null) ? true : data;
        if (data) {

            // determine whether we are directly editing an object, or editing from recent changes
            if (directEdit == null) {
                if (!shown && data) {
                    if (data == true) {
                        directEdit = false;
                    } else if (data != true) {
                        directEdit = true;
                    }
                }
                print("direct edit is: "+directEdit);
            }

            shown = true;
            setTimeout(function() { RESIZE_OBSERVER.observe(editPanel); if (recentChanges.length == 0) { getRecentChanges() } }, 1);

            // check if current edit object is null
            if (data != true && editObject == null) {
                initEditor(data);
            }

        } else {
            shown = false;
            editObject = null;
            directEdit = null;
        }

    }

    function addNewLocation(locType) {
        overlay = locType;
        gamemap.addLocation(locType);
    }

    function back(force) {
        force = (force != null) ? force : false;
        if (isEditing) {

            if (unsavedChanges && !force) {
                discardDialog.showWithCallback((result) => {
                    print(result);
                    if (result == "confirm") {
                        back(true);
                    }
                })
            }
            if (force || !unsavedChanges) {
                cancel();
            }
        } else {
            dismiss();
        }
    }

    /*================================================
					  Editor Window
    ================================================*/

    // initalise editor
    function initEditor(data) {

        // begin editing provided data
        unsavedChanges = false;
        editObject = Object.assign(Object.create(Object.getPrototypeOf(data)), data);
        modEditObject = Object.assign(Object.create(Object.getPrototypeOf(data)), data);
        isLocation = editObject instanceof Location;
        isWorld = editObject instanceof World;
        setTimeout(() => {liveEdit = true}, 1);
        if (!editObject?.unsavedLocation) { getEditHistory(editObject) }

        // do state changes to map
        if (isWorld && editObject.id == gamemap.getCurrentWorld().id) {
            gamemap.reset(true, 30); // zoom out world map
            gamemap.setMapLock(MAPLOCK.FULL); // lock the world map
            gamemap.mapRoot.classList.add("editing"); // add editing effect
        } else if (isLocation) {
            print("being called to edit location")
            gamemap.setMapLock(modEditObject.isPolygon() ? MAPLOCK.PARTIAL_POLYGON : MAPLOCK.PARTIAL_MARKER);
            editObject.setEditing(true);
            modEditObject.setEditing(true);
            gamemap.updateLocation(modEditObject);
        }

    }

    function doDelete(force) {
        force = (force != null) ? force : false;
        if (force) {
            // visually delete location from the map
            print("deleting object...");
            gamemap.deleteLocation(modEditObject);
            let query = queryify(objectify(modEditObject.getDeleteQuery()));
            // do async api request to actually delete the location
            getJSON(GAME_DATA_SCRIPT + query).then(() => getRecentChanges());
            cancel();
        } else {
            deleteDialog.show();
        }

    }

    function doSave() {

        print("saving object...");
        print(editObject)
        print(modEditObject)

        let queryParams = objectify(modEditObject.getSaveQuery());
        let query = (GAME_DATA_SCRIPT + queryify(queryParams)).replace(/=\s*$/, "");
        saveButton.$set({ text: "Saving...", icon: "loading" });

        print(query);
        getJSON(query).then(data => {
            if (!data?.isError) {
                // modify location with new attributes if available
                if (modEditObject?.unsavedLocation) {
                    modify("unsavedLocation", false);
                    modify("id", data.newLocId);
                }
                modify("revisionID", data?.newRevisionId);
                if (isLocation) { gamemap.updateLocation(modEditObject) }

                // overwrite existing object with deep clone of modified one
                editObject = Object.assign(Object.create(Object.getPrototypeOf(modEditObject)), modEditObject);

                // update edit history lists
                getEditHistory(editObject);
                getRecentChanges()

                // reset save button
                unsavedChanges = false;
                saveButton.$set({ text: "Save", icon: "save" });
            } else {
                print(data.errorMsg);
                saveButton.$set({ text: data.errorMsg.includes("permissions") ? "Insufficient permissions!" : data.errorMsg, icon: "warning" });
            }
        }).catch(() => saveButton.$set({ text: `Error saving ${objectType}!`, icon: "warning" }));
    }

    // cancel editing
    function cancel() {

        // clean up
        if (isWorld) {
            gamemap.reset(true);
        } else if (isLocation) { // if it was an unadded location, delete it
            editObject.setEditing(false);
            if (editObject?.unsavedLocation) {
                gamemap.deleteLocation(editObject)
            } else { // else revert to how it was, if it still exists
                if (gamemap.getCurrentWorld().locations.get(editObject.id)) {
                    gamemap.updateLocation(editObject);
                }
            }
        }

        // turn off editing
        editHistory = [];
        overlay = null;
        editObject = null;
        modEditObject = null;
        liveEdit = false;
        hasBeenModified = false;
        unsavedChanges = false;
        gamemap.setMapLock(MAPLOCK.NONE);
        gamemap.getMapObject().pm.disableDraw();
        gamemap.getMapObject().pm.disableGlobalEditMode();
        Array.from(document.querySelectorAll("[class*='editing']")).forEach(element => { element.classList.remove("editing"); });
        window.onbeforeunload = null;

        // weird hack to stop recent changes getting shrunk
        if (!directEdit) {
            let hacky = setInterval(() => {
                let rcList = document.getElementsByClassName("virtual-list-wrapper")?.[0];
                if (rcList?.clientHeight >= 1000 && rcList.children[0].childElementCount <= 4){
                    let oldRecentChanges = recentChanges;
                    recentChanges = [];
                    recentChanges = oldRecentChanges;
                } else {
                    clearInterval(hacky);
                }
            }, 1);
        } else if (directEdit) {
            dismiss();
        }

    }

    // received updated marker coords from gamemap (via drag and dropping)
    window.updateMarkerCoords = function updateMarkerCoords(coords) {
        print(coords)
        modify("coords", coords);
    }

    let timer;
    const DEBOUNCE_AMOUNT = 75;
    function modify(property, value) {
        if (liveEdit) {
            // update svelte reactivity
            modEditObject[property] = value;
            modEditObject = modEditObject;
            editObject = editObject;

            print(`editing ${property} with value ${value}`)

            print("before edit");
            print(editObject);
            print("after edit");
            print(modEditObject);

            // are there any unsaved changes
            unsavedChanges = !(JSON.stringify(modEditObject) === JSON.stringify(editObject));
            hasBeenModified = (unsavedChanges) ? true : hasBeenModified;

            if (isLocation) {

                gamemap.setMapLock(modEditObject.isPolygon() ? MAPLOCK.PARTIAL_POLYGON : MAPLOCK.PARTIAL_MARKER);

                if (hasBeenModified) {
                    // editing debouncing
                    if (timer != null){
                        clearTimeout(timer);
                    }
                    timer = setTimeout(() => {
                        // redraw location with new changes
                        gamemap.updateLocation(modEditObject);
                    }, DEBOUNCE_AMOUNT)
                }

            }
        }
    }

    function fillFromTemplate(template) {
        print("printing template");
        print(template);

        // fill in data from template
        for (let [key, value] of Object.entries(template)) {
            if (!key?.startsWith("$")) {
                if (isNaN(value) && value.startsWith("$")) { // if value starts with $, consider it javascript code and execute it
                    modify(key, eval(value.substring(1)));
                } else {
                    modify(key, value);
                }
            }
        }
        // mark suggestion as accepted
        modify("acceptedSuggestion", true);
    }

    // handle resizing the editor panel
    function onResizerDown() { document.addEventListener('mousemove', onResizerDrag);}
    function onResizerUp() { document.removeEventListener('mousemove', onResizerDrag); }
    function onResizerDrag(event) {
        let width = (window.innerWidth - event.pageX);
        width = (width < MIN_PANEL_WIDTH) ? MIN_PANEL_WIDTH : width;

        if (width < MAX_PANEL_WIDTH) {
            editPanel.style.width = `${width}px`;
            editPanel.style.maxWidth = `${width}px`;
            setPrefs("editpanelwidth", width); // save user's edit panel width preference
            PANEL_WIDTH = getPrefs("editpanelwidth", 480);
        }
    }

    // slide in/out animation
    function slide() {
        gamemap.getMapObject().invalidateSize();
        return {
            duration: ANIMATION_DURATION,
            easing: cubicInOut,
            css: (t) => {
                if (t == 1) { editPanel.style.width = `${PANEL_WIDTH}px`;}
                return `width: ${PANEL_WIDTH * t}px; opacity: ${t};)`;
            }
        }
    }

    // get recent changes function
    function getRecentChanges() {

        print("getting recent changes...")
        recentChanges = [];
        let queryParams = {};
        queryParams.action = "get_fullrc";
        queryParams.db = MAPCONFIG.database;

        getJSON(GAME_DATA_SCRIPT + queryify(queryParams)).then(data => {
            print("parsing data...");
            let tempList = [];
            print(data);
            for (let i = 0; i < data.recentChanges.length; i++) {
                tempList.push(getRCItem(data.recentChanges[i]));
            }
            recentChanges = tempList;

            print("got recent changes: ");
            print(recentChanges);
        });
    }

    // get edit history for the current object
    function getEditHistory(object) {
        editHistory = [];
        let type = (isWorld) ? "world" : "loc";
        getJSON(GAME_DATA_SCRIPT + `?db=${MAPCONFIG.database}&action=get_${type}rev&${type}id=${object.id}`).then(data => {
            editHistory = data.revisions ? Object.values(data.revisions) : [];
        });
    }

    // make RC object function
    function getRCItem(data) {
        let isWorld = data.displayName != null || data.cellSize != null;
        let destinationID = isWorld ? data.worldId : -data.locationId;

        return {
            icon: (data.iconType != 0 && data.iconType) ? MAPCONFIG.iconPath + data.iconType + ".png" : (isWorld) ? "public" : "location_on",
            editID: data.id,
            user: data.editUserText,
            timestamp: data.editTimestamp,
            destinationID: destinationID,
            name: (isWorld) ? data.worldDisplayName ?? ((data.displayName) ? data.displayName : gamemap.getWorldDisplayNameFromID(data.worldId)) : data.locationName ?? data.name,
            comment: data.editComment,
            action: data.editAction,
            worldID: data.worldId,
            isWorld: isWorld,
            subtitle: isWorld ? null : data.worldDisplayName ?? gamemap.getWorldDisplayNameFromID(data.worldId),
        }
    }

    // on editor load
	onMount(() => { window.onpopstate = () => currentZoom = gamemap.getCurrentZoom().toFixed(3);});
    function fixEditor() {editor.style.height = `${editor?.parentElement?.clientHeight}px`; editorWindow.scrollTop = 0;}
</script>

<markup>
    {#if shown}
         <aside id="edit-panel" bind:this={editPanel} in:slide|global out:slide|global>
             {#if overlay} <!-- editing overlay (for adding paths, areas etc) -->
                {@const locType = Object.keys(LOCTYPES).find(key => LOCTYPES[key] === overlay)}
                 <div id="edit-overlay" in:fade={{ duration: 100 }}>
                    <b class="subheading">Adding {locType.toSentenceCase()}</b>
                    <p style="color: white; text-align: center; margin: 12px;">Begin adding the new {locType.toLowerCase()} to the map.</p>
                    <div id="arrow_container">
                        <div class="arrow"><span></span><span></span><span></span></div>
                    </div>
                    <div style="display: flex; gap: var(--padding_medium); padding-top: 6px;">
                        <Button text="Cancel" icon="close" flat="light" on:click={cancel}></Button>
                    </div>
                 </div>
             {/if}

             <!-- resize handle for resizing window -->
             <div id="window-resizer" on:mousedown={onResizerDown}/>

             <!-- edit panel appbar -->
             <AppBar title={!isEditing ? "Map Editor" : ((modEditObject.id > 0) ? "Editing" : "Adding") + " " + objectType.toSentenceCase()}
                subtitle={isEditing ? (isWorld) ? modEditObject.displayName + " ("+modEditObject.name+")" : modEditObject.name : null} unsavedChanges={unsavedChanges}
                icon={isEditing && !directEdit ? "arrow_back" : "close"} on:back={() => back()} tooltip={unsavedChanges ? "You have unsaved changes" : null} buttonTooltip={isEditing && !directEdit ? "Go back" : "Close"}
             />

             <!-- edit panel content -->
             <div id="edit-panel-content" style="max-width: inherit; width: inherit;" bind:this={editPanelContent} class:isEditing={isEditing}>
                {#if !isEditing}
                    <b>Actions</b><br/>
                    <div id="actions-container">
                        <Button text="Add Marker" icon="add_location_alt" on:click={() => addNewLocation(LOCTYPES.MARKER)}></Button>
                        <Button text="Add Area" icon="local_hospital" on:click={() => addNewLocation(LOCTYPES.AREA)}></Button>
                        <Button text="Add Path" icon="timeline" on:click={() => addNewLocation(LOCTYPES.PATH)}></Button>
                        <Button text="Edit World" icon="public" on:click={() => (edit(gamemap.getCurrentWorld()))}></Button>
                    </div>
                    <div id="recent-changes-titlebar" bind:this={refreshTitleBar}>
                        <b>Recent Changes</b>
                        <div id="refresh-button" title="Refresh the Recent Changes list" class="waves-effect" on:click={getRecentChanges}><Icon name="refresh" size=20 /></div>
                    </div>
                    <div id="recent-changes-container">
                        {#key recentChanges}
                            {#if recentChanges.length > 0}
                                <VirtualList
                                    width="100%"
                                    height={innerHeight - (refreshTitleBar?.getBoundingClientRect()?.bottom + 10)}
                                    itemCount={recentChanges.length}
                                    scrollToIndex={1}
                                    itemSize={60}>
                                    <div slot="item" let:index let:style {style}>
                                        {@const data = recentChanges[index]}
                                        <ListItem {...data} title={data.name} bold={data.isWorld} compact={true} on:shiftClick={() => gamemap.edit(data.destinationID)} on:click={() => gamemap.goto(data.destinationID)} />
                                    </div>
                                </VirtualList>
                            {:else}
                                <LoadingSpinner/>
                            {/if}
                        {/key}
                     </div>
                {:else}
                    <div id="editor" in:fixEditor out:cancel bind:this={editor} style="max-width: inherit; width: inherit;">
                        <div class="editor_window" bind:this={editorWindow} style="max-width: inherit; width: inherit;">

                            <!-- show edit suggestions if available -->
                            {#if MAPCONFIG?.editTemplates[objectType]?.[name.toLowerCase()] && unsavedChanges && !modEditObject?.acceptedSuggestion}
                                {@const template = MAPCONFIG.editTemplates[objectType][name.toLowerCase()]}
                                <SuggestionBar suggestion={name.toTitleCase()} on:confirm={() => fillFromTemplate(template)}/>
                            {/if}

                            <div id="editor_pane" style="max-width: inherit; width: inherit;">
                                <FormGroup title="General" icon="description">
                                    <header class="header">
                                        <AvatarComponent icon={modEditObject.icon} locType={modEditObject.locType} isWorld={isWorld} on:change={(e) => modify("icon", e.detail)}>
                                            <!-- Name -->
                                            <Textbox
                                                text={isWorld ? modEditObject.displayName : modEditObject.name }
                                                hint={(isWorld ? "Display " : "") + "Name"}
                                                tooltip="{objectType.toSentenceCase()} name"
                                                on:change={(e) => {
                                                    if (linkWikiPage) {
                                                        modify("wikiPage", e.detail)
                                                    }
                                                    modify(isWorld ? "displayName" : "name", e.detail)
                                                }}>
                                            </Textbox>


                                            <!-- Parent ID (for World) -->
                                            {#if isWorld}
                                                <Textbox
                                                    hint="Parent ID"
                                                    text={modEditObject.parentID}
                                                    tooltip="Parent world ID"
                                                    type="number"
                                                    subtext={gamemap.isWorldValid(modEditObject.parentID) ? gamemap.getWorldDisplayNameFromID(modEditObject.parentID) : modEditObject.parentID != null && modEditObject.parentID != "" ? "Invalid World ID!" : null}
                                                    on:change={(e) => modify("parentID", e.detail)}>
                                                </Textbox>
                                            <!-- Destination ID (for Locations) -->
                                            {:else if isLocation}
                                                {#if modEditObject.locType != LOCTYPES.PATH}
                                                    <Textbox
                                                        hint="Destination ID"
                                                        text={modEditObject.destinationID}
                                                        subtext="+ for world, - for location"
                                                        tooltip="Location/world destination ID"
                                                        type="number"
                                                        on:change={(e) => modify("destinationID", e.detail)}>
                                                    </Textbox>
                                                {/if}
                                            {/if}
                                        </AvatarComponent>

                                    </header>

                                    <!-- Wiki Page -->
                                    <Switch
                                        enabled={linkWikiPage}
                                        label={"Use " + (isWorld ? "Display Name" : "Name") + " as Wiki Page"}
                                        tooltip={`Use this ${objectType}'s ${(isWorld ? "display name" : "name")} as its wiki page`}
                                        on:change={(e) => {
                                                if (e.detail) {
                                                    modify("wikiPage", name);
                                                } else {
                                                    modify("wikiPage", null);
                                                }
                                        }}>
                                        <Textbox label="Wiki Page"
                                            text={modEditObject.wikiPage}
                                            placeholder="Enter wiki page..."
                                            tooltip="Wiki page name"
                                            on:change={(e) => modify("wikiPage", e.detail)}>
                                        </Textbox>
                                    </Switch>

                                    <!-- Label Direction (for non-line Locations) -->
                                    {#if modEditObject.locType != LOCTYPES.PATH && isLocation}
                                        {@const posIDs = Object.keys(LABEL_POSITIONS)}
                                        {@const posNames = Object.values(LABEL_POSITIONS)}
                                        <DropdownMenu label="Label Direction" hint="Select label direction..." align="right" selected={modEditObject.labelPos} on:change={(e) => {modify("labelPos", Number(e.detail))}} >
                                            {#each posNames as posName, i}
                                                <option value={posIDs[i]} selected={modEditObject.labelPos == posIDs[i]}>{posName.toSentenceCase()}</option>
                                            {/each}
                                        </DropdownMenu>
                                    {/if}

                                    <!-- Description -->
                                    <Textbox label="Description"
                                            text={modEditObject.description}
                                            placeholder="Enter description..."
                                            tooltip="Description of this {objectType}"
                                            textArea="true"
                                            on:change={(e) => modify("description", e.detail)}>
                                    </Textbox>

                                </FormGroup>

                                <!-- Zoom Levels (for World) -->
                                {#if isWorld}
                                    <FormGroup title="Zoom" icon="zoom_in">
                                        <div class="row">
                                            <Textbox text={modEditObject.minZoomLevel} type="number" hint="Min Zoom" tooltip="Minimum zoom level for this world" on:change={(e) => modify("minZoomLevel", e.detail)} min=0/>
                                            <Textbox text={modEditObject.maxZoomLevel} type="number" hint="Max Zoom" tooltip="Maximum zoom level for this world" on:change={(e) => modify("maxZoomLevel", e.detail)} min=0/>
                                        </div>
                                    </FormGroup>
                                {/if}

                                <!-- World Bounds (for World) -->
                                {#if isWorld}
                                    <FormGroup title="Bounds" icon="crop_free">
                                        <div class="row">
                                            <Textbox text={modEditObject.minX} hint="Minimum X" type="number" hideSpinner={true} on:change={(e) => modify("minX", e.detail)} tooltip="Minimum X bounds for this world"/>
                                            <Textbox text={modEditObject.maxX} hint="Maximum X" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)} tooltip="Maximum X bounds for this world"/>
                                        </div>
                                        <div class="row">
                                            <Textbox text={modEditObject.minY} hint="Minimum Y" type="number" hideSpinner={true} on:change={(e) => modify("minY", e.detail)} tooltip="Minimum Y bounds for this world"/>
                                            <Textbox text={modEditObject.maxY} hint="Maximum Y" type="number" hideSpinner={true} on:change={(e) => modify("maxY", e.detail)} tooltip="Maximum Y bounds for this world"/>
                                        </div>
                                    </FormGroup>
                                {/if}

                                <!-- Display Data (for Locations) -->
                                {#if isLocation}
                                    <FormGroup title="Display" icon="light_mode">

                                        {#if modEditObject.isPolygon()}

                                            <ColourPreview data={modEditObject}/>

                                            <!-- only show fill colour for areas -->
                                            {#if modEditObject.locType == LOCTYPES.AREA}

                                                <ColourPicker
                                                    label="Fill Colour"
                                                    colour = {modEditObject.fillColour}
                                                    placeholder="Enter fill colour..."
                                                    tooltip="Default fill colour for this location"
                                                    on:change={(e) => modify("fillColour", e.detail)}>
                                                </ColourPicker>

                                                <ColourPicker
                                                    label="Fill Colour (Hover)"
                                                    colour = {modEditObject.fillColourHover}
                                                    placeholder="Enter hovered fill colour..."
                                                    tooltip="Hovered fill colour for this location"
                                                    on:change={(e) => modify("fillColourHover", e.detail)}>
                                                </ColourPicker>
                                            {/if}

                                            <ColourPicker
                                                label="Stroke Colour"
                                                colour = {modEditObject.strokeColour}
                                                placeholder="Enter stroke colour..."
                                                tooltip="Default stroke colour for this location"
                                                on:change={(e) => modify("strokeColour", e.detail)}>
                                            </ColourPicker>

                                            <ColourPicker
                                                label="Stroke Colour (Hover)"
                                                colour = {modEditObject.strokeColourHover}
                                                placeholder="Enter hovered stroke colour..."
                                                tooltip="Hovered stroke colour for this location"
                                                on:change={(e) => modify("strokeColourHover", e.detail)}>
                                            </ColourPicker>

                                            <div class="row">
                                                <Textbox text={modEditObject.strokeWidth} label="Stroke Width" hint="" column={true} type="number" on:change={(e) => modify("strokeWidth", e.detail)} tooltip="Default stroke width for this location"/>
                                                <Textbox text={modEditObject.strokeWidthHover} label="Stroke Width (Hover)" hint="" column={true} type="number" on:change={(e) => modify("strokeWidthHover", e.detail)} tooltip="Hovered stroke width for this location"/>
                                            </div>
                                        {/if}

                                        <Textbox label="Display Level"
                                            text={modEditObject.displayLevel}
                                            placeholder="Enter display level..."
                                            tooltip="Zoom level at which this location will appear"
                                            type="number"
                                            subtext={"Current zoom is "+currentZoom}
                                            min={gamemap.getCurrentWorld().minZoomLevel}
                                            max={gamemap.getCurrentWorld().maxZoomLevel}
                                            on:change={(e) => modify("displayLevel", e.detail)}>
                                        </Textbox>

                                    </FormGroup>
                                {/if}

                                <!-- General info -->
                                {#if modEditObject.id > 0}
                                    <!-- Recent edits for this object -->
                                    {#if editObject.id > 0 && editObject.revisionID > 0}
                                        <FormGroup title="Recent Edits" icon="history" tooltip="Shows the up to 5 of the most recent edits">
                                            {@const type = isWorld ? "world" : "loc"}
                                            {#if editHistory.length > 0}
                                                {#each editHistory as rev}
                                                    {@const entry = getRCItem(rev)}
                                                    <ListItem {...entry} title={entry.name} bold={entry.isWorld} compact={true}/>
                                                {/each}
                                            {:else}
                                                <LoadingSpinner/>
                                            {/if}
                                        </FormGroup>
                                    {/if}

                                    <FormGroup title="Info" icon="info">
                                        <InfoTextPair name="{objectType.toSentenceCase()} ID" value={modEditObject.id} tooltip="This {objectType}'s ID"/>
                                        {#if isWorld}
                                            <InfoTextPair name="World Name" value={modEditObject.name} tooltip="This world's internal name"/>
                                            <InfoTextPair name="Tiles" value={modEditObject.dbNumTilesX + " x " + modEditObject.dbNumTilesY} tooltip="Number of tiles at full zoom"/>
                                        {/if}
                                        {#if isLocation}
                                            <InfoTextPair name="Location Type" value={Object.keys(LOCTYPES).find(key => LOCTYPES[key] === modEditObject.locType).toLowerCase()} tooltip="The type of location this is"/>
                                            <InfoTextPair name="In World" value={gamemap.getWorldNameFromID(modEditObject.worldID)} tooltip="The world this location is in"/>
                                            <InfoTextPair name="Position" value={"X: "+modEditObject.getCentre().x + ", Y: " +modEditObject.getCentre().y} tooltip="This location's coordinates"/>
                                        {/if}
                                        <InfoTextPair name="Coord Type" value={Object.keys(COORD_TYPES).find(i=>COORD_TYPES[i] === MAPCONFIG.coordType).toLowerCase()} tooltip="Coordinate system that this {objectType} is using"/>
                                        <InfoTextPair name="Revision ID" value={modEditObject.revisionID} tooltip="Current revision ID"/>
                                    </FormGroup>


                                {/if}
                            </div>
                        </div>

                        <footer id="footer" in:fly={{ y: 10, duration: 250 }}>
                            <div class="footer-buttons">
                                <Button text="Save" icon="save" type="save" bold="true" bind:this={saveButton} on:click={() => doSave((isWorld) ? "world" : "location")}/>
                            </div>
                            <div class="footer-buttons">
                                <!-- todo: make the done button close edit panel entirely if summoned from gamemap -->
                                <Button text={!unsavedChanges && !modEditObject?.unsavedLocation ? "Close" : "Cancel"} icon="close" on:click={() => back()}/>
                                {#if isLocation && !modEditObject.unsavedLocation}
                                    <Button text="Delete" icon="delete" type="delete" on:click={() => doDelete()} on:shiftClick={() => doDelete(true)}/>
                                {/if}
                            </div>
                        </footer>
                    </div>
                {/if}
             </div>
         </aside>
    {/if}

    <Dialog title="Discard changes?" bind:this={discardDialog} dismissible={false} confirm={true}>
        Are you sure you want to discard your unsaved changes? This can't be undone.
    </Dialog>

    <Dialog title="Delete {objectType}?" bind:this={deleteDialog} dismissible={false} confirm={true} on:confirm={() => doDelete(true)}>
        Are you sure you want to delete this {objectType}? This can't be undone.
        <br>
        <small style="color: var(--text_low_emphasis);"><b style="font-size: 0.8rem;">Tip:</b> Hold <code>Shift</code> while deleting to skip this message.</small>
    </Dialog>
</markup>

<style>
    #edit-panel {
        background-color: var(--surface);
        height: 100%;
        z-index: 100;
        position: relative;
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        display: flex;
        flex-direction: column;
        width: 0px;
    }

    #edit-overlay {
        background-color: rgba(0, 0, 0, 0.70);
        width: 100%;
        height: 100%;
        position: absolute;
        pointer-events: all;
        z-index: 999999999999; /* i know, this is stupid */
        display: flex;
        justify-content: center;
        align-content: center;
        align-items: center;
        text-shadow: 0px 0px 5px var(--background) !important;
        flex-direction: column;
    }

    .subheading {
        color: var(--highlight_light);
        font-size: x-large;
        font-weight: bold;
    }

    #edit-panel-content {
        padding: var(--padding_minimum);
        height: 100%;
    }

    #edit-panel-content.isEditing {
        padding-top: 0;
        padding-right: 0;
        padding-left: 0;
    }

    b {
        font-size: 15px;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }

    #actions-container {
        padding-top: 4px;
        padding-bottom: 6px;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
    }

    #refresh-button {
        float: right;
    }

    #recent-changes-titlebar {
        white-space: nowrap;
    }

    #recent-changes-container {
        height: 100%;
        display: inline-block;
        width: 100%;
    }

    #window-resizer {
        position: absolute;
        width: 5px;
        height: 100%;
        cursor: ew-resize;
        z-index: 9999999;
        transition: background-color ease 150ms;
    }
    #window-resizer:hover {
        background-color: var(--shadow);
    }

    #editor {
        display: flex;
        flex-flow: column;
        max-width: inherit;
    }

    .editor_window {
        flex: 1;
        overflow-y: scroll;
        overflow-x: clip;
        position: relative;
    }

    #editor_pane {
        padding-top: var(--padding_minimum);
        padding-bottom: var(--padding_minimum);
    }

    #footer {
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
        background-color: var(--surface_variant);
        bottom: 0;
        padding: var(--padding_minimum);
        position: relative;
        width: 100%;
        z-index: 99999;
    }

    .footer-buttons {
        display: flex;
        width: 100%;
    }

    .row {
        margin-bottom: 0;
        margin-right: -8px;
        display: inline-flex;
        gap: 8px;
    }


    .arrow {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        transform: rotate(90deg);
        cursor: pointer;
    }

    #arrow_container {
        position: relative;
        margin-top: 10px;
        margin-bottom: 14px;
    }

    .arrow span {
        display: block;
        width: 1.1rem;
        height: 1.1rem;
        border-bottom: 5px solid white;
        border-right: 5px solid white;
        transform: rotate(45deg);
        margin: -10px;
        animation: animate 2s infinite;
    }

    .arrow span:nth-child(2) {
        animation-delay: -0.2s;
    }

    .arrow span:nth-child(3) {
        animation-delay: -0.4s;
    }

    @keyframes animate {
        0% {
            opacity: 0;
            transform: rotate(45deg) translate(-20px, -20px);
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
            transform: rotate(45deg) translate(20px, 20px);
        }
    }

</style>
<svelte:options accessors/>
<svelte:window on:resize={() => { if (editPanel != null) { editPanelContent.style.height = document.querySelector('.appbar') ? editPanel.clientHeight - document.querySelector('.appbar').clientHeight + "px" : null } if (editor) { editor.style.height = `${editor?.parentElement?.clientHeight}px`;}}} on:mouseup={onResizerUp} bind:innerHeight />