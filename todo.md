## last week

fixed last remaining editor bugs, editing features, and shortlived editor beta

first, a question

- ask dave does he prefer cliffnotes of stuff done or detailed line by line like usual
- because theres a lot to talk about in this one

## editing
- added the edit history feature for worlds/locs
- added the edit templates/suggestions feature
- add confirmation dialogs for deleting and quitting unsaved changes
>> had to redo the way dialogs worked, becaue the material library im using doesn't really work well with svelte/procedurally called dialogs (stuff like the delete dialog requires a callback, older dialogs were just "show and done")
>> now using native <dialog> elements with the same styling from before. looks same, behaves slightly different

## edit templates
- templates are declared in mapconfig
- imported all  old ones
- when user types in the right name "chest" (case insensitive) a prompt asks whether they want to fill in the info from the template
- also added a new one, "zone", for adding new cities/zones as the default one with hard outline is annoying to remove each time

technical info:
>> each template is sorted under mapconfig.editTemplates[objectType][objectName]
>> where object type is whether it is a location or world ("location", "world") and the latter is just the name
>> means you can declare templates for both worlds and locations separately per map
>> to do the dynamic stuff like get world max/min zoom, and arbitary +/-, any prop that begins with "$" will get executed as eval(javascript code)

## bug fixes
- toFixed(3) all output to server for displayData and xy
- fixed not being able to centre on paths (error/hang)
- fixed locations not loading on mobile
- fix divide by 0 causing map not to load when x or y was 0 (prevented oblivion map loading)
- fixed page hanging if you tried to add a location when locations werent loaded yet
- fixed forms not updating when data remotely changed (was preventing editable coordinates working)
- fixed icon dropdown defaulting to "none" && not scrolling down to selected icon
- fixed not being able to select "none" to remove the icon because of the above bug
- fixed weird bug making RC list disappear on chrome

## polish
- made the name of the location/world in the editor titlebar update live as you type
- fixed small padding offset for recent changes list on open
- fixed being able to close the editor while adding a new marker
- fixed wiki switch not switching
- aligned content of dialogs (text) with buttons below

# questions / problems / suggestions

- is sending a request to the server each time you edit a loc/world going to be a problem? (edit history)

> Was thinking recently of having a revert feature on the editor but didn't want to mention anything at the time to avoid delaying the existing work.
> Would probably add a "mapadmin"  permission and only permit reverts for mapadmins.
> You already have a list of recent revisions on the location edit screen. Add a "revert to" button or right click or something.
> Would need a server action, "revert_world" and "revert_location" or something. Takes a location/world ID to revert and a revision number to revert to.

> Tried to figure out why but didn't see an obvious pattern. X values look to be decreased by a value of 0.875, y values increased by 1.43 or something.

maybe a simplified revert feature?

if server receives location data with already existing revID, then it ignores the rest of the data and reverts the location to that revisionID

RC shows new editAction "Reverted" and edit comment is something like "reverted to rev ### as of {timestamp}"

as far as client is concerned, it is saving using set_loc/set_world same as normal. just using the save button.

or you could implement the above revert_loc stuff but just redirect any set_locs/worlds to that if they use an old revID. don't want to spent much time on UI for this in order to get bugs done

## editor beta postmortem:

- gamemap.uesp.net on firefox was not loading locations
- on chrome, it was showing locations, but only if you reloaded the map with coord params ("gamemap.uesp.net/eso" was not showing any)
- positions being messed up on save in bangkorai zone (but only on the western side)
- eso not showing up on gamemap map list
>> looked briefly into this. problem seems to be in the server response of get_maps funcion
>> "maps" array contains eso. "mapInfos" object does not. maybe the json file is too big or something?
>> btw if touching backend of this, possible to return maps in release order? maybe field in mapConfig or something. suggested by user, and on my list for this week
## stuff

i wanted to ask you about timings, , what do you want to do?

plan was to get gamemap done by this week, i was confident i could do all of the bugs i have left in a week, but with the coord conversion bug still happening, not sure

 if starfield work is more urgent right now, we could put gamemap on hold and come back to it later?

 the only major feature work left in gamemap is getting centreon working (for compat with wiki map links)

 plan was bug blast this week, since all major features would have been completed by now

## other stuff:

- reminder about skyrim/beyond skyrim/solstheim tiles from BS guy
- Skyrim and Solstheim at 512 x 512 per cell
> https://drive.google.com/drive/folders/1jfzur-HgTd5Dwim02OwSrlBbsXQa5ltb?usp=drive_link

- wiki upgrade broke galleries on the app, skyrim:skyrim and other pages with lots of images make text go squished

























