/**
 * @name mapState.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Catch-all class for the map's state.
 */

 export default class MapState {
    constructor() {

        //set default state
        this.zoomLevel = DEFAULT_MAP_CONFIG.zoomLevel;
        this.coords = [DEFAULT_MAP_CONFIG.defaultXPos, DEFAULT_MAP_CONFIG.defaultYPos];
        this.world = null;
        this.showGrid = false;
        this.cellResource = "";
        this.displayState = "";

    }

    createSaveQuery() {
		let query = 'action=set_world';
		
		query += '&worldid=' + this.id;
		query += '&parentid=' + this.parentID;
		query += '&revisionid=' + this.revisionID;
		query += '&name=' + encodeURIComponent(this.name);
		query += '&displayname=' + encodeURIComponent(this.displayName);
		query += '&description=' + encodeURIComponent(this.description);
		query += '&wikipage=' + encodeURIComponent(this.wikiPage);
		query += '&missingtile=' + encodeURIComponent(this.missingMapTile);
		query += '&minzoom=' + this.minZoomLevel;
		query += '&maxzoom=' + this.maxZoomLevel;
		query += '&posleft=' + this.minX;
		query += '&posright=' + this.maxX;
		query += '&postop=' + this.minY;
		query += '&posbottom=' + this.maxY;
		query += '&zoomoffset=' + this.zoomOffset;
		query += '&enabled=' + (this.enabled ? '1' : '0');
		query += '&db=' + this.mapConfig.database;
		
		return query;
	}
}
