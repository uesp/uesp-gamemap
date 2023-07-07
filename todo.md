## last week

- ask dave does he prefer cliffnotes of stuff done or detailed line by line like usual


## editing
- added the edit history feature for worlds/locs
- added the edit templates/suggestions feature

## edit templates
- templates are declared in mapconfig
- imported all  old ones
- when user types in the right name "chest" (case insensitive) a prompt asks whether they want to fill in the info from the template
- also added a new one, "zone", for adding new cities/zones as the default one with hard outline is annoying to remove each time

technical info:
>> each template is sorted under mapconfig.editTemplates[objectType][objectName]
>> where object type is whether it is a location or world ("location", "world") and the latter is just the name
>> means you can declare templates for both worlds and locations separately per map
>> to do the dynamic stuff like get world max/min zoom, and arbitary +/-, any prop that begins with "$" will get executed as eval(javascript code)

## polish
- made the name of the location/world in the editor titlebar update live as you type
- fixed small padding offset for recent changes list on open

## bug fixes
- toFixed(3) all output to server for displayData and xy
- fixed being able to close the editor while adding a new marker
- fixed not being able to centre on paths (error/hang)
- fixed locations not loading on mobile
- fix div by 0 causing map not to load when x or y was 0
- fixed page hanging if you tried to add a location when locations werent loaded yet
- fixed forms not updating when data remotely changed (was preventing editable coordinates working)
- fixed icon dropdown defaulting to "none" even if icon selected
- fixed not being able to select "none" to remove the icon because of the above bug

# questions
is having a request to the server each time you edit a loc/world going to be a problem?

## problems / reminders

- reminder about skyrim/beyond skyrim/solstheim tiles from BS guy
- Skyrim and Solstheim at 512 x 512 per cell
> https://drive.google.com/drive/folders/1jfzur-HgTd5Dwim02OwSrlBbsXQa5ltb?usp=drive_link
- wiki upgrade broke galleries on the app, skyrim:skyrim and other pages with lots of images make text go squished


## todo

- get dialogs working

- fix focus on svelte elements mean cant move map (mobile specifically)
>> try re allowing map panning on the "zoom" or "move" events

- fix wiki name switch not switching

- the location coord mismatch is happening because you are converting a new location's coords based on the current world's dimensions
>> need to find a way to pass location.js reference to the current world

- remember last icon used in the editor and auto select it next time

- do edit templates for dawnstar per dcsg asked

- direct edit "close" button isnt closing whole panel as expected
- fix clicking X button "saving" changes unlike cancel button

- deleting markers still adds edit-version marked with "click to drag" back to map on map move

- fix line colour preview showing fill colours from area

- shift click on other locations while unsaved changes should immediately change to edit it

- fix being able to close editor panel while in "add marker" mode
- reimplement eso-specific name shortcuts for locations
- also ask feedback to map editors for the above

- double clicking markers that arent clickable edits them
- fix having to load new world once, then click RC item again to jump to centre of it

if adding location, save will dismiss the editor window
if adding location, close button is always "cancel"


- remove edit history being clickable with ripple

- fix cant set new marker to "none" / dropdown always selecting "none" on first load on any edit


- make map lock for editing worlds actually work (no zooming allowed)
- get live editing working for worlds


- fix colour picker default colour to something sensible instead of the blue

- -0.5 on all locations client side

- show "position" in info when marker being added


"goto article" button doesnt update when world wiki link updated

- fix RC inconsistently being resized after coming back from editing location
- fix RC not going all the way down on initial edit pane open
- make "grouped/abc" symmetrical

- make close button in edit panel always close the panel regardless of direct edit or not

- fix not being able to click location dropdown while it's open to close it

- make iconbar and resizing dynamic, dont rely on css for mobile mode, do it in javascript based on map size

- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- cell resource state in/from url
- add allow long clicking on mobile to open popups
- add zoom/pan in effects for markers when editing

- if location list button is overflowing, show the name of the world insated of "show location list"

- add tooltip to editor back button/ close button "Back" "Close"
- make editing polygons always the same colour (blue)

- fix centreon going to the wrong place
- fix clicking out while zoomed in zooming in to parent map as well
- fix type:blah not working after the icon list to js map change
- fix requesting /null in layerbutton
- redesign location popups (add icon in circle in popup, with title and info to the right of it)
- add permalink/centre option in location popups
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
- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af when zooming out
- shift click in RC to travel to and edit world/location
- make tooltips follow the mouse rather than the centre of the location
- show more columns on map key menu dynamically
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