## last week


## bug fixes:
- fixed "Orphaned maps" (maps without a parent) header showing up when there isnt any
- fixed back/close button on edit pane not cancelling new marker properly
- fix position not updating as you move markers around
- fixed the unsaved indicator (*) hanging around after you click cancel
- fixed polygons flashing when moving points
- fixed green "+" not visible in polygons
- restored double click to pan
- fixed RC list overflowing at the bottom
- fixed "null" appearing in popups/tooltips when descriptions were empty
- fixed popups not working when wiki links were null
- fix inane bug causing locations outside of the map (negative x, y) to disappear, even when inside map view, because javascript was turning the coord pairs into strings(??) and breaking the bounds calculation, because -0.20 is not more than "-0.40"
- fixed new locations rounding up their display levels (3.5 > 4.0) which was causing new locations to disappear upon refresh (now rounds down to nearest integer, aka 3.0)

## polish:
- got dawnstar map done
- removed loctype switcher as it was causing issues (also conceptually changing from a single point to a line live didnt really work that well)
- move label direction up to "general" for ease of access
- recent changes automatically updates on save/delete, so it's "live"
>> if anyone adds stuff when it's refreshed, it isnt added to the local cache, so navigating to new locations will say they dont exist
- fix editor title not changing from "adding location" to "editing location" after save

## technical
- merged editor panel and editor content (actual forms and stuff) component files into just one "editor.svelte"




## todo
- finish colour preview thing
- fix updating polygon colour doesnt change poly colour
- fix moving map on add location adds double location and cant move location anymore

- get dialogs working
- fix drawing line not working (sets as marker)

- fix markers carying over between maps

- fix focus on svelte elements mean cant move map (mobile specifically)

- fix loading into new worlf while zoomed in not removing old locations
- fix wiki name switch not switching

- fix on edit: adding identical icon when map move on top of added/adding icon

- the location coord mismatch is happening because you are converting a new location's coords based on the current world's dimensions
>> need to find a way to pass location.js reference to the current world

- add strok width for normal and hover
- get default stroke widths working for adding default polygon (black outline)
- get colour code changing whenever user moves coloru swatch
- and get colour changing whenever user types in different colour

- fix clicking X button "saving" changes unlike cancel button


- deleting markers still adds edit-version marked with "click to drag" back to map on map move

- fix slow zooming on macbooks and laptops with pinch zoom gestures (NOT normal scroll gestures)
- shift click on other locations while unsaved changes should immediately change to edit it


- reimplement eso-specific name shortcuts for locations
- also ask feedback to map editors for the above


- fix having to load new world once, then click RC item again to jump to centre of it

if adding location, save will dismiss the editor window
if adding location, close button is always "cancel"


- fix cant set new marker to "none" / dropdown always selecting "none" on first load on any edit

- if parent id for world is -1, consider it null
- also reflect this in saving
- get live editing working for worlds as well


- add quick toggles for areas, "is zone" to get rid of outline for eso


- -0.5 on all locations client side

- reminder about skyrim/beyond skyrim/solstheim tiles from BS guy



- preview colour component

- make close button in edit panel always close the panel regardless of direct edit or not

- fix not being able to click location dropdown while it's open to close it

- make iconbar and resizing dynamic, dont rely on css for mobile mode, do it in javascript based on map size

- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- hamburger for search bar to show other maps
- cell resource state in/from url
- add allow long clicking on mobile to open popups
- add zoom/pan in effects for markers when editing

- make editing polygons always the same colour (blue)

- fix centreon going to the wrong place
- fix clicking out while zoomed in zooming in to parent map as well
- fix type:blah not working after the icon list to js map change
- fix requesting /null in layerbutton
- add permalink option in location popups
- redesign location popups (add icon in circle in popup, with title and info to the right of it)
- add middle click event listener to button and listItem
>> allow middle click to open in new tab for goto article button
>> and add middle click on listitems to open in a new tab w/ centreon link
- fix recent changes list overflowing downwards
- fix location list dropdown not being centred properly
- fix live edit on world name location switcher
- fix live edit on worlds (every change changes the current world in map object)
- refactor gamemap.js to Gamemap.svelte and use realtime svelte features
- make embeded map watermark actually open in new tab
- cache world list for location switcher in svelte stores
- make going to location centre zoom dynamically instead of always zoom level 5
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix double click to pan on ui elements (zoom, search bar)
- fix maps with multiple worlds being reset if you pass just the world name and not pass x/y or zoom params
- on mobile, double tap icon to open its popup
- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af when zooming out
- add riseOnHover to icon labels when hovering over
- shift click in RC to travel to and edit world/location
- make tooltips follow the mouse rather than the centre of the location
- show more columns on map key menu dynamically
- fix cell resource colour intensity to make sense. deeper the colour the more stuff
- shower thought: could we use the "Dev/Beta" versions of maps for eso as separate layers?
- button to go to the map menu
- fix pip on layer switcher ui being small
- button to go up a map, right click isnt intuitive
- make readme on how to create the favicon styles for maps for future developers
- make maps in game release order
- use similar centre of polygon algorithm as leaflet does for locations/latlng conversion

- Skyrim and Solstheim at 512 x 512 per cell
> https://drive.google.com/drive/folders/1jfzur-HgTd5Dwim02OwSrlBbsXQa5ltb?usp=drive_link

## todo maps (future)
- skyrim minecraft thing
- cave interior maps for skyrim, ob, mw
- some kind of tutorial on first non-cookie load to tell user how to use ui
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- localisations for maps (local json and server database)
- an undo button for deleting/editing locations and worlds
- maybe refactor to divicon to allow drag by label
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/
- allow shiftclick/ctrl click to add/remove vertices
- be able to search the icon list in editor

## todo future general
- wiki features
- email thing
- starfield wiki app
- starfield map

app:
- cross platform
- cross wiki
- integrate maps
- "find in page"