## last week:

- Got full screen option working
- Rewrote help menu to be relevant to be vality
- got skyrim map working

## Polish
- location list is now dynamically centred to dropdown button (wasnt before)
- location list has dynamic animation depending on mobile or desktop (comes out from button)
- location list only shows group (categories) tab when there are lots of worlds

## Misc / Technical
- gamemap now creates its own gamemap element if none provided
- added MD (markdown) parser for help menu instead of html from txt
- location list no longer displays the full list, only whats visible, better performance

## Bug Fixes
- fixed copy link button not working on mobile
- fixed fullscreen button not being synced to actual fullscreen state
- fixed layer switcher not updating between worlds
- fixed location list not selecting the current world properly
- fixed location list tabs not being selected properly (and removed poor hack with timeout to force them to be selected)






## todo

- get location list menu working
- make location list centred with button
- get skyrim map done


- optimise grid code
- do cell resource grid for skyrim

"Grid Options"
- dont do separare button for cell resource, if grid is enabled, and has cell resource, then show cell resource menu

"show labels"
"Highlight cell resources: (iron ore)"


- add allow long clicking on mobile to open popups
- fix requesting /null in layerbutton
- fix game worldspace XY conversion
- fix polylines not respecting zoom levels
- gamemap not loading after initial full load (gamemap.net/ob/....) results in null latlngs -- only happening on shivering
- fix grid disappearing when switching layers
- make loading bar show as soon as gotoDest is called
- make leaflet popup wikilinks turn black if there's no href
- for grid, fill in the cells up//along every 5 cells with slightly transparent rect, to add more contrast
- add permalink option in location popups
- make map reset use zoomtoBounds or equivalent from leaflet docs
- fix icons randomly disappearng from listItem
- fix eastmarch location having weird characters
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