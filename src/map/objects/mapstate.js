/**
 * @name mapState.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Data class for the map's state.
 */

 export default class MapState {
    constructor(coords) {
        //set default state
		this.coords = (coords != null) ? coords : null;
        this.zoomLevel = (coords != null && coords.zoom != null) ? coords.zoom : DEFAULT_MAP_CONFIG.zoomLevel;
        this.world = null;
        this.showGrid = false;
        this.cellResource = "";
		this.layerIndex = 0;
    }

    createSaveQuery() {
		let query = 'action=set_world';

		query += '&worldid=' + this.world.id;
		query += '&parentid=' + this.world.parentID;
		query += '&revisionid=' + this.world.revisionID;
		query += '&name=' + encodeURIComponent(this.world.name);
		query += '&displayname=' + encodeURIComponent(this.world.displayName);
		query += '&description=' + encodeURIComponent(this.world.description);
		query += '&wikipage=' + encodeURIComponent(this.world.wikiPage);
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
