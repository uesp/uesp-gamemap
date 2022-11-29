/**
 * @name world.js
 * @author Dave Humphrey <dave@uesp.net> (22nd Jan 2014)
 * @summary Contains class definition for a gamemap world.
 */

export default class World {
	constructor(world, mapConfig) {

		if (world != null) {
			this.displayName = world.displayName;
			this.name = world.name.toLowerCase();
			this.description = world.description || "";

			this.id = world.id || 0;
			this.parentID = world.parentId || -1;
			this.revisionID = world.revisionId || 0;

			this.wikiPage = world.wikiPage || "";
			this.cellSize = world.cellSize || -1;
	
			this.zoomOffset = world.zoomOffset || mapConfig.zoomOffset;

			this.maxZoomLevel = ((world.maxZoom - this.zoomOffset) || mapConfig.maxZoomLevel) + 0.03; // add 0.03 to fix leaflet bug of only going up to x.97 zoom
			this.minZoomLevel = (world.minZoom - this.zoomOffset) || mapConfig.minZoomLevel;
	
			this.missingMapTilePath = mapConfig.missingMapTilePath;

			this.legacy = world; // legacy attributes from server

			this.minX = world.posLeft || mapConfig.minX;
			this.maxX = world.posRight || mapConfig.maxX;
			this.minY = world.posBottom || mapConfig.minY;
			this.maxY = world.posTop || mapConfig.maxY;

			this.numTilesX = world.tilesX;
			this.numTilesY = world.tilesY;

			this.locations = null; // locations are loaded async after the world is created
		} else {
			throw new Error("World cannot be null!");
		}

	}

}