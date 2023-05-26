## last week:

got location and poly coord saving done, lots of longstanding bug fixes

note to future james: open current gamemmap.uesp.net to showcase comparisons

## editing:
- got location/polgon saving working 100%
- turned off pan/zoom editing anim for performace
- added live editing debouncing for performance
- dragging/moving markers now updates location's position live

## bug fixes:
- fixed cancelling editing not working (it would restore change after few milliseconds)
- fixed not being able to edit polygon/marker after changing a field in the edit window
- fixed edit() function being called three times (and redrawing marker every time) you edit
- fixed polygons centre coordinates not counting towards it being visible (if all the outside polygons were not visible, the polygon was culled) - long standing bug
- fixed memory leak which was causing icons to stay in memory and jank up the pan/zoom events
- fixed polylines ignoring displayLevel (longstanding bug)
- fixed polygons with icons not being centred correctly
- fixed all icons loading in when loading map at full zoom levels
- fixed race condition w/ loading a world & locations for the first time, then  leaving world before network request completed
>> load into world
>> exit it before locations load in
>> wrong locations now load in parent world

## polish:
- finalised design of the polygon handles
- optimised icon culling code to be more performant
- rewrote marker engine to be more performant (900mb ram usage)
>> caches current map bounds, so each marker doesnt need to calcuate that each time
>> checks zoom levels first, before calculating if marker is inside bounds (skips most markers if zoomed out)
>> instead of modding each leaflet marker class with custom props each time a marker is made, just extended base marker class
- optimised svg renderer to use just 1 svg element instead of loads for each path
- editor close button now says "cancel" if there are unsaved changes, instead of "close"
- made icon labels clickable, just like live

## problems:
- when editing polygons, geoman adds several 10's of circle markers to the map for handles, laggy
- no easy way to fix that exept for using canvas
- mitigated it somewhat by optimising the marker engine above and debouncing when editing fields
- cos rewrote marker code, poly icons dont have their icon right now (cyrodiil bases, some cities)


## todo


fix polygons/icons disappearing after edit
fix markers not being visually saved after save

- add tutorial message for draging markers and edit handles like live
- overwrite polygon edit colours for geoman



- fix polygons with icons not showing their icons
- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- convert eso and dawnstar to psueodo normalised in mapconfig
- hamburger for search bar to show other maps
- cell resource state from url
- allow both edit polygon and drag at same time
- add allow long clicking on mobile to open popups
- zoom/pan in effects for markers when editing
- fix centreon going to the wrong place
- fix requesting /null in layerbutton
- make leaflet popup wikilinks turn black if there's no href
- add permalink option in location popups
- redesign location popups
- fix edit panel not animating close properly
- fix recent changes list overflowing downwards
- fix location list dropdown not being centred properly
- make embeded map watermark actually open in new tab
- make labels clickable
- fix edit pane causing iconbar to overlap
- make going to location centre zoom dynamically instead of always zoom level 5
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix double click to pan on ui elements (zoom, search bar)
- fix maps with multiple worlds being reset if you pass just the world name and not pass x/y or zoom params
- make tooltip follow mouse cursor instead of centre
- fix handling of small icons like 16p when rest of map is 32px (centre them properly)
- on mobile, double tap icon to open its popup
- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af when zooming out
- add riseOnHover to icon labels when hovering over
- make tooltips follow the mouse rather than the centre of the location
- fix all markers showing up at initial load on highest zoom level
- button to go to the map menu
- fix pip on layer switcher ui being small
- button to go up a map, right click isnt intuitive
- disable polygon fade css effect on firefox
- make maps in game release order
- allow shiftclick/ctrl click to add/remove vertices
- maybe refactor to divicon to allow drag by label
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/

## dave stuff:
- 32px skyrim icons
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing


feedback:
- map key alphabetical
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