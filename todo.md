## last week:

did cell resource stuff, some bug fixes and polish

## main stuff

- added cell resource stuff and grid options menu
>>> merged cell resource & grid into one menu
>>> options menu can be collapsed/expanded to get out of the way
>>> can turn off cell labels
>>> grid menu remembers what options were selected when closed, one click toggle on/off

## polish/bug fixes

>>> this is customisable in the mapConfig, by default its light grey, but for skyrim its half-black because snow
- misc: can press esc to dismiss location switcher
- fixed: map view not being centred properly on world load (most noticeable on eso map)
- fixed: grid being removed when locations load in

## techinical stuff

- rewrote and optimised grid code
>>> grid now only renders what's visible on canvas
>>> note: i've turned off hardware rendering on firefox cos fan noise. ignore the lag. it works fine on desktop/chrome
- grid & cell resource colours are now customisable via mapconfig
- made all maps request tile number of maxZoom^2

## problems:
- cell resource is y flipped
- need server side resource offset to align correctly
- didnt get around to fixing the main bugs, rewriting the grid took up most of the week

## ask dave:



"Was thinking of updating tilesX/Y in the db to be the max tile count but that would mess up some existing ESO stuff that uses it
[19:11]
So probably better to add 2 new columns to the world DB if we wanted to (assuming that would be useful from your end at least"

- tamriel rebuilt cells no longer line up now




so, cell resource is upside down and some map bugs
choices: map beta now (monday), leave bugs in, map beta and separate patreon post this friday, hopefully fix bugs
or dedicate this whole week to fixing issues and map beta next monday (delay editing until week after)






## todo


- grid lines on/off for cell resource
- write copy for whats new

- y flip cell resource for skyrim
- fix grid disappearing when switching layers
- add allow long clicking on mobile to open popups
- make grid options text right aligned
- fix requesting /null in layerbutton
- fix game worldspace XY conversion
- fix polylines not respecting zoom levels
- gamemap not loading after initial full load (gamemap.net/ob/....) results in null latlngs -- happening shivering and solstheim
- make loading bar show as soon as gotoDest is called
- make leaflet popup wikilinks turn black if there's no href
- add permalink option in location popups
- redesign location popups
- make map reset use zoomtoBounds or equivalent from leaflet docs
- fix icons randomly disappearng from listItem
- make embeded map watermark actually open in new tab
- fix tooltip text: wikilink and detail not being put on separate lines
- make labels clickable
- fix layer widget pip/triangle being messed up
- edit
- import materialise buttons into svelte components
- add continuous zoom, markers popup on zoom rather than zoomend
- fix popups having the wrong coord type on them
- add way to show popups on centreon, optional param
- fix losing grid on resize
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
- integrate maps