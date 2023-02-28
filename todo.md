## last week:


## Bug fixes:
- fixed cell resource y flip
- fixed TR cell sizes being too small
- fixed: grid disappearing on layer switch (dark/day)
- fix: grid menu still being shown when navigating between worlds
- fixed reset map feature not working (was broken before)
- truncated leading decimals when using worldspace-based maps (decimals should only show for normalised)

## Polish
- when navigating to any location, loading bar appears instantly
- added option to turn off grid for cell resources
- grid state now shows in url (grid=true) and is read accordingly (grid state can be shared as link)




## todo

- truncate XY in worldspace coordinates in url
- do get centre of polygon to count towards isvisible
- add allow long clicking on mobile to open popups
- fix requesting /null in layerbutton
- fix game worldspace XY conversion
- fix polylines not respecting zoom levels
- gamemap not loading after initial full load (gamemap.net/ob/....) results in null latlngs -- happening shivering and solstheim
- make leaflet popup wikilinks turn black if there's no href
- add permalink option in location popups
- redesign location popups
- fix polygons disappearing when outer points are not viewable (consider centre point as well)
- fix icons randomly disappearng from listItem
- hook up world defaultZoom to actually make worlds zoom to that level
- make embeded map watermark actually open in new tab
- fix tooltip text: wikilink and detail not being put on separate lines
- make labels clickable
- write copy for whats new
- fix layer widget pip/triangle being messed up
- import materialise buttons into svelte components
- add continuous zoom, markers popup on zoom rather than zoomend
- fix popups having the wrong coord type on them
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