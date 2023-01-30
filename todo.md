
## this week:

this week i focused on QoL stuff as i bring ui elements into svelte

- rewrote how watermark works
>>> updated design
>>> no longer bottom right, but centre
>>> now uses new bottom "options" pane which will be used for Cell Resource's options as well
>>> potentially banner ads??

- pixel-perfect aligned ui elements (wasnt before)

- improved embedding support
>>> big ui elements like search, zoom etc now hide on embed mode
>>> watermark changes based on embedded, non embedded, uesp embedded "open in bigger map" etc

- qol: made long-pressing the zoom widget go full zoom in or out
>>> also bugfix: debounced zoom widget so cant spam zoom

- qol: hide UI by pressing insert key (suggested by TR people)

- got layer switcher fully working
>>> nice animations, shows next layer name
>>> hitting the button maps with multiple layers will cycle through layers
>>> hovering over will show layer options and grid, cell resource etc (only shows if available)
>>> on maps with no multiple layers like mw, will just show the button to hover and enable grid
>>> on maps with no grid options like eso, layer switcher doesnt show at all
>>> layer switcher always shows the "next" layer, except in cases where there are none (shows icon instead)


## problems / stuff to ask:

ask dave to add DCSG paper oblivion map as optional layer
TR gridmap layer is off#
TR gridmap border is wrong colour
layer switching works, but foresee an issue

could the tilelayers array be stored on the server, per world instead?
because for thing like dragonborn/skyrim, the skyrim world has a dark/night but the solstheim might not




## todo

make map reset use zoomtoBounds or equivalent from leaflet docs

- refactor bgcolour out to individial layer configs

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


