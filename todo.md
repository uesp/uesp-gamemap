## last week:



fix: map view not being centred properly on world load (most noticeable on eso map)


## todo

- optimise grid code
- do cell resource grid for skyrim

- add close button to grid options (along with turning off grid)

- add allow long clicking on mobile to open popups
- fix requesting /null in layerbutton
- fix game worldspace XY conversion
- fix polylines not respecting zoom levels
- gamemap not loading after initial full load (gamemap.net/ob/....) results in null latlngs -- only happening on shivering
- fix grid disappearing when switching layers
- refactor GetMapImageDimensions(world) into world
- make loading bar show as soon as gotoDest is called
- make leaflet popup wikilinks turn black if there's no href
- for grid, fill in the cells up//along every 5 cells with slightly transparent rect, to add more contrast
- add permalink option in location popups
- make map reset use zoomtoBounds or equivalent from leaflet docs
- fix icons randomly disappearng from listItem
- make embeded map watermark actually open in new tab
- fix tooltip lines being compressed, wikilink and detail not being put on sep lines
- make labels clickable
- fix layer widget pip/triangle being messed up
- edit
- import materialise buttons into svelte components
- fix popups having the wrong coord type on them
- add way to show popups on centreon, optional param
- fix all markers showing up at initial load on highest zoom level
- fix polygons disappearing when outer points are not viewable (consider centre point as well)

## todo (future)
- wiki features
- email thing
- starfield wiki app
- starfield map

app :
- cross platform
- cross wiki
- integrate maps