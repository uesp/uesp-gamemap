## last fortnight

various bits and bobs: gamemap fixes, app fixes, brief sfwiki stuff

how was your holiday? where did you go

## gamemap
-------------------------------------------------------------
### technical
- merged vality into master (lots of merge conflicts so stuff might be missing)
- updated readme with build instructions (setting up localhost server and stuff)

### polish
- updated wiki map pages with help from dcsg
>> made help link open wiki page in new tab instead of dialog, as all the info is on there now
>> this was also to get around the link garbling bug with the dialogs
- made "name" field auto focus when adding locations
- made goto article button show if there's wikipage available, not just if there's multiple worlds (affects mw map, tr)
- added &search param in url (a couple wiki map links had them)
- fixed negative IDs being obnoxious to enter in editor

### bug fixes
- fixed missing icons / 404 on SR
- fixed glitchiness with popups opening
- fixed searching for locations always doing network request even if cached
- if zoom isnt provided in url, then default to max zoom (fixes some map links on the wiki)
- fixed gamemap not loading on steam embedded browser
- fixed wiki page field collapsing if field is identical to display name (now only collapses on switch click)
- fixed /null being requested (404) in OB/MW from the layer buttons
- fixed world= param not respecting display names (fixes a few wiki map links)


## todo

- comment/refactor gamemap js
- organise/refactor app.css

- doo app styff
- wiki upgrade broke galleries on the app, skyrim:skyrim and other pages with lots of images make text go squished

- start sf wiki design figma

## app
---------------------------------------------------------------



## sfwiki
---------------------------------------------------------------

- show designs and stuff
- have you considered calling it constellation wiki?

----------------------------------------------------------------
- signal stuff
prepare for performance review, make notes
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
- integrate maps
- cross wiki
- "find in page"