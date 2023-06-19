

## last week






## bug fixes

- fixed not being able to add new location on blank worlds (worls that have no locations)


## todo


- add colour preview thing
- fix location position not changing when icon move
- fix updating polygon colour doesnt change poly colour
- fix cant change positions XY and it affects marker live
- fix moving map on add location adds double location and cant move location anymore

- get dialogs working

- fix + missing on green new handle blob


- fix clicking X button "saving" changes unlike cancel button
- fix cell resources menu going the wrong way


- reimplement eso-specific name shortcuts for locations
- also ask feedback to map editors for the above


change "editing location" to "adding location" on add
if adding location, hide delete button
if adding location, save will dismiss the editor window
if adding location, close button is always "cancel"


- fix edit panel not animating correctl
- begin getting add locations working
- fix recent changes list overflowing, not correct height



- add quick toggles for areas, "is zone" to get rid of outline for eso


- 0.5 on all locations client side

- reminder about skyrim/beyond skyrim/solstheim tiles from BS guy

- fix chrome bugging out with target event in gamemap


- preview colour component

- make close button in edit panel always close the panel regardless of direct edit or not

- fix not being able to click location dropdown while it's open to close it

- tamriel, clockwork city and artaeum are missing from aurbis
- "this is a header" spam for location list
- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- convert eso and dawnstar to psueodo normalised in mapconfig
- hamburger for search bar to show other maps
- cell resource state in/from url
- add allow long clicking on mobile to open popups
- add zoom/pan in effects for markers when editing
- check if ddg updated query for "uesp gamemap" to remove devgamemap
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
- make polygon edit handles have high zindex
- refactor gamemap.js to Gamemap.svelte and use realtime svelte features
- make embeded map watermark actually open in new tab
- fix edit pane causing iconbar to overlap
- cache world list for location switcher in svelte stores
- fix "this is a header" for location list
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
- allow both edit polygon and drag at same time
- allow shiftclick/ctrl click to add/remove vertices
- maybe refactor to divicon to allow drag by label
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/
- be able to copy a map pin and place the copy (for those times when you've got three, four, eight of the same sub-quest steps to put on the map)
- be able to use a search function when looking at the list of icons when placing a map pin (for those times when you remember "I think there was an icon with the word 'shrine' in it, but I can't remember what it was." (answer: rededication shrine, for which I have to search the whole list until I see the picture)).


## dave stuff:
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing

https://drive.google.com/drive/folders/1jfzur-HgTd5Dwim02OwSrlBbsXQa5ltb?usp=drive_link
Skyrim and Solstheim at 512 x 512 per cell


feedback:
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