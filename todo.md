## last week

final polish and bugfixing before release

## polish
- added ability to shift click other locations while editing existing ones to jump to editing them
>> if unsaved changes on the current one, will warn you first
- added double click to edit on locs
- made middle click on article button open in new tab
- middle click on location/world list items opens them in new tab too
- make max zoom of all locations -0.5 on all locations client side
- fix pip on layer switcher being disconnected
- made centre on check world param (so world=stormhaven&centeron=blackwood fails, as expected)

## bug fixes
- fixed tooltips getting in the way when dragging markers
- fixed worlds still having the "editing" tag added after cancelling (going back into worlds was showing edit menu)
- fixed opening colour picker on blobs with null colours setting the colour to a bright blue
- fixed popups getting in the way when editing worlds
- fixed pressing esc bugging out dialogs
- fixed editing worlds not locking the map properly
- fix edit templates not showing up for adding new locations
- fixed performance issues in world dropdown list
- fixed an issue where the map would zoom all the way when going up from a bigger map than the parent
- fixed map position changing/animating when switching maps (it looked cool but was a bug)
- fixed rare issue where some locs wouldnt appear when centering on them
- fixed small issue where the map would move when changing layers near the bounds of the map
- fixed links on gamemap.uesp.net help dialog still being garbled up

## todo

- double markers for reverted locations

- fix layers in layer switcher not lining up when switching between wolds

- fix cell resource colour intensity to make sense. deeper the colour the more stuff
- fix losing grid on resize
- cell resource state in/from url
- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af on firefox when zooming out
- fix darker blocks in grid for sr going off by one at the ends

- test editing in worlds, locs, eso problematic worlds
- test polygons, lines

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