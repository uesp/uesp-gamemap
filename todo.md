## last week:

- got world editing done, began on locations ui, other misc stuff

## world editing:
- all fields work and display on live correctly when saved
>> there were some issues before (like stormhaven) but fixed now
>> makes use of svelte live magic, save a world, exit out of it, and the name updates
>> doesn't update the world name live as you're editing, although it could

## misc:
- error state for save button (shakes "no" when error and turns orange)
- added delete queries (dont work yet)
- change cursor to "not allowed" when editing world to indicate world cannot be used
- allow edit pane to be resized (from original figma concept)
- aligned all text boxes to be the same width to look better
>> users chosen size gets saved
- began working on location edit ui
- "current zoom" field in location display level updates automatically with current zoom, doesn't on live

## problems:
- need help fixing permissions error on localhost
- should all locations have an "area" checkbox?

ask proventus student position uesp

``Could you ask dave about me?``
``say im interested in learning it and stuff``

``Just mention about Proventus/Imperialbattlespire being curious about the job, and that I'm willing to learn starting next month, and how I'll have the whole summer to focus on it``
``Like so I can proper grind at it``

# on taking holiday next two weeks:

rita will be working from home so i think the plan is i will too






## dave stuff:

- 32px skyrim skyrim icons
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing


## todo


- make description box that has some text in it simulate focus and left arrow press to expand box, then defocus
- convert eso and dawnstar to psueodo normalised in mapconfig
- make eso only one with custom css as the rest use yellow anyway

- alphabeticise map key ui
- hamburger for search bar to show other maps
- cell resource state from url
- do get centre of polygon to count towards isvisible
- add allow long clicking on mobile to open popups
- fix requesting /null in layerbutton
- fix polylines not respecting zoom levels
- make leaflet popup wikilinks turn black if there's no href
- add permalink option in location popups
- redesign location popups
- fix polygons disappearing when outer points are not viewable (consider centre point as well)
- make embeded map watermark actually open in new tab
- fix maps not being centred properly on load
- fix tooltip text: wikilink and detail not being put on separate lines
- make labels clickable
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- sr icons higher res
- fix all markers showing up at initial load on highest zoom level
- button to go to the map menu
- separate mods from offical maps
- make maps in game release order

feedback:
- map key alphabetical
- map key not nearest neighbour
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