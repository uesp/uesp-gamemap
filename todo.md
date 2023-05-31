## last week:



## polish:

- made map key and icons ABC
>> done on the client side using a JS map, so the mapconfig icons list remains a simple object for readability
- made all skyrim icons HD
- added BS icons to beyond skyrim map (along with HD skyrim icons)
- added display levels to BS map (werent before)


## bug fixes:
- fixed marker icons not being centred (chests, lorebooks)
- fixed icons being squished/stretched in map key and editor icon chooser (noticeable on skyrim icons)
>> also improves support for maps with varying icon resolutions (eso, skyrim)
- made popup links turn black if there's no href


## todo





- whenever move, iterate through location list not marker list

- make close button in edit panel always close the panel regardless of direct edit or not

- fix skyrim big lags
>> probably iterate through world location list to only add the ones currently visible rather than adding all and removing them after

fix polygons/icons disappearing after edit
fix markers not being visually saved after save

- add tutorial message for draging markers and edit handles like live
- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- convert eso and dawnstar to psueodo normalised in mapconfig
- hamburger for search bar to show other maps
- cell resource state from url
- allow both edit polygon and drag at same time
- add allow long clicking on mobile to open popups
- zoom/pan in effects for markers when editing
- fix centreon going to the wrong place
- fix requesting /null in layerbutton
- add permalink option in location popups
- editing skyrim map adds locations to eso map
- redesign location popups
- fix edit panel not animating close properly
- fix recent changes list overflowing downwards
- fix location list dropdown not being centred properly
- make polygon edit handles have high zindex
- make embeded map watermark actually open in new tab
- fix edit pane causing iconbar to overlap
- make going to location centre zoom dynamically instead of always zoom level 5
- add continuous zoom, markers popup on zoom rather than zoomend
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix double click to pan on ui elements (zoom, search bar)
- fix maps with multiple worlds being reset if you pass just the world name and not pass x/y or zoom params
- make tooltip follow mouse cursor instead of centre
- fix handling of small icons like 16p when rest of map is 32px (centre them properly)
- on mobile, double tap icon to open its popup
- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af when zooming out
- add riseOnHover to icon labels when hovering over
- make tooltips follow the mouse rather than the centre of the location
- fix all markers showing up at initial load on highest zoom level
- button to go to the map menu
- fix pip on layer switcher ui being small
- button to go up a map, right click isnt intuitive
- disable polygon fade css effect on firefox
- make maps in game release order
- allow shiftclick/ctrl click to add/remove vertices
- maybe refactor to divicon to allow drag by label
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/

## dave stuff:
- cave interior maps for skyrim, ob, mw
- skyrim minecraft thing


feedback:
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