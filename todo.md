
## this week:

use SE#17 to connect

- tried getting local server to work (set up php server and stuff)
>>> thwarted by uesp server stuff :<

- since svelte is all loaded from JS, added noscript warning "please turn js on" when users dont have JS

- many optimisations:

- one of the big perf problems was loading leaflet + app js/css from different bundles
>>> leaflet, css, etc are all now compiled into one bundle, and minified
>>> had to do some hacky preprocessing stuff to get that working, but its good now

- css is now non-blocking, only loads when it's done
>>> to prevent page looking ugly before css loads, <main> is opacity 0, then when stylesheet loads in,
>>> it fade-animates the page, hiding ugliness away from user
>>> https://cdn.discordapp.com/attachments/806672739057664034/1065456203876016128/image.png

- leaflet map itself is non-blocking, instead of loading *at the same time* as the app, it only loads when it's done

- optimised a bit to use less network calls

- removed jquery since svelte does that for me (another dep gone)
>>> minor refactor because of that


## todo

layer switcher should use sentence case for layer names Default, Gridmap

- add layer switcher day/night ui

ask dave to add DCSG paper oblivion map as optional layer
- refactor bgcolour out to individial layer configs

- add game worldspace XY conversion
- add a way to pin search pane to the map (static)
- refactor all locationIDs to be negative
- truncate decimal points on XY, show on normalised
- long press zoom buttons to zoom
- fix overflow menu being cropped
- add overflow menu icons
- add go up button for mobile
- fix polylines not respecting zoom levels
- key to hide ui
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
- custom tilelayers (nice to have)
- edit
- wiki features
- email thing

- starfield wiki app
- starfield map

app :

- cross platform
- cross wiki
- and maps


