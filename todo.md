## last week
bug bash, finish missing editing features

## bug fixes
- fixed not being able to add new location on blank worlds (worls that have no locations)
- fixed not deleting locations properly ( was using ``delete locations[key]`` instead of ``locations.delete(key)`` )
>> didnt work with negative numbers (-100), so cancelling wasnt working
- therefore fixed cancelling adding marker/location
- fixed map selection menu not working
- fixed cell resource dropdown being aligned the wrong way (was going off the screen)
- fixed icon bar buttons overlapping when edit panel was open
- fixed float imprecision bug causing some locations to disappear when visible
- fixed locations/markers descriptions and names being saved as the string "null" when empty

## polish
- restore map load animation (slow background fade)
- fixed edit panel not animating correctly (didnt slide shut)
- markers that are being edited now have "click to drag" tooltip as a mini tutorial

## technical
- upgraded to svelte 4, which came out last week
>> should result in smaller bundle size
- converted eso over to coordType "pseudo_normalised" (before was just hardcoded to check for eso)
- refactored isVisible algorithm slightly to search for centre coordinate of polygon first rather than outside points

## todo
- add colour preview thing
- fix location position not changing when icon move
- fix updating polygon colour doesnt change poly colour
- fix cant change positions XY and it affects marker live
- fix moving map on add location adds double location and cant move location anymore

- get dialogs working

- fix focus on svelte elements mean cant move map (mobile especially)

- fix loading into new worlf while zoomed in not removing old locations

- fix on edit: adding identical icon when map move on top of added/adding icon

- fix + missing on green new handle blob

- the location coord mismatch is happening because you are converting a new location's coords based on the current world's dimensions
>> need to find a way to pass location.js reference to the current world

- fix clicking X button "saving" changes unlike cancel button
- fix cell resources menu going the wrong way


- reimplement eso-specific name shortcuts for locations
- also ask feedback to map editors for the above

- fix double click to pan not working

change "editing location" to "adding location" on add
if adding location, hide delete button
if adding location, save will dismiss the editor window
if adding location, close button is always "cancel"


- fix recent changes list overflowing, not correct height


- use similar centre of polygon algorithm as leaflet does for locations/latlng conversion
- add quick toggles for areas, "is zone" to get rid of outline for eso


- 0.5 on all locations client side

- reminder about skyrim/beyond skyrim/solstheim tiles from BS guy

- fix chrome bugging out with target event in gamemap


- preview colour component

- make close button in edit panel always close the panel regardless of direct edit or not

- fix not being able to click location dropdown while it's open to close it

- fix num up and down things appearing on floats or on invis numbers on chrome


- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- convert eso and dawnstar to psueodo normalised in mapconfig
- hamburger for search bar to show other maps
- cell resource state in/from url
- add allow long clicking on mobile to open popups
- add zoom/pan in effects for markers when editing
- fix centreon going to the wrong place
- fix clicking out while zoomed in zooming in to parent map as well
- fix type:blah not working after the icon list to js map change
- fix requesting /null in layerbutton
- add permalink option in location popups
- redesign location popups (add icon in circle in popup, with title and info to the right of it)
- fix edit panel not animating close properly
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
- make tooltips follow the mouse rather than the centre of the location
- show more columns on map key menu dynamically
- fix cell resource colour intensity to make sense. deeper the colour the more stuff
- shower thought: could we use the "Dev/Beta" versions of maps for eso as separate layers?
- button to go to the map menu
- fix pip on layer switcher ui being small
- button to go up a map, right click isnt intuitive
- make readme on how to create the favicon styles for maps for future developers
- make maps in game release order

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