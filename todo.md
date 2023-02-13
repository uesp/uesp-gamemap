## last week:

ported over the menu bar to svelte, and fixed some longstanding bugs
getting ready for beta

## New features
- added map key and help menus
>> fully responsive to mobile and different screen sizes

## Polish / QoL

- iconbar menu is now more responsive, hides stuff based on window size
- embed support is a little better
- made location dropdown truncate really long names
- now supports both world name and id in URL (also now defaults to show world name)
- "more" menu now has icons on it
- "more" menu also now has tooltips describing what things do
- more menu also keyboard controlled
- added explanatory tooltips to more things

## Bugfixes:

- fixed: bug with toasts overlaying elements on mobile (would prevent buttons being pressed)
- fixed: not being able to click behind the icon bar, to the map
- fixed: dropdown menu behind behind search and the other menu buttons
- fixed: dropdown menu being cropped errorneously

## Misc:
- because the "feedback" page is no longer per-map, i moved it to the overflow menu
- slight adjustment to edit schedule, i think i will need this week and next week to fix up and polish for the beta before starting edit
- i want to clean up gamemap.js in particular, reduce tech debt












## todo
- rewrite help.txt to be more relevant to new gamemap
- make gamemap.js create its own element
- import materialise buttons into svelte components


- make location list centred with button
- add allow long clicking on mobile to open popups
- fix game worldspace XY conversion
- fix polylines not respecting zoom levels
- optimise grid code
- do cell resource grid for skyrim
- gamemap not loading after initial full load (gamemap.net/ob/....) results in null latlngs
- fix grid disappearing when switching layers
- make loading bar show as soon as gotoDest is called
- for grid, fill in the cells up//along every 5 cells with slightly transparent rect, to add more contrast
- add permalink option in location popups
- copy to clipboard isnt working on mobile
- make map reset use zoomtoBounds or equivalent from leaflet docs
- fix icons randomly disappearng from listItem
- make embeded map watermark actually open in new tab
- fix layer widget pip/triangle being messed up
- other maps
- edit
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