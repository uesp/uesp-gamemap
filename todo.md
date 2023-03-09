

## last week:


- added edit sidebar
- added refresh button to recent changes
- added username as well as relative date (5 days ago) to recent changes
- can still hover over the date to get the real date
- got recent changes and edit sidebar working


- RC is fully responsive, text gets cropped, buttons reposition depending on size


- aldo added edit overlay when doing area or line, but not shown currently




technical:

doesnt look like a lot, but had to do a lot of jiggery pokery to get the edit panel to work
1. had to move all ui elements into the same div as gamemap
2. turns out leaflet disables right click, lets you scroll/pan for all elements in gamemap
3. had to override that for all elements with "svelte" in the classname in gamemap.js (ex: search list was scrolling map instead of search results)
4. because all ui elements are in gamemap div now, had to redo all z-indexes

## Bug fixes:
- fixed OB, SR and BS not having favicon
fix: listitem icons (search result, RC) icons disappearing randomly


update RC api to have action

(small icons to denote action (added / edited / deleted)? + / some arrows or gear idk / x for example)

on actions - could also colour-code it, give that circle green tint for create, none for edit, red for delete, hmmm.


RC doesnt show world edits?

problems/suggestions:
RC timestamp not in UTC?

## todo


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
- edit

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