

- bagel
- vality copy
- zero stuff



## problems

- skyrim map, locations at max zoom (8) arent reachable. need to be 7.5 instead

## last week:


## Bug fixes:
- fixed cell resource y flip
- fixed TR cell sizes being too small
- fixed: grid disappearing on layer switch (dark/day)
- fix: grid menu still being shown when navigating between worlds
- fix map changing location on layer switch
- fixed reset map feature not working (was broken before)
- truncated leading decimals when using worldspace-based maps (decimals should only show for normalised)
- fix solstheim and shivering not loading on reload (was a race condition)

## Polish
- when navigating to any location, loading bar appears instantly
- added option to turn off grid for cell resources
- grid state now shows in url (grid=true) and is read accordingly (grid state can be shared as link)


feat: more intelligent zoom: long pressing zoom buttons will recentre the map, pressing it again will zoom all the way in/out




## what's new

the new map is a close-to-ground-up rework of the map system, focusing on performance and mobile friendliness.

General:

        Smooth scrolling and zooming
        Improved mobile UI
        Better performance
        Map shows current location name in the browser tab

Search improvements:

        Search is now "live", typing will instantly begin to search, no pressing enter needed
        Icon searching "type:wayshrine", "type:chest" to search for that specific type of icon in a map (note: doesn't currently respect the "only search this map" setting)

Map Switcher:

        Made more intuitive
        Now automatically updates with new locations (previously was manual)
        The alphabetical list (ABC) will now scroll down to your current location in the list

Keyboard Shortcuts:

        Ctrl + F to bring up search
        Arrow keys to move the map around
        Shift + arrow key pan the map more
        Ctrl + clicking a location always opens a popup
        Shift + clicking a location will edit that location

Miscellaneous/Technical:

        Map tiles now load faster, no longer get "stuck"
        Locations that have a map associated with them now have an added icon on tooltips to indicate you can click into them (zones, dungeons)
        URL now updates automatically as you navigate the map, making it easier to share the exact location to someone
        Map client now supports all other UESP maps, in future will be able to change the game in the url "eso" > "mw" to go to that map
        ESO's map now uses a normalized coordinate scheme, (0.x .. 1.0) better representing the game

Feedback we're looking for (in addition to any bug reports):

        Do you like the new interface? (anything you dislike?)
        Does the map on mobile feel intuitive and easy to use? (is it an improvement over the old map?)
        Does the new UI feel right on desktop?
        Anything not working right or out of place? (if so, please screenshot and say what device and browser)
        How is the performance of the new map compared to the old one? (how fast things are, any lag etc)

https://docs.google.com/spreadsheets/d/1DkR-pVMRExdIBHU_qlz1sVc5PZv6BuS6DPXm4uYxLdA/edit#gid=0

**what's new since last beta:**

- all uesp maps have been implemented


- morrowind,

- Solstheim in the skyrim map
- Shivering isles in the oblivion map

gridmap
cell resources for skyrim

layers (day/night)

also sharable in URL

help, map key, full screen options

technical:



rewrote UI and performance optimisations

Search:
- now has "pin" option


**Technical**


## todo

- do get centre of polygon to count towards isvisible
- add allow long clicking on mobile to open popups
- fix requesting /null in layerbutton
- fix polylines not respecting zoom levels
- make leaflet popup wikilinks turn black if there's no href
- add permalink option in location popups
- redesign location popups
- fix polygons disappearing when outer points are not viewable (consider centre point as well)
- fix icons randomly disappearng from listItem
- make embeded map watermark actually open in new tab
- fix tooltip text: wikilink and detail not being put on separate lines
- make labels clickable
- write copy for whats new
- fix layer widget pip/triangle being messed up
- import materialise buttons into svelte components
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix all markers showing up at initial load on highest zoom level
- edit

## todo (future)
- wiki features
- email thing
- starfield wiki app
- starfield map

app :
- cross platform
- cross wiki
- integrate maps