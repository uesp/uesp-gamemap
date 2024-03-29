/**
 * @name world.js
 * @author Dave Humphrey <dave@uesp.net> (22nd Jan 2014)
 * @summary Contains class definition for a gamemap world.
 */

export default class World {
	constructor(data) {

		this.displayName = data?.displayName ?? "";
		this.name = data?.name?.toLowerCase() ?? "";
		this.description = data?.description ?? "";

		// locations are loaded async after the world is created
		this.locations = null;

		this.id = data?.id ?? 0;
		this.parentID   = (data?.parentId == -1) ? null : data?.parentId ?? null;
		this.revisionID = data?.revisionId ?? 0;
		this.revertID = data?.revertId ?? null;

		this.wikiPage = (data?.wikiPage && data.wikiPage != "") ? data.wikiPage : this.displayName;
		this.cellSize = data?.cellSize ?? -1;

		this.zoomOffset   = MAPCONFIG.zoomOffset ?? data?.zoomOffset;
		this.defaultZoom  = data?.defaultZoom - this.zoomOffset;
		this.maxZoomLevel = data?.maxZoom - this.zoomOffset;
		this.minZoomLevel = data?.minZoom - this.zoomOffset ?? 0;

		this.minX = MAPCONFIG.minX ?? data.posLeft;
		this.maxX = MAPCONFIG.maxX ?? data.posRight;
		this.minY = MAPCONFIG.minY ?? data.posBottom;
		this.maxY = MAPCONFIG.maxY ?? data.posTop;

		// get max range of x and y, assure it is a positive number
		this.maxRangeX = Math.abs(this.maxX - this.minX);
		this.maxRangeY = Math.abs(this.maxY - this.minY);

		this.numTilesX = Math.pow(2, this.maxZoomLevel); //estimated number of tiles in the X direction
		this.numTilesY = Math.pow(2, this.maxZoomLevel); //estimated number of tiles in the Y direction
		this.dbNumTilesX = (data?.maxTilesX != 0) ? data?.maxTilesX : this.numTilesX; //actual number of tiles in the X direction
		this.dbNumTilesY = (data?.maxTilesY != 0) ? data?.maxTilesY : this.numTilesY; //actual number of tiles in the Y direction

		//gets width and height of the full world image in pixels
		this.width  = ((MAPCONFIG.coordType == COORD_TYPES.PSEUDO_NORMALISED) ? this.dbNumTilesX : this.numTilesX * MAPCONFIG.tileSize) * Math.pow(2, 0);
		this.height = ((MAPCONFIG.coordType == COORD_TYPES.PSEUDO_NORMALISED) ? this.dbNumTilesY : this.numTilesY * MAPCONFIG.tileSize) * Math.pow(2, 0);

		this.legacy = data; // legacy attributes from server

		// world display data (grids and layers)
		this.displayData = (data?.displayData) ? JSON.parse(data.displayData) : null;
		this.layers = this.displayData?.layers ?? MAPCONFIG.layers;
		this.gridStart = this.displayData?.gridStart;

		this.editing = false; // whether this world is currently being edited
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

	hasLayerMenu() {
		return this.hasMultipleLayers() || this.hasGrid();
	}

	//Gets width and height of the full world image in pixels
	getWorldDimensions() {
		return {
			width: this.width,
			height: this.height,
			minX: this.minX,
			maxX: this.maxX,
			minY: this.minY,
			maxY: this.maxY,
		};
	}

	// get query for saving this world
	getSaveQuery() {
		var query = 'action=set_world';

		query += '&worldid=' + this.id;
		query += '&db=' + MAPCONFIG.database;
		query += '&parentid=' + encodeURI(this.parentID);
		query += '&revisionid=' + this.revisionID;
		query += '&name=' + encodeURI(this.name);
		query += '&displayname=' + encodeURI(this.displayName);
		query += '&description=' + encodeURI(this.description);
		query += '&wikipage=' + encodeURI(this.linkWikiPage() ? this.displayName : this.wikiPage);
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
		query += '&db=' + MAPCONFIG.database;
		query += '&enabled=0';

		return query;

	}

	// get query for reverting this world
	getRevertQuery() {
		return encodeURI(`action=revert_world&db=${MAPCONFIG.db}&worldid=${this.id}&revertid=${this.revertID ?? this.revisionID}`);
	}

	setEditing(editing) {
		this.editing = editing;
		gamemap.getElement().classList.add("editing"); // add editing effect
	}

	linkWikiPage() {
		return this.wikiPage?.toLowerCase() == this.displayName?.toLowerCase() || this.wikiPage == null;
	}


	getLocation(identifier) {
		if (!isNaN(identifier) || identifier.id) {
			let locID = Math.abs(identifier?.id ?? identifier);
			if (this.locations?.has(locID)) {
				return this.locations.get(locID);
			}
		} else if (typeof identifier === 'string' || identifier instanceof String) {
			this.locations?.forEach(location => {
				if (location.name.toLowerCase() == identifier) {
					return location;
				}
			});
		} else {
			return null;
		}
	}

	hasLocation(identifier) {
		return this.getLocation(identifier) != null;
	}

	// Get wiki link for this world
	getWikiLink() {
		return `${MAPCONFIG.wikiURL}${MAPCONFIG.wikiNamespace}:${encodeURIComponent(this.wikiPage)}`;
	}

}