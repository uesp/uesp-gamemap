## last week:

- Got full screen option working
- Rewrote help menu to be relevant to be vality


## Technical
- gamemap now creates its own gamemap element if none provided
- added MD (markdown) parser for help menu instead of html from txt

## Bug Fixes
- fixed copy link button not working on mobile






## todo
- make fullscreen menu work



- get location list menu working
- make location list centred with button
- get skyrim map done
- optimise grid code
- do cell resource grid for skyrim




- add allow long clicking on mobile to open popups
- fix requesting /null in layerbutton
- fix game worldspace XY conversion
- fix polylines not respecting zoom levels
- gamemap not loading after initial full load (gamemap.net/ob/....) results in null latlngs
- fix grid disappearing when switching layers
- make loading bar show as soon as gotoDest is called
- make leaflet popup wikilinks turn black if there's no href
- for grid, fill in the cells up//along every 5 cells with slightly transparent rect, to add more contrast
- add permalink option in location popups
- copy to clipboard isnt working on mobile
- make map reset use zoomtoBounds or equivalent from leaflet docs
- fix icons randomly disappearng from listItem
- make embeded map watermark actually open in new tab
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