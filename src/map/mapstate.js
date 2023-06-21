/**
 * @name mapState.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Data class for the map's state.
 */

 export default class MapState {
    constructor(coords) {
        //set default state
		this.coords = coords;
        this.zoom = coords?.zoom ?? coords?.[0].zoom ?? DEFAULT_MAP_CONFIG.zoomLevel;
        this.world = null;
        this.showGrid = false;
        this.cellResource = "";
		this.layerIndex = 0;
    }

}