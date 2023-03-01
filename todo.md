

## problems

- skyrim map, locations at max zoom (8) arent reachable. need to be 7.5 instead

- can get locations to match up to map with power of two stuff, but then map view positioning is off (demonstrate with layer switcher)

- can leave coordinates as they are, and map view positioning works, but locations are off

- because tileX/Y aren't pow 2, and arent a square, grid is messing up and looks weird. grid should always be a square

- also solstheim is squished horizontally

all of the above doesnt happen when using square, pow 2 maptiles



expected questions: "where's gametopixels" combined into toCoords/toLatLngs methods

instead of many methods for different conversions, its now two method for many conversions



## last week:


## Bug fixes:
- fixed cell resource y flip
- fixed TR cell sizes being too small
- fixed: grid disappearing on layer switch (dark/day)
- fix: grid menu still being shown when navigating between worlds
- fix map changing location on layer switch
- fixed reset map feature not working (was broken before)
- truncated leading decimals when using worldspace-based maps (decimals should only show for normalised)
- fix solstheim and shivering not loading on reload (was a race condition)

## Polish
- when navigating to any location, loading bar appears instantly
- added option to turn off grid for cell resources
- grid state now shows in url (grid=true) and is read accordingly (grid state can be shared as link)


feat: more intelligent zoom: long pressing zoom buttons will recentre the map, pressing it again will zoom all the way in/out

## todo

- do get centre of polygon to count towards isvisible
- add allow long clicking on mobile to open popups
- fix requesting /null in layerbutton
- fix polylines not respecting zoom levels
- make leaflet popup wikilinks turn black if there's no href
- add permalink option in location popups
- redesign location popups
- fix polygons disappearing when outer points are not viewable (consider centre point as well)
- fix icons randomly disappearng from listItem
- make embeded map watermark actually open in new tab
- fix tooltip text: wikilink and detail not being put on separate lines
- make labels clickable
- write copy for whats new
- fix layer widget pip/triangle being messed up
- import materialise buttons into svelte components
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix all markers showing up at initial load on highest zoom level
- edit

## todo (future)
- wiki features
- email thing
- starfield wiki app
- starfield map

app :
- cross platform
- cross wiki
- integrate maps