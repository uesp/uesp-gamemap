/**
 * @name mapState.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Simple map state class.
 */

 import Position from "./mapPosition.js";

 export default class MapState {
    constructor() {
        //get default state
        this.zoomLevel = DEFAULT_MAP_CONFIG.zoomLevel;
        this.gamePos = new Position(DEFAULT_MAP_CONFIG.xPos, DEFAULT_MAP_CONFIG.yPos);
        this.worldID = 0;
        this.grid = false;
        this.cellResource = "";
        this.displayState = "";
    }
}
