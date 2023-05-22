## last week:


## editing:
- turned off pan/zoom editing anim for performace
- added live editing debouncing for performance
- removed blue editing tint from polygons, so you can see the fill/hover colours
>> tint remains on label and handles, though

## bug fixes:
- fixed cancelling editing not working (it would restore change after few milliseconds)
- fixed not being able to edit polygon/marker after changing a field in the edit window
- fixed edit() function being called three times (and redrawing marker every time) you edit


## misc:
- finalised design of the polygon handles





## todo

- get rid of blue tint when editing polygons and lines
- fix edit being called three times
- fix polygons with icons not showing their icons
- fix polylines disappearing

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
- make labels clickable
- make going to location centre zoom dynamically instead of always zoom level 5
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- add riseOnHover to icon labels when hovering over
- make tooltips follow the mouse rather than the centre of the location
- fix all markers showing up at initial load on highest zoom level
- button to go to the map menu
- button to go up a map, right click isnt intuitive
- separate mods from offical maps
- disable polygon fade css effect on firefox
- make maps in game release order


## dave stuff:
- 32px skyrim icons
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing


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