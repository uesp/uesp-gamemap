## last fortnight

how was your holiday? where did you go

various bits and bobs, some gamemap fixes, designed some starfield wiki stuff

## gamemap

- merged vality into master (lots of merge conflicts so stuff might be missing)
- updated readme with build instructions (setting up localhost server and stuff)
- fixed missing icons / 404 on SR
- updated wiki map pages with help from dcsg
>> made help link open wiki page in new tab instead of dialog, as all the info is on there now
- made "name" field auto focus when adding locations


## app
## sfwiki


## todo

- wiki page field collapsing if text is identical to name (only collapse on switch click or null/blank)
- add &search query param compatibility

- fix flash loading maps from centeron


- fix getlocation always doing network request instead of local

- make getworld do both network and local and toast if invaliid
- make world param also work with displayName (search displayName and return world)


- if url has xy but no zoom, do max zoom



- organise app.css and comment gamemap js
- comment/refactor all code

- doo app styff

- wiki upgrade broke galleries on the app, skyrim:skyrim and other pages with lots of images make text go squished


- start sf wiki design figma

## todo maps (future)
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