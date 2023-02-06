## last week:


## todo

- refactor watermark area to be optioons component

make map reset use zoomtoBounds or equivalent from leaflet docs

- fix game worldspace XY conversion
- refactor all locationIDs to be negative
- truncate decimal points on XY, show on normalised
- fix overflow menu being cropped
- add overflow menu icons
- refactor bgcolour in mapconfig to "initalBGColour" with a comment that states
"what the map's initial colour will be on first load. note that when the world is loaded, it may overwrite this.
this is just to speed up perceived loading times with a nice transition."
- add go up button for mobile
- fix polylines not respecting zoom levels
- allow world name instead of ID in url (used for centreon)
- optimise grid code
- add slightly transparent rect filling grid cells that have labels on it, to quickly show dif
- add permalink option in location popups
- refactor utils and constants out to its own file "commons.js" in the same root as app.svelte
>> document all functions in it
>> have the file separated by "functions" in big block comment, and then "constants"
>> document all the functions in it
- do cell resource grid for skyrim
- other maps
- help and stuff
- edit
- fix popups having the wrong coord type on them
- add way to show popups on centreon, optional param
- fix all markers showing up at initial load on highest zoom level
- fix polygons disappearing when outer points are not viewable (consider centre point as well)
- fix grid disappearing when switching layers

## todo (future)
- wiki features
- email thing
- starfield wiki app
- starfield map

app :
- cross platform
- cross wiki
- integrate maps