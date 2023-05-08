## last week:


- improve styling for icon dropdowns
- show selected icon in icon dropdown
- get location saving working

- rewrote how colours used for polygons (i had rgb and a separately for some reason)
- added colour picker

problems: existing html5 colour picker only does RGB or hex, no alpha
had to download a colour picker library that does RGBA since polygons are in RGBA
- added colour picker component

- themed it to fit in



## dave stuff:
- 32px skyrim icons
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing

## todo

- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- convert eso and dawnstar to psueodo normalised in mapconfig

- alphabeticise map key ui
- hamburger for search bar to show other maps
- cell resource state from url
- do get centre of polygon to count towards isvisible
- add allow long clicking on mobile to open popups
- fix requesting /null in layerbutton
- fix polylines not respecting zoom levels
- make leaflet popup wikilinks turn black if there's no href
- add permalink option in location popups
- redesign location popups
- fix polygons disappearing when outer points are not viewable (consider centre point as well)
- make embeded map watermark actually open in new tab
- fix tooltip text: wikilink and detail not being put on separate lines
- make labels clickable
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix all markers showing up at initial load on highest zoom level
- button to go to the map menu
- button to go up a map, right click isnt intuitive
- separate mods from offical maps
- disable polygon fade css effect on firefox
- make maps in game release order

feedback:
- map key alphabetical
- map key not nearest neighbour
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- some kind of tutorial on first non-cookie load to tell user how to use ui
- an undo button for deleting/editing locations and worlds
- localisations for maps (local json and server database)

## todo (future)
- wiki features
- email thing
- starfield wiki app
- starfield map

app :
- cross platform
- cross wiki
- integrate maps
- "find in page"