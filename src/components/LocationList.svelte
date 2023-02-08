<!-- @component
### Description
 Location list component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (07th Feb, 2023) -->


<script>
    // import svelte core stuff
	import { onMount } from 'svelte';
    import { fade, fly } from 'svelte/transition';

    let tabBar = null;
    let locationList = null;

    // initiate tabs
    onMount(async () => {
        let tabs = M.Tabs.init(tabBar, {});
        tabs.select('group_tab');
	});

    // todo: make location list always appear in the direct centre of location dropdown

</script>

<markup>
    <!-- Location list -->
    <div id="location_list" bind:this={locationList} in:fly="{{ y: -20, duration: 200 }}" out:fade>

        <ul id="location_list_tab_bar" class="tabs" bind:this={tabBar}>
            <li id="group_tab" class="tab"><a href="#tab_categories">Groups</a></li>
            <li id="abc_tab" class="tab"><a href="#tab_alphabetical">ABC</a></li>
        </ul>

        <div id="location_list_content">
            <div id="tab_categories" class="tab-pane">
                <!-- grouped locations go here -->
            </div>

            <div id="tab_alphabetical" class="tab-pane">
                <!-- alphabetical locations goes here -->
            </div>
        </div>
    </div>
</markup>


<style>
    #location_list {
        position: fixed;
        width: calc(var(--side_panel_width) * 0.80 );
        height: 65%;
        background-color: var(--surface);
        color: var(--text_on_primary);
        top: 50%;
        left: calc(var(--side_panel_width) + var(--padding_large));
        top: 40%;
        transform: translate(-50%, -50%);
        z-index: 100000;
        border-radius: var(--padding_medium);
        box-shadow: 0px 1.5px 4px 4px var(--shadow);
    }

    #location_list_content {
        overflow-y: auto;
        height: calc(100% - var(--appbar_dimen));
        border-radius: 0 0 var(--padding_medium) var(--padding_medium);
    }

    #location_list_tab_bar {
        border-radius: var(--padding_medium) var(--padding_medium) 0 0;
        height: var(--appbar_dimen) !important;
        background-color: var(--primary_variant_dark);
        box-shadow: 0 2px 2px 0px var(--shadow);
        z-index: 999;
    }

    #location_list_tab_bar .tab a {
        color: var(--text_low_emphasis);
        font-weight: bold;
    }

    #location_list:before {
        content: "\A";
        border-style: solid;
        border-width: 10px 15px 10px 0;
        border-color: transparent var(--primary_variant_dark) transparent transparent;
        position: absolute;
        left: 50%;
        top: -17px;
        transform: rotate(90deg);
    }
</style>