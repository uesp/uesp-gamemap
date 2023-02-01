## last week:

eye candy and QoL

- added map menu on root (devgamemap.uesp.net)
- gamemap now fade-transition bg colour when loading (most noticeable when clicking into maps from the above)
>> anticipating this because when doing skyrim day/night mode, it should also have bg colour fade

- clicking anywhere on the searchbar now focuses the textbox (didnt before)
- shrunk the saerchbar a bit to give map more breathing room (a complaint from TR people)

## todo


make map reset use zoomtoBounds or equivalent from leaflet docs

- refactor layer bgcolour out to individial layer configs
- fix game worldspace XY conversion
- add a way to pin search pane to the map (static)
- refactor all locationIDs to be negative
- truncate decimal points on XY, show on normalised
- fix overflow menu being cropped
- add overflow menu icons
- add go up button for mobile
- fix polylines not respecting zoom levels
- separate worlds and locations in search results "worlds" "locations"
- allow world name instead of ID in url (used for centreon)
- optimise grid code
- add slightly transparent rect filling grid cells that have labels on it, to quickly show dif
- make search in enter open first result
- control search with arrow keys
- add permalink option in location popups
- fix popups having the wrong coord type on them
- add way to show popups on centreon, optional param
- fix all markers showing up at initial load on highest zoom level
- banner ads on map

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