<!-- @component
### Description
 Map chooser widget for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (31st Jan, 2023) -->

<script>

    // import ui components
    import Divider from "./Divider.svelte";
    import Icon from "./Icon.svelte";
    import LoadingSpinner from "./LoadingSpinner.svelte";
    import PreloadBox from "./PreloadBox.svelte";
    import LayerButton from "./LayerButton.svelte";

    let maps = null;

    // get list of games to show
    print("Getting available maps...");
    let queryParams = {};
	queryParams.action = "get_maps";
    getJSON(GAME_DATA_SCRIPT + queryify(queryParams)).then(data => {

        maps = [];

        // define map list object
        data.maps.forEach(name => {
            let map = {};
            let mapInfo = data.mapInfos[name];

            map.name = mapInfo?.mapTitle.replace('Gamemap', '').replace('Map', '').trim() ?? name.toUpperCase();
            map.database = name;
            map.disabled = mapInfo == null;
            map.isModded = mapInfo?.isModded == true || map.disabled;
            map.releaseDate = (mapInfo) ? Date.parse(new Date(mapInfo.releaseDate.split('/')[2], mapInfo.releaseDate.split('/')[1] - 1, mapInfo.releaseDate.split('/')[0])) : 0;

            maps.push(map);
        })
        maps.sort((a,b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

        print(maps);

    });

</script>

<markup>
    <PreloadBox>

        <span class="info_title">
            <Icon name="map" size="medium"></Icon><br>
            <b style="margin-bottom: 10px;">Choose a game map</b>
        </span>
        <p/>
        <Divider direction="horizontal"/>
        <p/>
        Please choose a game from the options below.
        <p/>
        {#if maps?.length > 0}

                <!-- Official maps -->
                <div class="options_container">
                    {#each maps as map}
                        {#if !map.isModded}
                            <!-- svelte-ignore missing-declaration -->
                            <LayerButton label={map.name} icon="{MAP_ASSETS_DIR}{map.database}/icons/favicon.png" dark="true" big="true" on:onClick={() => (location.pathname = map.database)} disabled={map.disabled}/>
                        {/if}
                    {/each}
                </div>

                <div style="margin:10px;">
                    <Divider direction="horizontal"/><p/>
                </div>

                <!-- Modded maps -->
                <div class="options_container">
                    {#each maps as map}
                        {#if map.isModded}
                            <!-- svelte-ignore missing-declaration -->
                            <LayerButton label={map.name} icon="{MAP_ASSETS_DIR}{map.database}/icons/favicon.png" dark="true" big="true" on:onClick={() => (location.pathname = map.database)} disabled={map.disabled}/>
                        {/if}
                    {/each}
                </div>

        {:else}
            <LoadingSpinner/>
        {/if}

    </PreloadBox>
</markup>

<style>
    .info_title {
        color: var(--secondary_variant_light);
        vertical-align: middle;
        font-size: 1.2em !important;
        vertical-align: middle;
    }
</style>