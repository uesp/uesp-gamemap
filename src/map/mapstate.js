/**
 * @name mapState.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Data class for the map's state.
 */

 export default class MapState {
    constructor(data) {
        //set default state
		this.coords = data?.coords ?? null;
        this.zoom = data?.zoom ?? data?.[0]?.zoom ?? DEFAULT_MAP_CONFIG.zoomLevel;
        this.world = data?.world ?? gamemap.getWorldFromID(MAPCONFIG.defaultWorldID || 0);
        this.showGrid = false;
        this.cellResource = "";
		this.layerIndex = 0;
        this.pendingJump = null;
    }

}