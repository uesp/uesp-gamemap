## last week

## polish
- added ability to shift click other locations while editing existing ones to jump to editing them
>> if unsaved changes on the current one, will warn you first
- added double click to edit on locs
- made middle click on article button open in new tab
- middle click on location/world list items opens them in new tab too

## bug fixes
- fixed tooltips getting in the way when dragging markers
- fixed worlds still having the "editing" tag added after cancelling (going back into worlds was showing edit menu)
- fixed opening colour picker on blobs with null colours setting the colour to a bright blue
- fixed popups getting in the way when editing worlds

## todo

- fix lag in opening big search results (use virtual list)

- fix escape key bugging out dialogs
>> also make sure you cant escape out of dialogs that are dismissible false

- make map lock for editing worlds actually work (no zooming allowed)


- make max zoom of all locations -0.5 on all locations client side

- fix location dropdown being laggy on open, remember existing location data somehow
>> laggy because it's calculating the groups and abc every time you open it

- fix not being able to click location dropdown while it's open to close it

- make map key grid columns dynamic and fix overscrolling

- make iconbar and resizing dynamic, dont rely on css for mobile mode, do it in javascript based on map size

- do centreon with checking world?= as well
- cell resource state in/from url

- double markers for reverted locations

- fix clicking out while zoomed in zooming in to parent map as well
- fix requesting /null in layerbutton

- fix location list dropdown not being centred properly
- fix losing grid on resize

- ask dave if should remove beta tag before launch
- and then remove it anyway

- do common.js getIcon() for worlds,locations, to switch between actual icon, polyline, area, world, and point
to be consistent icons (an area doesnt make sense to have a pin icon)

- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af on firefox when zooming out
- fix darker blocks in grid for sr going off by one at the ends
- show more columns on map key menu dynamically (refactor styles to grid based)
- fix cell resource colour intensity to make sense. deeper the colour the more stuff
- fix pip on layer switcher ui being small
- make readme on how to create the favicon styles for maps for future developers
- organise app.css and comment gamemap js
- comment/refactor all code
- wiki upgrade broke galleries on the app, skyrim:skyrim and other pages with lots of images make text go squished


## todo maps (future)
- use the "Dev/Beta" versions of maps for eso as separate layers
- skyrim minecraft map thing
- cave interior maps for skyrim, ob, mw
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- some kind of tutorial on first non-cookie load to tell user how to use ui
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/
- allow shiftclick/ctrl click to add/remove vertices
- be able to search the icon list in editor
- use quadtrees as map optimisation

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