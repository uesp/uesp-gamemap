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
    getJSON(GAME_DATA_SCRIPT + queryify(queryParams), function(error, data) {
        if (!error && data) {

            print(data);

            // sort data in alphabetical order
            const sortObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {})
            let mapInfos = sortObject(data.mapInfos);

            // define map list object
            let mapList = { official: [], mods: [] };

            for (let [key, object] of Object.entries(mapInfos)) {
                let map = {};
                map.database = key;
                map.name = object.mapTitle.replace('Gamemap', '').replace('Map', '').trim();

                if (!object.isModded) {
                    mapList.official.push(map);
                } else {
                    mapList.mods.push(map);
                }
            }

            print(mapList);

            maps = mapList;
            print(maps);
        }
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
        {#if maps != null}
            {#if maps.official.length > 0}
                <div class="options_container">
                    {#each maps.official as map}
                        <LayerButton label={map.name} icon="assets/maps/{map.database}/icons/favicon.png" dark="true" big="true" on:onClick={() => (location.pathname = map.database)}/>
                    {/each}
                </div>
            {/if}
            <div style="margin:10px;">
                <Divider direction="horizontal"/><p/>
            </div>
            {#if maps.mods.length > 0}
                <div class="options_container">
                    {#each maps.mods as map}
                        <LayerButton label={map.name} icon="assets/maps/{map.database}/icons/favicon.png" dark="true" big="true" on:onClick={() => (location.pathname = map.database)}/>
                    {/each}
                </div>
            {/if}
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