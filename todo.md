## last week



# bug fixes:
- fixed not being able to right click on location list popup

## todo

- get popups working again

- map by release date

- eso antiquity icon

- fix jumping to location


- refactor tabbars to their oown components
- add tabs to appbar for editing objects "Edit    |      History"
- make tabbars centred again (location list)
- make tabbars flush with appbar
- add support for reverting


- add wikiLink switch to location.js and make doLinkWikistuff a const function under location.js which editor svelte uses as well as onSaveQuery()

- add live edit to worlds

- if is map admin, (check in mapconfig), then enable delete world in world edit


- do edit templates for dawnstar per dcsg asked

- make centring on locations open their popups

- fix entering negative locIDs for destIDs being obnoxious (entering minus makes it 0)
> Entering negative numbers is most definitely not a fluid, natural function. The computer fights me, enteriong a zero or ignoring the negative sign.
- revert the negative loc id/world id stuff
- make adding new location count as unsaved changes (unsaved changes == false or location is unsaved)
>> maybe tweak wording of popup "discard adding new location?"

- getjson post for greymoor caverns blackreach

- fix line colour preview showing fill colours from area

- shift click on other locations while unsaved changes should immediately change to edit it

- tweak blue marker shading to be smaller

- fix tooltips hanging around when dragging marker

## poke dave about

- delete bangkorai test
- Exovian (TR editor) wants gamemap edit access
- use eso dev maps as separate layers for eso

- do updated skyrim/beyond skyrim/solstheim tiles from BS guy
https://drive.google.com/drive/folders/1jfzur-HgTd5Dwim02OwSrlBbsXQa5ltb?usp=drive_link

-----------------------------------------------

- do some MAPLOCK.isPartial() function

- make waves light/dark configurable by prop (for adding new loc "cancel" button)


- double clicking markers that arent clickable edits them
- fix having to load new world once, then click RC item again to jump to centre of it

- make shit clicking RC items go straight to editing them
if adding location, save will dismiss the editor window
if adding location, close button is always "cancel"

- reduce size of blue blob effect
- fix tooltips not going away

- click thing in edit history, prompt to revert, then do network call (ask dave to implement backend)

- fix lag in opening big search results (use virtual list)

- fix escape key bugging out dialogs
>> also make sure you cant escape out of dialogs that are dismissible false

- be able to hotswap to edit different locations with popup edit or shift edit, as long as not unsaved or not new location

- make clicking save dismiss editor

- make map lock for editing worlds actually work (no zooming allowed)
- get live editing working for worlds


- fix colour picker default colour to something sensible instead of the blue

- make max zoom of all locations -0.5 on all locations client side


- return locationID to positive an world to negative
- change ui to have "world/location" switch under icon for destID

"goto article" button doesnt update when world wiki link updated

- make "grouped/abc" symmetrical


- fix high res icons being clipped on icon in ListITem
- fix location dropdown being laggy on open, remember existing location data somehow

- fix not being able to click location dropdown while it's open to close it

- make map key grid columns dynamic and fix overscrolling

- shower thought: could use the "Dev/Beta" versions of maps for eso as separate layers

- make iconbar and resizing dynamic, dont rely on css for mobile mode, do it in javascript based on map size

- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- cell resource state in/from url
- add zoom/pan in effects for markers when editing


- fix description field misbehaving, being too big


- fix centreon going to the wrong place
- fix clicking out while zoomed in zooming in to parent map as well
- fix requesting /null in layerbutton
- add middle click event listener to button and listItem
>> allow middle click to open in new tab for goto article button
>> and add middle click on listitems to open in a new tab w/ centreon link
- fix location list dropdown not being centred properly
- fix live edit on world name location switcher
- fix live edit on worlds (every change changes the current world in map object)
- make embeded map watermark actually open in new tab
- make going to location centre zoom dynamically instead of always zoom level 5
- add way to show popups on centreon, optional param
- fix losing grid on resize

- do common.js getIcon() for worlds,locations, to switch between actual icon, polyline, area, world, and point
to be consistent icons (an area doesnt make sense to have a pin icon)

- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af on firefox when zooming out
- shift click in RC to travel to and edit world/location
- show more columns on map key menu dynamically
- fix cell resource colour intensity to make sense. deeper the colour the more stuff
- fix pip on layer switcher ui being small
- make readme on how to create the favicon styles for maps for future developers
- organise app.css and comment gamemap js
- comment/refactor all code
- wiki upgrade broke galleries on the app, skyrim:skyrim and other pages with lots of images make text go squished




## todo maps (future)
- skyrim minecraft map thing
- cave interior maps for skyrim, ob, mw
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- some kind of tutorial on first non-cookie load to tell user how to use ui
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/
- allow shiftclick/ctrl click to add/remove vertices
- be able to search the icon list in editor

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