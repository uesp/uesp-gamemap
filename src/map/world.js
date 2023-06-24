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

			// locations are loaded async after the world is created
			this.locations = null;

			this.id = world.id || 0;
			this.parentID = world.parentId || -1;
			this.revisionID = world.revisionId || 0;

			this.wikiPage = world.wikiPage || null;
			this.cellSize = world.cellSize || -1;

			this.zoomOffset = mapConfig.zoomOffset ?? world.zoomOffset;
			this.defaultZoom = world.defaultZoom - this.zoomOffset;
			this.maxZoomLevel = world.maxZoom - this.zoomOffset;
			this.minZoomLevel = world.minZoom - this.zoomOffset || 0;

			this.minX = mapConfig.minX ?? world.posLeft;
			this.maxX = mapConfig.maxX ?? world.posRight;
			this.minY = mapConfig.minY ?? world.posBottom;
			this.maxY = mapConfig.maxY ?? world.posTop;

			// get max range of x and y, assure it is a positive number
			this.maxRangeX = Math.abs(this.maxX - this.minX);
			this.maxRangeY = Math.abs(this.maxY - this.minY);

			this.numTilesX = Math.pow(2, this.maxZoomLevel); //estimated number of tiles in the X direction
			this.numTilesY = Math.pow(2, this.maxZoomLevel); //estimated number of tiles in the Y direction
			this.dbNumTilesX = world.maxTilesX; //actual number of tiles in the X direction
			this.dbNumTilesY = world.maxTilesY; //actual number of tiles in the Y direction

			this.legacy = world; // legacy attributes from server

			// world display data (grids and layers)
			this.displayData = (world?.displayData) ? JSON.parse(world.displayData) : null;
			this.layers = this.displayData?.layers ?? mapConfig.layers;
			this.gridStart = this.displayData?.gridStart;
		} else {
			throw new Error("World cannot be null!");
		}
	}

	hasGrid() {
		return this.displayData?.hasGrid && this.displayData?.gridStart;
	}

	hasCellResources() {
		return this.hasGrid() && this.displayData?.hasCellResource;
	}

	hasMultipleLayers() {
		return this.layers.length > 1;
	}

	//Gets width and height of the full world image in pixels
	getWorldDimensions() {

		let dimens = {};
		let width  = ((gamemap.getMapConfig().coordType == COORD_TYPES.PSEUDO_NORMALISED) ? this.dbNumTilesX : this.numTilesX * gamemap.getMapConfig().tileSize) * Math.pow(2, 0);
		let height = ((gamemap.getMapConfig().coordType == COORD_TYPES.PSEUDO_NORMALISED) ? this.dbNumTilesY : this.numTilesY * gamemap.getMapConfig().tileSize) * Math.pow(2, 0);

		dimens.width = width;
		dimens.height = height;
		dimens.minX = this.minX;
		dimens.maxX = this.maxX;
		dimens.minY = this.minY;
		dimens.maxY = this.maxY;

		return dimens;
	}

	// get query for saving this world
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
		query += '&minzoom=' + (+this.minZoomLevel + +this.zoomOffset); //unary black magic
		query += '&maxzoom=' + (+this.maxZoomLevel + +this.zoomOffset); //unary black magic
		query += '&posleft=' + this.minX;
		query += '&posright=' + this.maxX;
		query += '&postop=' + this.maxY;
		query += '&posbottom=' + this.minY;
		query += '&zoomoffset=' + this.zoomOffset;

		return query;
	}

	// get query for deleting this world
	getDeleteQuery() {

		var query = 'action=enable_world';

		query += '&worldid=' + this.id;
		query += '&db=' + gamemap.getMapConfig().database;
		query += '&enabled=0';

		return query;

	}

}