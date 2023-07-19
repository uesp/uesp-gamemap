/**
 * @name mapState.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Data class for the map's state.
 */

// import data classes
import Location from "./location.js";
export default class MapState {
    constructor(data) {
        //set default state
        this.pendingJump = data?.pendingJump ?? null;
        this.coords = data?.coords ?? this.pendingJump?.getCentre() ?? null;
        this.world = data?.world ?? gamemap.getWorldByID(this.pendingJump?.worldID) ?? gamemap.getWorldByID(MAPCONFIG.defaultWorldID || 0);
        this.zoom = data?.zoom ?? (this.pendingJump ? gamemap.getWorldByID(this.pendingJump?.worldID).maxZoomLevel : DEFAULT_MAP_CONFIG.zoomLevel);
        this.showGrid = data?.showGrid ?? false;
        this.cellResource = data?.cellResource ?? "";
		this.layerIndex = data?.layerIndex ?? 0;
    }

}