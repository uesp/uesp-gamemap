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
        this.worldID = DEFAULT_MAP_CONFIG.defaultWorldID;
        this.showGrid = false;
        this.cellResource = "";
        this.displayState = "";

    }
}
