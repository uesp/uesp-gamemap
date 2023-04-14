## last week:

- got localhost editing working
- added location edit effect
- tweaked behaviour of edit sidebar:
>> if editing directly, clicking close will close the sidebar
>> if editing from RC UI, clicking back will go back to RC screen
>> before, all cases would go back to the RC screen

# bug fixes:
- fixed edit button showing wrong edit state (was highlighted when not editing)
- fixed dropdown box not having its background (made consistent with textboxes)
- added elipses to dropdown box text (cell resource text overflowing)





## dave stuff:

- do I have a uesp email? (thal-j@uesp.net)

- 32px skyrim skyrim icons
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing


## todo


- make description box that has some text in it simulate focus and left arrow press to expand box, then defocus
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
- button to go to the map menu
- separate mods from offical maps
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