## todo


- fix eso not showing up on devgamemap map list

- fix being able to right click on markers to delete them

- fix console.warn error when cancelling new location on gamemap
- fix eso icons not showing up on load in eso on gamemap

- fix focus on svelte elements mean cant move map (mobile specifically)
>> try re allowing map panning on the "zoom" or "move" events

- fix  editing bangkorai blob already starting as edited/unsaved changes

- the location coord mismatch is happening because you are converting a new location's coords based on the current world's dimensions
>> need to find a way to pass location.js reference to the current world

- do edit templates for dawnstar per dcsg asked

- direct edit "close" button isnt closing whole panel as expected
- fix clicking X button "saving" changes unlike cancel button

- deleting markers still adds edit-version marked with "click to drag" back to map on map move

- fix line colour preview showing fill colours from area

- shift click on other locations while unsaved changes should immediately change to edit it


- fix the "are you sure you want to leave page, unsaved changes" alert dialog


- double clicking markers that arent clickable edits them
- fix having to load new world once, then click RC item again to jump to centre of it

- make adding new location count as unsaved changes (unsaved changes == false or location is unsaved)

if adding location, save will dismiss the editor window
if adding location, close button is always "cancel"


- fix escape key bugging out dialogs
>> also make sure you cant escape out of dialogs that are dismissible false

- be able to hotswap to edit different locations with popup edit or shift edit, as long as not unsaved or not new location

- remove edit history being clickable with ripple

- fix cant set new marker to "none" / dropdown always selecting "none" on first load on any edit


- make map lock for editing worlds actually work (no zooming allowed)
- get live editing working for worlds


- fix colour picker default colour to something sensible instead of the blue

- -0.5 on all locations client side

- show "position" in info when marker being added

- fix long edit history items causing editor to resize - should truncate


"goto article" button doesnt update when world wiki link updated

- fix RC inconsistently being resized after coming back from editing location
- fix RC not going all the way down on initial edit pane open
- make "grouped/abc" symmetrical

- make close button in edit panel always close the panel regardless of direct edit or not

- fix not being able to click location dropdown while it's open to close it

- make map key grid columns dynamic and fix overscrolling


- check to make sure location and world editing works fine still
- make iconbar and resizing dynamic, dont rely on css for mobile mode, do it in javascript based on map size

- fix centring on locations not working, use leaflet moveto marker api to ensure centred
- cell resource state in/from url
- add zoom/pan in effects for markers when editing

- make dialog backgrond start fading with the scale animation, dont make it just disappear when the animation is over

- if location list button is overflowing, show the name of the world insated of "show location list"

- add tooltip to editor back button/ close button "Back" "Close"
- make editing polygons always the same colour (blue)



- fix centreon going to the wrong place
- fix clicking out while zoomed in zooming in to parent map as well
- fix type:blah not working after the icon list to js map change
- fix requesting /null in layerbutton
- add middle click event listener to button and listItem
>> allow middle click to open in new tab for goto article button
>> and add middle click on listitems to open in a new tab w/ centreon link
- fix recent changes list overflowing downwards
- fix location list dropdown not being centred properly
- bring back editing throbbing animation for locations
- fix live edit on world name location switcher
- fix live edit on worlds (every change changes the current world in map object)
- make embeded map watermark actually open in new tab
- make going to location centre zoom dynamically instead of always zoom level 5
- add way to show popups on centreon, optional param
- fix losing grid on resize
- fix regaining grid on day/night mode switch
- fix canvas grid layer being laggy af when zooming out
- shift click in RC to travel to and edit world/location
- make tooltips follow the mouse rather than the centre of the location
- show more columns on map key menu dynamically
- make centre of polygons visual centre not mathematical centre
- fix cell resource colour intensity to make sense. deeper the colour the more stuff
- fix pip on layer switcher ui being small
- make readme on how to create the favicon styles for maps for future developers
- make maps in game release order
- use similar centre of polygon algorithm as leaflet does for locations/latlng conversion
- organise styles.css and comment gamemap js
- comment/refactor all code

















## todo maps (future)
- skyrim minecraft map thing
- cave interior maps for skyrim, ob, mw
- some kind of tutorial on first non-cookie load to tell user how to use ui
- divine intervention/region areas for mw map (https://en.uesp.net/wiki/File:MW-map-Divine_Intervention.jpg)
- drag and edit polygon at the same time
>> https://jsfiddle.net/Razielwar/hmqgn69r/14/
- allow shiftclick/ctrl click to add/remove vertices
- be able to search the icon list in editor
- shower thought: could use the "Dev/Beta" versions of maps for eso as separate layers

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