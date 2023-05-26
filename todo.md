## last week:

lots of bug fixes, worked on location stuff too


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

## polish:
- finalised design of the polygon handles
- optimised icon culling code to be more performant
- rewrote marker engine to be more performant (900mb ram usage)
- optimised svg renderer to use just 1 svg element instead of loads for each path
- editor close button now says "cancel" if there are unsaved changes, instead of "close"

## problems:
- when editing polygons, geoman adds several 10's of circle markers to the map for handles, laggy
- no easy way to fix that exept for using canvas
- mitigated it somewhat by optimising the marker engine above and debouncing when editing fields





## todo


fix polygons/icons disappearing after edit
fix markers not being visually saved after save




- fix polygons with icons not showing their icons
- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- convert eso and dawnstar to psueodo normalised in mapconfig
- hamburger for search bar to show other maps
- cell resource state from url
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
- fix race condition where:
>> load into world
>> exit it before locations load in
>> wrong locations now load in parent world
- make going to location centre zoom dynamically instead of always zoom level 5
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix double click to pan on ui elements (zoom, search bar)
- make tooltip follow mouse cursor instead of centre
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