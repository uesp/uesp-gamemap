

## last week:

began adding world/location editing, fixed bugs

## editing:
- got edit sidebar ui working (not linked up to server yet)
- shift+click on locations to edit
- editing a location will cause it to glow blue (for worlds, makes whole view glow)
>>> reasoning:
>>> - since editing is now in a sidebar instead of a popup it could be easy to lose track of whatever you're editing in the sea of icons
>>> - differenciate between editing world (the whole window) or a location (just the location)
>>> - could also be used to indicate unsaved changes in future? (maybe different colour?)

## map chooser
- implemented better map chooser using new api
- cleaned up design a bit


- show off mobile (dave asked last week)
## bugs:
- fixed RC refreshing each time you opened it
- fixed maps not being centred on load (noticeable with eso)

## dave stuff:

immediate

- dawnstar leaflet tiles
- tj database access

nonpriority

- 32px skyrim skyrim icons
- type:cave doesnt respect "search in this map" setting
- search world internal names in searchbox like "name:blah"
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing




feedback:
- map key alphabetical
- map key not nearest neighbour
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- some kind of tutorial on first non-cookie load to tell user how to use ui
- an undo button for deleting/editing locations and worlds

## todo

- skyrim minecraft map
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
- fix maps not being centred properly on load
- fix tooltip text: wikilink and detail not being put on separate lines
- make labels clickable
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- sr icons higher res
- fix all markers showing up at initial load on highest zoom level
- edit
- button to go to the map menu
- separate mods from offical maps
- make maps in game release order

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