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

    // import commons
	import * as Utils from "../common/utils.js";
    import * as Constants from "../common/constants.js";
  import LayerButton from "./LayerButton.svelte";

    $: maps = null;

    // get list of games to show
    print("Getting available maps...");
    let queryParams = {};
	queryParams.action = "get_maps";
    Utils.getJSON(Constants.GAME_DATA_SCRIPT + Utils.queryify(queryParams), function(error, data) {
        if (!error && data != null) {
            print(data.maps);

            // sort alphabetical order
            maps = data.maps.sort((a, b) => a.localeCompare(b));
        }
    });

</script>

<markup>
    <PreloadBox>

        <span class="info_title">
            <Icon name="info" size="medium"></Icon><br>
            <b style="margin-bottom: 10px;">Choose a game map:</b>
        </span>
        <p/>
        <Divider direction="horizontal"/>
        <p/>

        A game wasn't provided, please choose one from the options below.

        {#if maps != null}
            <p/>
            <div>
                {#each maps as map}
                    <LayerButton label={map.toUpperCase()} icon="assets/maps/{map}/images/favicon.ico" dark="true" on:onClick={() => (location.href = "https://gamemap.uesp.net/"+map)}/>
                {/each}
            </div>
        {:else}
            <LoadingSpinner/>
        {/if}

    </PreloadBox>
</markup>

<style>
    .info_title {
        color: var(--primary);
        vertical-align: middle;
        font-size: 1.2em !important;
        vertical-align: middle;
    }
</style>