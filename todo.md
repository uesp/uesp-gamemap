## last week:

did some ui work on editor, began hooking up network connections

## QoL:
- prettified world edit screen
- most/all fields have tooltips that describe what they do
- world parent ID now shows name of that world under the field
- party trick: with last week's refactoring + svelte reactivity, parent world ID text box
updates automagically with the name of the world even as you're typing

## technical
- added data loading into edit boxes, parity with live
- allowed animated placeholders and static ones in textboxes
- this is to have textboxes that have label + placeholder, or just placeholder (and have that used as label)
- refactored textbox to allow for multiple lines (used for description)
- began hooking up world editor to network, placeholder ui for now (success/error states)
- svelte magic: all form fields are autoupdated into variables, which can be passed into network request

## bug fixes:
- fixed not being able to select text in edit panel
- fixed editor scrolling issues






## dave stuff:

- 32px skyrim skyrim icons
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing


## todo

- allow editor panel to be resized, and save size in prefs

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

feedback:
- map key alphabetical
- map key not nearest neighbour
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- some kind of tutorial on first non-cookie load to tell user how to use ui
- an undo button for deleting/editing locations and worlds
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