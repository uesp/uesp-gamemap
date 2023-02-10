## last week:

ported over the menu bar to svelte, and fixed some longstanding bugs

## Polish / QoL

- iconbar menu is now more responsive, hides stuff based on window size
- embed support is a little better
- made location dropdown truncate really long names
- now supports both world name and id in URL (also now defaults to show world name)
- "more" menu now has icons on it
- "more" menu also now has tooltips describing what things do
- more menu also keyboard controlled
- added explanatory tooltips to more things

## Misc:
- because the "feedback" page is no longer per-map, i moved it to the overflow menu
- slight blur behind buttons

## Bugfixes:

- fixed: bug with toasts overlaying elements on mobile (would prevent buttons being pressed)
- fixed: not being able to click behind the icon bar, to the map
- fixed: dropdown menu behind behind search and the other menu buttons
- fixed: dropdown menu being cropped errorneously

## todo

- make gamemap.js create its own element
- import materialise buttons into svelte components
- make modal svelte component
- import help from server request

make location list centred with button

- add allow long clicking on mobile to open popups
- fix game worldspace XY conversion
- fix polylines not respecting zoom levels
- optimise grid code
- make loading bar show as soon as gotoDest is called
- for grid, fill in the cells up//along every 5 cells with slightly transparent rect, to add more contrast
- add permalink option in location popups
- make map reset use zoomtoBounds or equivalent from leaflet docs
- link up watermark map name to gamemap.resetMap
- fix icons randomly disappearng from listItem
- optimise help and map key menu to only do stuff when pressed (saves having to do all network requests at once)
- add "map key" to layers menu to all maps, use help_center icon
- make embeded map watermark actually open in new tab
- add map key
- fix layer widget pip/triangle being messed up
- add feedback button to overflow menu
- do cell resource grid for skyrim
- other maps
- help and stuff
- edit
- fix popups having the wrong coord type on them
- add way to show popups on centreon, optional param
- fix all markers showing up at initial load on highest zoom level
- fix polygons disappearing when outer points are not viewable (consider centre point as well)
- fix grid disappearing when switching layers

## todo (future)
- wiki features
- email thing
- starfield wiki app
- starfield map

app :
- cross platform
- cross wiki
- integrate maps