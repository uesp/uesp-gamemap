## last week:



- rewrote and optimised grid code
- optimised grid code (only renders what's visible on canvas)

feat: added new grid options menu, which contains cell resource on valid maps
feat: allow turning off cell coord labels
- made all maps request tile number of maxZoom^2

- added grid options menu, which contains cell resources
>>> allows both cell resource and grid to be toggled off/on with one click
>>> has expando so doesnt get in the way

- improved grid styling slightly

- added indicator to show cells that are 5 % 2 == 0
>>> this is customisable in the mapConfig, by default its light grey, but for skyrim its half-black because snow

fix: map view not being centred properly on world load (most noticeable on eso map)
fix: grid being removed when locations load in


## ask dave:

- SR icons 32px (like eso) instead of 16? i think they should be bigger

"Was thinking of updating tilesX/Y in the db to be the max tile count but that would mess up some existing ESO stuff that uses it
[19:11]
So probably better to add 2 new columns to the world DB if we wanted to (assuming that would be useful from your end at least"


other fields to add to world:

- defaultZoom : int
- resourceStart : [] (for cell resource offsets)
    "gridShowLabels" : true,
    "gridShowLabelZoom" : 3,

## todo

- do cell resource grid for skyrim


- add allow long clicking on mobile to open popups
- make grid options text right aligned
- fix requesting /null in layerbutton
- fix game worldspace XY conversion
- fix polylines not respecting zoom levels
- gamemap not loading after initial full load (gamemap.net/ob/....) results in null latlngs -- happening shivering and solstheim
- fix grid disappearing when switching layers
- make loading bar show as soon as gotoDest is called
- make leaflet popup wikilinks turn black if there's no href
- for grid, fill in the cells up//along every 5 cells with slightly transparent rect, to add more contrast
- add permalink option in location popups
- redesign location popups
- make map reset use zoomtoBounds or equivalent from leaflet docs
- fix icons randomly disappearng from listItem
- make embeded map watermark actually open in new tab
- fix tooltip text: wikilink and detail not being put on separate lines
- make labels clickable
- fix layer widget pip/triangle being messed up
- edit
- import materialise buttons into svelte components
- add continuous zoom, markers popup on zoom rather than zoomend
- fix popups having the wrong coord type on them
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix losing grid on layer switch
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