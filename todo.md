## last week:




## editing
- loctype switcher is now no longer destructive (it only changes loctype, doesnt affect data)




## technical:
- attempting a data-based approach to editing, rather than just editing the marker element itself
- every time you edit, you modify the actual location object, and the marker just gets redrawn based on that
- flattened location class (all displayData stuff is in root of object)
- refactored world list to be map object, increase performance across the board



## bug fixes:

- fixed not being able to zoom past X.97
- fixed location disappearing after editing
- fix long lag for locations that link to other locations within the same map (solitude castle western skyrim)



## random stuff

- out of curiosity how much has been made on donations on the uesp app?



## todo



- merge display and style into teh same thing
- preview colour component

- make close button in edit panel always close the panel regardless of direct edit or not

fix markers not being visually saved after save

- add tutorial message for draging markers and edit handles like live
- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- convert eso and dawnstar to psueodo normalised in mapconfig
- hamburger for search bar to show other maps
- cell resource state from url
- fix zoom levels stopping at x.97 instead of going all the way
- allow both edit polygon and drag at same time
- add allow long clicking on mobile to open popups
- add zoom/pan in effects for markers when editing
- fix centreon going to the wrong place
- fix clicking out while zoomed in zooming in to parent map as well
- fix type:blah not working after the icon list to map change
- fix oblivion icons being inconsistent (some discovered, some undescovered - use map marker overhaul for custom icons)
- fix requesting /null in layerbutton
- add permalink option in location popups
- fix editing skyrim map adds locations to eso map
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
- button to go to the map menu
- fix pip on layer switcher ui being small
- button to go up a map, right click isnt intuitive
- make readme on how to create the favicon styles for maps for future developers
- make maps in game release order
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