## last week

- added reverting, world deleting, bug fixes

## editing
- shift click on RC items to jump straight to editing them
>> changed from single click like on live as single click to centreon is more consistent
>> works for both worlds and locations
- added reverting
>> clicking an item in edit history will load how it looked in the past
>> everything is locked when reverting, since you cant change how things were in the past
- added world deleting, if mapAdmin
>> guard rails: cant delete the defaultWorldID world specified in mapconfig
>> cant really show without messing stuff up, but deleting world will return you to default world
- added live edit for worlds (finally got around to it)
>> editing maxzoom and stuff updates live
>> fixes a bunch of bugs along with, such as name not being updated in the list, goto wiki page not updating etc

## polish
- made edit history in editor highlight the current revision (changes as you go between older revisions)
- made going into "revert mode" visually different from normal editing to show you cant edit an older revision
- added dialog for revert mode when you already have existing edits (warning to overwrite them)
- made click save/revert close the editor

# bug fixes
- fixed not being able to right click on location list dropdown
- fix performance issues on jumping between locations
- fixed issue where mapState pendingJump would stick around between maps
- fixed popups not showing up consistently when goto locations
- fixed links in help dialog being appended to domain (gamemap.uesp.net/https://www.uesp.net....)
- world edit was using maxY for maxX

# technical
- added a bunch of shortcut functions for getWorldByID as i kept typing them wrong
- tried to revert world being positive, location being negative, but too deeply ingrained now and would take too much time
- simplified the way pendingJumps work (telling the map to jump to a loc after loading a world) a lot
>> all the conversion is done in MapSate class instead of done on initialisation

## dave stuff
- make "revert" a normal user action
- but keep "map admin" as deleting worlds uses it on the client side
- use eso dev maps as separate layers for eso

## todo


- fix reverted locs being added twice on map move


- fix wikilink name being weird (solomon's pinned message)

- add wikiLink switch to location.js and make doLinkWikistuff a const function under location.js which editor svelte uses as well as onSaveQuery()



- do edit templates for dawnstar per dcsg asked


- fix entering negative locIDs for destIDs being obnoxious (entering minus makes it 0)
> Entering negative numbers is most definitely not a fluid, natural function. The computer fights me, enteriong a zero or ignoring the negative sign.
- make adding new location count as unsaved changes (unsaved changes == false or location is unsaved)
>> maybe tweak wording of popup "discard adding new location?"

- shift click on other locations while unsaved changes should immediately change to edit it

- tweak blue marker shading to be smaller

- fix tooltips hanging around when dragging marker

- do some MAPLOCK.isPartial() function

- make waves light/dark configurable by prop (for adding new loc "cancel" button)

- double clicking markers that arent clickable edits them

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

- make map lock for editing worlds actually work (no zooming allowed)

- fix entering negative numbers into the destID being a pain

- fix colour picker default colour to something sensible instead of the blue

- make max zoom of all locations -0.5 on all locations client side

- fix darker blocks in grid for sr going off by one at the ends


- fix high res icons being clipped on icon in ListITem
- fix location dropdown being laggy on open, remember existing location data somehow

- fix not being able to click location dropdown while it's open to close it

- make map key grid columns dynamic and fix overscrolling

- shower thought: could use the "Dev/Beta" versions of maps for eso as separate layers

- make iconbar and resizing dynamic, dont rely on css for mobile mode, do it in javascript based on map size

- cell resource state in/from url

- fix location drifting in craglorn and alikr
- fix description field misbehaving, being too big


- fix clicking out while zoomed in zooming in to parent map as well
- fix requesting /null in layerbutton
- add middle click event listener to button and listItem
>> allow middle click to open in new tab for goto article button
>> and add middle click on listitems to open in a new tab w/ centreon link
- fix location list dropdown not being centred properly
- fix losing grid on resize

- do common.js getIcon() for worlds,locations, to switch between actual icon, polyline, area, world, and point
to be consistent icons (an area doesnt make sense to have a pin icon)

- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af on firefox when zooming out
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