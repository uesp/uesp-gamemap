## last week:

- parentID shows "invalid world" for invalid worlds
- parentID field world name now truncates to stop ui overflow
- zoom levels now have minimum of 0
- link up loc switcher to editor

## dave stuff:
- 32px skyrim icons
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing

## todo

- fix going to location ids actually just going to worlds and not centreing on the locations
- make location.js have worlds = +positive and locations = -negative
- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- link up the "edit" buttons on popups to actual edit menu




- convert eso and dawnstar to psueodo normalised in mapconfig
- make eso only one with custom css as the rest use yellow anyway

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