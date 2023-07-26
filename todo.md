## last week

final polish and bugfixing before release

## polish
- added ability to shift click other locations while editing existing ones to jump to editing them
>> if unsaved changes on the current one, will warn you first
- added double click to edit on locs
- made middle click on article button open in new tab
- middle click on location/world list items opens them in new tab too
- make max zoom of all locations -0.5 on all locations client side

## bug fixes
- fixed tooltips getting in the way when dragging markers
- fixed worlds still having the "editing" tag added after cancelling (going back into worlds was showing edit menu)
- fixed opening colour picker on blobs with null colours setting the colour to a bright blue
- fixed popups getting in the way when editing worlds
- fixed pressing esc bugging out dialogs
- fixed editing worlds not locking the map properly
- fix edit templates not showing up for adding new locations
- fixed performance issues in world dropdown list

## todo

- fix clicking out while zoomed in zooming in to parent map as well

- make iconbar and resizing dynamic, dont rely on css for mobile mode, do it in javascript based on map size

- do common.js getIcon() for worlds,locations, to switch between actual icon, polyline, area, world, and point
to be consistent icons (an area doesnt make sense to have a pin icon)

- do centreon with checking world?= as well
- cell resource state in/from url

- double markers for reverted locations

- fix losing grid on resize

- fix pip on layer switcher ui being small
- fix small line on layer switcher (e.g. eso layers)

- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af on firefox when zooming out
- fix darker blocks in grid for sr going off by one at the ends

- fix cell resource colour intensity to make sense. deeper the colour the more stuff

- links on devgamemap.uesp.net help dialog fugged up

- make readme on how to create the favicon styles for maps for future developers

- organise app.css and comment gamemap js

- comment/refactor all code

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
- bug: right clicking locations opens in new tab

## todo future general
- wiki features (hybrid news etc)
- prettify uesp email thing
- starfield wiki app
- starfield map

app:
- wiki upgrade broke galleries on the app, skyrim:skyrim and other pages with lots of images make text go squished
- cross platform
- cross wiki
- integrate maps
- "find in page"