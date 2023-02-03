## last week:

eye candy and QoL

- added map menu on root (devgamemap.uesp.net)
- gamemap now fade-transition bg colour when loading (most noticeable when clicking into maps from the above)

- the experience is lovely and you should try it yourself. it just feels so smooth
note: may have to ctrl refresh if maps are using old codeto get the full experience
>> anticipating this because when doing skyrim day/night mode, it should also have bg colour fade

- clicking anywhere on the searchbar now focuses the textbox (didnt before)
- shrunk the saerchbar a bit to give map more breathing room (a complaint from TR people)

- fixed search options shadow being cut off (minor thing)

- QoL: added "pin search" option (your suggestion)
- QoL: added expando to search options menu to show/hide the search options and save space
- QoL: added shared preference support, saves prefs as cookies
- QoL: added tooltip to search result icons to indicate what it is (people were confused)

bugfix: fix search query being reset after clicking a location

the saerch pane now remembers whether you:
- prefer the options minimised
- prefer the search to be pinned

any url parameters will overwrite cookie-based preferences

fixed bug with search setting options appearing inconsistently when focusing the search box


- because you can collapse the settings and pin things, added a small pin icon so you can always tell when it's pinned

- replaced existing favicons with higher quality ones


## suggestions:

- rename ob's world to "Cyrodiil"




## todo

- make search in enter open first result
- control search with arrow keys

- make ListItem component
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
- fix popups having the wrong coord type on them
- add way to show popups on centreon, optional param
- fix all markers showing up at initial load on highest zoom level

## todo (future)

- do resource grid for skyrim
- other maps
- help and stuff
- edit
- wiki features
- email thing
- starfield wiki app
- starfield map

app :

- cross platform
- cross wiki
- and maps