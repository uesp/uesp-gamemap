## last week:

mainly QoL focusing on search, bug fixes and some eye candy

# main features
- added map menu on root (devgamemap.uesp.net)
>> now shows list of all available maps
- search now has option to pin the search view (your suggestion)
>> it uses cookies to remember your preference, so you only set it once
- added expando to search settings, to save space with many options (suggested by TR)
>> this also uses cookies to save preferences across maps

# eye candy
- gamemap now fade-transitions bg colour when loading between maps
>> most noticeable when clicking into maps from map menu above
>> give it ago. i think it feels really smooth (may have to force refresh)
>> this should help make skyrim day/night mode switch feel smoother too
- added small pin icon to indicate when search is pinned
- replaced existing favicons with higher quality ones

# QoL
- clicking anywhere on the searchbar now focuses the textbox (didnt before)
- added tooltip on search results to indicate what kind of location it is
- shrunk the saerchbar a bit to give map more breathing room (a complaint from TR people)
- search options also minimises when focused search but not typed anything, to save space

# bug fixes
- fixed search options shadow being cut off (minor thing)
- fixed search query being reset after clicking a location
- fixed bug with search setting options disappearing inconsistently when focusing the search box

## suggestions:
- rename ob's world to "Cyrodiil"





























## todo

- make search in enter open first result
- control search with arrow keys

- animation on layer widget exit
- animation on search options resize
- refactor watermark area to be optioons component
- fix layer widget being unusable on chrome

make map reset use zoomtoBounds or equivalent from leaflet docs

- refactor layer bgcolour out to individial layer configs
- fix game worldspace XY conversion
- add a way to pin search pane to the map (static)
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
- do resource grid for skyrim
- other maps
- help and stuff
- edit
- fix popups having the wrong coord type on them
- add way to show popups on centreon, optional param
- fix all markers showing up at initial load on highest zoom level
- fix polygons disappearing when outer points are not viewable (consider centre point as well)

## todo (future)
- wiki features
- email thing
- starfield wiki app
- starfield map

app :
- cross platform
- cross wiki
- and maps