## last week

sfwiki:

- fixed content menu having huge long tiles for 1080p screens
- added nefas to partners sidebar
- centred sidebar icons with text, slight padding

gamemap:

- added ad support to gamemap
>> desktop ads are inside the map, but below the watermark
>> mobile ads offset the whole map upwards, and separate from it
- customisable in mapconfig
- ad script doesnt load if user is logged in && editor
- couple misc user requested skyrim map icons/templates
- some work merging sfmap client into gamemap
## todo

- do svelte:header tags for discord-like embeds for maps (include current map image, title and stuff)
- get mobile ad layout working
- ad ads to all the other maps
- get sf ads working
- dehardcode border radius from padding (radius css vars, to allow square for starf)
- refactor fonts to be inside each /map config folder (uesp maps and starfield maps have different fonts)
- title font should just be title.ttf (for "UESP" brand at bottom)
- link up MAP WORLD NAME (UESP) to mapconfig wiki name (or have it blank if none provided)
- support negative world bounds (make starfield not upside down)
- make feedback support link optional, if not provided, support button doesnt appear
- make wiki title in infobar optional
- allow manual coordinate entry for markers

- benefactor of imperial library expressed interest in being a part time product manager for uesp
- what does akb actually do? as a job
- ask dave did he get prior knowledge of tes:castles, what the story is there


- do flutter training course
- update mobile app by november 1st

## todo maps (future)
- skyrim minecraft map thing
- cave interior maps for skyrim, ob, mw
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- some kind of tutorial on first non-cookie load to tell user how to use ui
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/
- allow shiftclick/ctrl click to add/remove vertices
- use quadtrees as map optimisation
- better layer toggles menu:
https://cdn.discordapp.com/attachments/1108392138019971164/1157007429222027304/image.png?ex=65170aa3&is=6515b923&hm=1154a1e7c990396188050f054b03e026ae8810bbfec4b84efd3a962197b4ae30&
- ask dave: integrate analytics into individual map features (edit templates) to see how often they are used?


## todo future general
- wiki features (hybrid news etc)
- prettify uesp email thing
- starfield wiki app

app:
- cross platform
- integrate maps
- cross wiki
- "find in page"