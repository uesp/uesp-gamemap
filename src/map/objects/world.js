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

			this.maxZoomLevel = (world.maxZoom - this.zoomOffset);
			this.minZoomLevel = (world.minZoom - this.zoomOffset) || 0;

			this.minX = (mapConfig.minX != null) ? mapConfig.minX : world.posLeft;
			this.maxX = (mapConfig.maxX != null) ? mapConfig.maxX : world.posRight;
			this.minY = (mapConfig.minY != null) ? mapConfig.minY : world.posBottom;
			this.maxY = (mapConfig.maxY != null) ? mapConfig.maxY : world.posTop;

			this.numTilesX = Math.pow(2, this.maxZoomLevel); //estimated number of tiles in the X direction
			this.numTilesY = Math.pow(2, this.maxZoomLevel); //estimated number of tiles in the Y direction

			this.dbNumTilesX = world.maxTilesX; //actual number of tiles in the X direction
			this.dbNumTilesY = world.maxTilesY; //actual number of tiles in the Y direction

			this.locations = null; // locations are loaded async after the world is created
			this.legacy = world; // legacy attributes from server

			this.defaultZoom = world.defaultZoom - this.zoomOffset;

			// world display data (grids and layers)
			this.displayData = (world.displayData != null && world.displayData != "") ? JSON.parse(world.displayData) : null;
			this.layers = (this.displayData != null && this.displayData.layers != null) ? this.displayData.layers : mapConfig.layers;
			this.gridStart = (this.displayData != null && this.displayData.gridStart != null) ? this.displayData.gridStart : null;
		} else {
			throw new Error("World cannot be null!");
		}
	}

	hasGrid() {
		return (this.displayData != null && this.displayData.hasGrid != null && this.displayData.gridStart != null) ? this.displayData.hasGrid : false;
	}

	hasCellResources() {
		return (this.displayData.hasCellResource != null) ? this.hasGrid() && this.displayData.hasCellResource : false;
	}

	hasMultipleLayers() {
		return this.layers.length > 1;
	}

	//Gets width and height of the full world image in pixels
	getWorldDimensions() {

		let dimens = {};

		let width = ((gamemap.getMapConfig().database == "eso") ? this.dbNumTilesX : this.numTilesX * gamemap.getMapConfig().tileSize) * Math.pow(2, 0);
		let height = ((gamemap.getMapConfig().database == "eso") ? this.dbNumTilesY : this.numTilesY * gamemap.getMapConfig().tileSize) * Math.pow(2, 0);

		dimens.width = width;
		dimens.height = height;

		return dimens;
	}

	getSaveQuery() {
		var query = 'action=set_world';

		query += '&worldid=' + this.id;
		query += '&db=' + gamemap.getMapConfig().database;
		query += '&parentid=' + this.parentID;
		query += '&revisionid=' + this.revisionID;
		query += '&name=' + encodeURIComponent(this.name);
		query += '&displayname=' + encodeURIComponent(this.displayName);
		query += '&description=' + encodeURIComponent(this.description);
		query += '&wikipage=' + encodeURIComponent(this.wikiPage);
		query += '&minzoom=' + this.minZoomLevel;
		query += '&maxzoom=' + this.maxZoomLevel;
		query += '&posleft=' + this.minX;
		query += '&posright=' + this.maxX;
		query += '&postop=' + this.maxY;
		query += '&posbottom=' + this.minY;
		query += '&zoomoffset=' + this.zoomOffset;

		return query;
	}

}