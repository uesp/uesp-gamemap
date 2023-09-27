<!-- svelte-ignore missing-declaration -->
<!-- @component
### Description
 Ad component for the UESP gamemap.

### Author(s)
- Thal-J <thal-j@uesp.net> (25th September, 2023) -->

<script>

    // import svelte stuff
    import { onMount } from 'svelte';

    // on load
    onMount(async () => {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://lngtd.com/${MAPCONFIG.adScriptName}.js`;    
        document.head.appendChild(script);
    });

</script>

<markup>
    <div id="{MAPCONFIG.adScriptName}_{isMobile() ? "M_1" : "D_1"}" style="pointer-events: visible;"/>
</markup>