## last week:


- added "iconLabelOffset" property to mapconfig (default 0, 5 on MW, OB, TR) as eso's icon labels were too far from the centre with 5 (the previous global value)




- compacted/prettified the ui a bit by adding the icon of the marker at the top next to the name
>> clicking the icon does the dropdown as usual
>> besides looking pretty it fixes an annoying bug with long dropdown lists not scrolling properly


- fixed: tooltip wikipage + description was on one line (al donaba tomb)

- added "click to enter" text in tooltips for locations that go to other maps

fix: firefox complaining with decimalised values in fields
fix: editor window scrolling down

fix: make description textbox resize with editor (didnt before)

fix: prevent being able to click into other zones when editing

tweak: hovering over icons now brings it to the front (vvardenfell foyada quarry)

- fixed: currently editing marker disappearing when zoomed out of its display level
tweak: prevent markers that are being edited from being culled

tweak: made the edit pan a bit smarter, now zooms in for icons and zooms out for polygons depending on how big they are
and the exact zoom amount is dependent on how big they are
for things like treasure chests, it will choose whichever is biggest: the display level, or the bounds + padding

qol: since shift clicking locations edits locations, i made shift clicking the edit button edit the current world

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