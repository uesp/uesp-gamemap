<!-- svelte-ignore missing-declaration -->
<!-- @component
### Description
 Ad component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (25th September, 2023) -->

<markup>
    <div id="{MAPCONFIG.altAdDivID ?? MAPCONFIG.adScriptName}_{isMobile ? "M_1" : "D_1"}" style="pointer-events: visible;" class:mobile={isMobile}/>
</markup>

<!-- inject ads sdk script into document head -->
<svelte:head>
    <script src="https://lngtd.com/{MAPCONFIG.adScriptName}.js"/>
</svelte:head>

<style>

    div {
        width: fit-content;
        height: fit-content;
    }

</style>