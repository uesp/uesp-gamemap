/**
 * @name mapState.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Data class for the map's state.
 */

// import data classes
import Location from "./location.js";
import World from "./world.js";
export default class MapState {
    constructor(data) {
        //set default state
        this.pendingJump = data?.pendingJump ?? null;
        this.coords = data?.coords ?? this.pendingJump instanceof Location ? this.pendingJump?.getCentre() : null;
        this.world = (() => {
            if (data?.world) {
                return data.world;
            } else if (this.pendingJump != null) {
                let jump = this.pendingJump;
                if (jump instanceof Location) {
                    return gamemap.getWorldByID(jump.worldID);
                } else if (jump instanceof World) {
                    return jump;
                }
            } else {
                return gamemap.getWorldByID(MAPCONFIG.defaultWorldID || 0);
            }
		})();
        this.zoom = data?.zoom ?? (this.pendingJump instanceof Location ? gamemap.getWorldByID(this.pendingJump?.worldID).maxZoomLevel : null);
        this.gridData = data?.gridData ?? null;
		this.layerIndex = data?.layerIndex ?? 0;
        this.pendingSearch = null;
    }

    getZoom() {
        return this.zoom;
    }

    isGridEnabled() {
        return this.gridData != null && this.world.hasGrid();
    }

    isGridShown() {
        return this.gridData?.gridShown != null;
    }


}