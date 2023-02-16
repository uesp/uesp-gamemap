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

			this.zoomOffset = (mapConfig.zoomOffset != null) ? mapConfig.zoomOffset : world.zoomOffset;

			this.maxZoomLevel = (world.maxZoom - this.zoomOffset) + 0.03; // add 0.03 to fix leaflet bug of only going up to x.97 zoom
			this.minZoomLevel = (world.minZoom - this.zoomOffset) || 0;

			this.minX = (mapConfig.minX != null) ? mapConfig.minX : world.posLeft;
			this.maxX = (mapConfig.maxX != null) ? mapConfig.maxX : world.posRight;
			this.minY = (mapConfig.minY != null) ? mapConfig.minY : world.posBottom;
			this.maxY = (mapConfig.maxY != null) ? mapConfig.maxY : world.posTop;

			this.numTilesX = world.tilesX;
			this.numTilesY = world.tilesY;

			this.locations = null; // locations are loaded async after the world is created
			this.legacy = world; // legacy attributes from server

			// world display data (grids and layers)
			this.displayData = JSON.parse(world.displayData);
			this.layers = (this.displayData.layers != null) ? this.displayData.layers : mapConfig.layers;
		} else {
			throw new Error("World cannot be null!");
		}
	}

	hasGrid() {
		return (this.displayData.hasGrid != null && this.displayData.gridStart != null) ? this.displayData.hasGrid : false;
	}

	hasCellResources() {
		return (this.displayData.hasCellResource != null) ? this.hasGrid() && this.displayData.hasCellResource : false;
	}

	hasMultipleLayers() {
		return this.layers.length > 1;
	}

}