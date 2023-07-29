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
- adjusted SR's cell resource colours to be similar to that of an actual heatmap
- added loading in cell resource state from url
- cached cell resource state in mapState (so toggling grid on/off doesnt cause resources to reload)
- added loading bar when getting cell resources from server

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
- fixed save button displaying wonky on save
- fixed reverted locations duplicating on the map after map move
- fixed current layer not syncing up with the current world when switching between layers
- fixed grid disappearing on resize

## todo

- make redrawing grid better
- fix canvas grid layer being laggy af on firefox when zooming out
- fix darker blocks in grid for sr going off by one at the ends

-  make sure the new maps can handle "old" style map links as best as possible, especially for ESO, for example:
https://esomap.uesp.net/esomap.html?world=246&x=394043&y=580689&zoom=11


https://gamemap.uesp.net/eso/?world=246&x=394043&y=580689&zoom=11
Dave (UESP) — Today at 17:53
the latter as I'm doing right now
For all maps, I'd check if the zoom level was greater than the allowed range. If it was I'd transform it down to the 0-based zoom level.
For ESO map, I'd check if the coordinates were greater than 1 and if so divide both by 1,000,000

Note: If you try to load a map that doesn't exist it just says "Loading world...." forever.
Would be nice if it errors out or something.
https://gamemap.uesp.net/ob/?world=shiriasdasd

If you want to test the redirects you can modify your host file with the following entries:
107.161.64.232 dbmap.uesp.net
107.161.64.232 srmap.uesp.net
107.161.64.232 esomap.uesp.net
107.161.64.232 mwmap.uesp.net
107.161.64.232 obmap.uesp.net
107.161.64.232 simap.uesp.net
107.161.64.232 bsmap.uesp.net

 RewriteEngine On
        RewriteRule ^(.*)$ https://gamemap.uesp.net/ob/?world=shiveringisles&legacy=true [R=301,L,QSA]

- Also just noticed: If I add a new location, then un-check the "Use Name as Wiki," but the name of the wiki is similar, so I type in the name into the wiki block, the toggle auto re-checks, so I can't edit it. For example, I'm adding a book, "The Impresario's Catalogue" to the Impresario's site in Vvardenfell. The name of the wiki for this book is "The Impresario's Catalogue (book)", so, as soon as I type (or copy and paste) "The Impresario's Catalogue" into the wiki block, intending to add " (book)" to the end, the wiki toggle auto re-checks, so I can't edit it. I have to turn the toggle off, type something completely different, then edit it to the real entry "The Impresario's Catalogue (book)".  I hope my rambling made sense.

- test stuff on firefox

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