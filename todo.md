## last week:

- parentID shows "invalid world" for invalid worlds
- parentID field world name now truncates to stop ui overflow
- zoom levels now have minimum of 0
- link up loc switcher to editor



- refactored how popups work, make use of ${var} syntax instead of "string" + var + "string"
- popups now show destination type next to destionation id (world / location)
- swapped around destination ids (worlds are positive, locations are negative)

- got location edit dropdowns working
- fixed some null errors for edit pane
- removed "label" from loctype as marker does that anyway
- added "set pos" and "edit handles" ui
- link up edit button on popups to edit menu
- optimised location finding (searches for local first, then db if local doesnt exist)
>> means if you've already loaded a world, then clicking on any locations (i.e, in search) will instant jump to it,
>> instead of doing a network request for finding every location

- tweak: when editing a location, map automatiaclly centres to that marker

- fix: clicking on markers that go to locations ids not centring on that location, instead just going to the world
- fix going to location ids actually just going to worlds and not centreing on the locations
- make location.js have worlds = +positive and locations = -negative
- link up the "edit" buttons on popups to actual edit menu


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