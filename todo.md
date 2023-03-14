

## last week:

- finished RC, fixed some bugs

## stuff:


- fixed RC refreshing each time you opened it



## stuff for dave:
- dcsg asked for dawnstar maps (give tiles)
- 1 tile per pixel
- show image that shows how they are laid out
- might have to set up old map for editing
- the maps are quite small (20px) - upscale or just use one tile?
- use normalised scheme, 1 area per world
- make skyrim icons 32px


feedback:
- map key alphabetical
- map key not nearest neighbour
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- cave interior maps for skyrim, ob, mw
- some kind of tutorial on first non-cookie load to tell user how to use ui
- search world internal names in searchbox like "name:blah"
- an undo button for deleting/editing locations and worlds


- search by location/world internal name (either name is included in search, or add name:whatever like type:cave)
- type:cave doesnt respect "search in this map" setting


- dawnstar (ds) map for testing
>> probably using normalised coords?
>> 1 tile per pixel
- better getMapList() api for gamemap,php (db, name, isofficial/modded)
- dcsg asked for map editing perms ("they're stingy about giving away editing rights for whatever reason IIRC")


- people asked to separate modded maps from official ones, would probably need help on the php
## todo

wednesday afternoon (your time) remind dave:
dave maps server stuff
dave dawnstar maps setup (next week)

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