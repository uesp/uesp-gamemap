## last week

## bug fixes

- fixed being able to right click to remove markers
- fix console.warn error when cancelling new location on gamemap
- fix eso icons not loading on firefox on gamemap.uesp.net
- fixed locations being edited before they should be (bangkorai was being marked as edited on open)
>> added bonus, perf fix as not spam edits as soon as you open editor

## polish

- fixed edit history items with long titles expanding the editor div (not respecting user-chosen width)
- made resizing the editor track the mouse more accurately
- added a max width to editor

## todo



- add location.openPopup() method in location.js that finds marker by location and opens its popups


pendingJump = object {data: {}, edit: true}


add search by location name in getLocation() and locationid


- after moving dodgy location, it went even further north than it already was

dodgy request:
db/gamemap.php?action=set_loc&name=Hall%20of%20Heroes&description=&wikipage=Hall%20of%20Heroes&loctype=1&locid=1813&worldid=168&destid=5245&revisionid=89142&db=eso&visible=1&x=468000.000&y=108000.000&locwidth=32.000&locheight=32.000&displaylevel=10&displaydata=%7B%22labelPos%22%3A10%2C%22points%22%3A%5B%22468000.000%22%2C%22108000.000%22%5D%7D&icontype=57

- fix focus on svelte elements mean cant move map (mobile specifically)
>> try re allowing map panning on the "zoom" or "move" events

- the location coord mismatch is happening because you are converting a new location's coords based on the current world's dimensions
>> need to find a way to pass location.js reference to the current world

- do edit templates for dawnstar per dcsg asked

- fix entering negative locIDs for destIDs being obnoxious (entering minus makes it 0)
> Entering negative numbers is most definitely not a fluid, natural function. The computer fights me, enteriong a zero or ignoring the negative sign.


- fix line colour preview showing fill colours from area

- shift click on other locations while unsaved changes should immediately change to edit it

- do some MAPLOCK.isPartial() function

- make waves light/dark configurable by prop (for adding new loc "cancel" button)


- double clicking markers that arent clickable edits them
- fix having to load new world once, then click RC item again to jump to centre of it

- make adding new location count as unsaved changes (unsaved changes == false or location is unsaved)

if adding location, save will dismiss the editor window
if adding location, close button is always "cancel"

- sort map menu by release date (ask dave to implement backend)

- wiki links to skyshards used positive id for locations instead of negative (need to be changed)
https://esomap.uesp.net/?centeron=24972

- click thing in edit history, prompt to revert, then do network call (ask dave to implement backend)
- remove edit history being clickable with ripple


- fix lag in opening big search results (use virtual list)

- fix escape key bugging out dialogs
>> also make sure you cant escape out of dialogs that are dismissible false

- be able to hotswap to edit different locations with popup edit or shift edit, as long as not unsaved or not new location


- make map lock for editing worlds actually work (no zooming allowed)
- get live editing working for worlds


- fix colour picker default colour to something sensible instead of the blue

- -0.5 on all locations client side

- use eso dev maps as separate layers

"goto article" button doesnt update when world wiki link updated

- fix RC inconsistently being resized after coming back from editing location
- fix RC not going all the way down on initial edit pane open
- make "grouped/abc" symmetrical


- fix high res icons being clipped on icon in ListITem
- fix location dropdown being laggy on open, remember existing location data somehow

- make close button in edit panel always close the panel regardless of direct edit or not

- fix not being able to click location dropdown while it's open to close it

- make map key grid columns dynamic and fix overscrolling


- check to make sure location and world editing works fine still
- make iconbar and resizing dynamic, dont rely on css for mobile mode, do it in javascript based on map size

- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- cell resource state in/from url
- add zoom/pan in effects for markers when editing

- make dialog backgrond start fading with the scale animation, dont make it just disappear when the animation is over

- if location list button is overflowing, show the name of the world insated of "show location list"

- add tooltip to editor back button/ close button "Back" "Close"

- check to make sure world editing still works

- fix description field misbehaving, being too big

- wiki upgrade broke galleries on the app, skyrim:skyrim and other pages with lots of images make text go squished

- fix centreon going to the wrong place
- fix clicking out while zoomed in zooming in to parent map as well
- fix type:blah not working after the icon list to js map change
- fix requesting /null in layerbutton
- add middle click event listener to button and listItem
>> allow middle click to open in new tab for goto article button
>> and add middle click on listitems to open in a new tab w/ centreon link
- fix recent changes list overflowing downwards
- fix location list dropdown not being centred properly
- bring back editing throbbing animation for locations
- fix live edit on world name location switcher
- fix live edit on worlds (every change changes the current world in map object)
- make embeded map watermark actually open in new tab
- make going to location centre zoom dynamically instead of always zoom level 5
- add way to show popups on centreon, optional param
- fix losing grid on resize

- do common.js getIcon() for worlds,locations, to switch between actual icon, polyline, area, world, and point
to be consistent icons (an area doesnt make sense to have a pin icon)

- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af when zooming out
- shift click in RC to travel to and edit world/location
- show more columns on map key menu dynamically
- make centre of polygons visual centre not mathematical centre
- fix cell resource colour intensity to make sense. deeper the colour the more stuff
- fix pip on layer switcher ui being small
- make readme on how to create the favicon styles for maps for future developers
- make maps in game release order
- use similar centre of polygon algorithm as leaflet does for locations/latlng conversion
- organise styles.css and comment gamemap js
- comment/refactor all code

















## todo maps (future)
- skyrim minecraft map thing
- cave interior maps for skyrim, ob, mw
- some kind of tutorial on first non-cookie load to tell user how to use ui
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/
- allow shiftclick/ctrl click to add/remove vertices
- be able to search the icon list in editor
- shower thought: could use the "Dev/Beta" versions of maps for eso as separate layers

## todo future general
- wiki features (hybrid news etc)
- prettify uesp email thing
- starfield wiki app
- starfield map

app:
- cross platform
- cross wiki
- integrate maps
- "find in page"