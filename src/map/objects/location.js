/**
 * @name location.js
 * @author Dave Humphrey <dave@uesp.net> (23rd Jan 2014)
 * @summary Class definition for the gamemap's locations.
 */

import Point from "./point.js";

let mapConfig;
let currentWorld;

export default class Location {
	constructor(location, world) {

		if (location == null) {
			throw new Error("Location cannot be null!")
		}

		world = world ?? gamemap.getCurrentWorld();
		mapConfig = gamemap.getMapConfig() || DEFAULT_MAP_CONFIG;
		currentWorld = world;

		// set location type
		this.locType = location.locType || LOCTYPES.MARKER;

		// set basic location info
		this.id = location.id || 0;
		this.name = location.name || "";
		this.wikiPage = location.wikiPage || "";
		this.description = location.description || "";
		this.visible = location?.visible == 1 && !location.description.includes("teleport dest");
		this.wasVisible = null;
		this.displayData = JSON.parse(location.displayData) || {};
		this.worldID = location.worldId || 0;
		this.destinationID = -(location.destinationId) || null;
		this.revisionID = location.revisionId || 0;
		this.displayLevel = parseFloat(location.displayLevel - world.zoomOffset || 0);
		this.editing = false; // whether this location is currently being edited;
		this.legacy = location;
		this.bounds = null; // bounds are generated when asked

		// set location icon info
		this.icon = location.iconType || null;
		this.width = (this.icon) ? location.width || mapConfig.iconSize : location.width;
		this.height = (this.icon) ? location.height || mapConfig.iconSize : location.height;

		// set up coords
		this.coords = (() => {
			let coords = [];
			let coordArray = this.displayData.points;
			if (coordArray?.length > 0) {

				let [x, y] = [[], []];

				// split single coord array into x and y arrays
				for (let i = 0; i < coordArray.length; i++) {
					if (i % 2 == 0 || i == 0 ) {  // if even, put into x, else: y
						x.push(coordArray[i]);
					} else {
						y.push(coordArray[i]);
					}
				}

				// push joined coords into coord array
				for (let i = 0; i < y.length; i++ ) {
					let coord = [x[i], y[i]];
					coords.push(this.makePoint(coord));
				}

			} else {
				coords.push(this.makePoint([location.x, location.y]));
			}
			return coords;
		})();

		// set up label positions
		this.labelPos = (() => {
			switch (this.displayData.labelPos) {
				case null, 0:	// legacy: none
					return 0;	// returns: none
				case 1: 		// legacy: top left
					return 4;	// returns: left
				case 2:			// legacy: top center
					return 2; 	// returns: top
				case 3:			// legacy: top right
					return 6;	// returns: right
				case 4:			// legacy: left
					return 4;	// returns: left
				case 5:			// legacy: center
					return 5;	// returns: center
				case 6:			// legacy: right
					return 6;	// returns: right
				case 7:			// legacy: bottom left
					return 4; 	// returns: left
				case 8:			// legacy: bottom
					return 8;	// returns: bottom
				case 9:			// legacy: bottom right
					return 6;	// returns: right
				default:		// legacy: auto
					return 10; 	// returns: auto
			}
		})();

		// set up display info for polygons
		if (this.isPolygon()){

			if (!this.displayData?.lineWidth) { this.displayData.lineWidth = 0 }
			if (!this.displayData?.hover) { this.displayData.hover = this.displayData }

			this.fillColour = this.displayData.fillStyle;
			this.fillColourHover = this.displayData.hover.fillStyle;

			this.strokeColour = this.displayData.strokeStyle;
			this.strokeColourHover = this.displayData.hover.strokeStyle;

			this.strokeWidth = this.displayData.lineWidth;
			this.strokeWidthHover = this.displayData.hover.lineWidth;
		}
	}


	// get centre coordinate of this location or passed coords
	getCentre(coords) {
		coords = coords ?? this.coords;

		if (coords.length == 1) {
			return coords[0];
		} else if (coords.length > 0) {

		}

	}

	makePoint(coords) {

		let x = coords[0];
		let y = coords[1];

		// convert eso coordinates to be normalised
		if (mapConfig.coordType == COORD_TYPES.NORMALISED && mapConfig.database == "eso") {

			// get normalised value of x and y in range
            x = (x - currentWorld.minX) / currentWorld.maxRangeX;
			y = Math.abs((y - currentWorld.maxY) / currentWorld.maxRangeY); // flip y around

			// transform coords to better fit power of two numbers of tiles
			x = (x * nextPowerOfTwo(currentWorld.dbNumTilesX) / currentWorld.dbNumTilesX).toFixed(3);
			y = (y * nextPowerOfTwo(currentWorld.dbNumTilesY) / currentWorld.dbNumTilesY).toFixed(3);
		}

		return new Point(x, y, mapConfig.coordType, currentWorld.maxZoomLevel);
	}

	getTooltipContent() {

		return `<span>
					${this.name} ${this.isClickable() ? "<i class='tiny material-icons'>open_in_browser</i>" : ""}
				</span>
			    <div class='tooltip-desc'>
			   		${this.wikiPage != "" && this.name != this.wikiPage ? ((this.description != "") ? this.description + "</br>" : "") + this.wikiPage : this.description}
				</div>
			   	${this.isClickable() ? "<small class='tooltip-tip'>Click to enter</small>" : ""}`;
	}

	getPopupContent() {

		let popupContent = `<div class='popupTitle'><a ${this.createWikiLink()} target='_top'> ${this.name} </a></div>
							<div class='popupDesc'>${this.description}</div><hr/>
							<div class='popupInfo'><b>Location ID:</b> ${this.id}</div>`;

		if (this.coords.length == 1 ) {
			popupContent += `<div class='popupInfo'><b>Coords: </b> X: ${this.coords[0].x}, Y: ${this.coords[0].y} </div>`;
		}

		if (this.destinationID != null) {
			popupContent += `<div class='popupInfo'><b>Destination ID:</b> ${this.destinationID} ${(this.destinationID < 0) ? ' (Location)' : ' (World)'} </div>`;
		}

		if (mapConfig.editingEnabled) {
			let buttonStyle = "text-align: center; height: unset; margin-bottom: -8px; width: inherit; line-height: 26px;";
			popupContent += `<hr/> <a style='${buttonStyle}' class='btn-flat waves-effect' onclick="gamemap.getLocation(${this.id}, function (location) { gamemap.edit(location); gamemap.getMapObject().closePopup() })">Edit</a>`;
		}

		return popupContent;

	}

	isPolygon(){
		return this.locType == LOCTYPES.AREA || this.locType == LOCTYPES.PATH;
	}

	hasIcon() {
		return (this.icon != null && this.locType != LOCTYPES.PATH);
	}

	hasLabel() {
		return (this.labelPos && this.labelPos >= 1 && this.name != "" && this.locType != LOCTYPES.PATH);
	}

	isLabel() {
		return (!this.hasIcon() && !this.isPolygon() && this.hasLabel());
	}

	isClickable() {
		return this.destinationID && this.destinationID != 0 && !gamemap.mapLock && this.locType != LOCTYPES.PATH;
	}

	createWikiLink() {

		let wikiLink = "";

		if (mapConfig.wikiNamespace != null && mapConfig.wikiNamespace.length > 0) {

			if (this.wikiPage != "") {
				if (this.wikiPage.indexOf(":") >= 0) {
					wikiLink = mapConfig.wikiURL + encodeURIComponent(this.wikiPage).replace("%3A", ":").replace("%2F", "/");;
				} else {
					wikiLink = mapConfig.wikiURL + mapConfig.wikiNamespace + ':' + encodeURIComponent(this.wikiPage);
				}
			}
		} else {
			wikiLink = mapConfig.wikiURL + encodeURIComponent(this.wikiPage);
		}

		if (wikiLink != "") {
			wikiLink = `href="${wikiLink}"`;
		}

		return wikiLink;

	}

	setEditing(editing) {
		this.editing = editing;
	}

	getWasVisible() {
		return this.wasVisible;
	}

	setWasVisible(wasVisible) {
		this.wasVisible = wasVisible;
	}

	setVisible(visible) {
		this.visible = visible;
	}

	// is location visible (with optional passed bounds)
	isVisible(bounds) {
		if (this.editing) return true;
		if ((gamemap.getCurrentZoom() + 0.001) < this.displayLevel) return false;
		bounds = bounds ?? gamemap.getCurrentViewBounds();
		// todo: also need centre coord checking in here too
		let isInside = false;
		this.coords.every(coord => {
			if (coord.x >= bounds.minX && coord.x <= bounds.maxX && coord.y >= bounds.minY && coord.y <= bounds.maxY) {
				isInside = true;
			  	return false; // coordinate was found within the bounds, break early
			} else {
				return true; // returning true to keep loop going if no coordinate was found within bounds
			}
		});
		return isInside;
	}

	// get query for saving this location
	getSaveQuery() {

		var query = 'action=set_loc';
		let coords = (mapConfig.database == "eso") ? this.convertESOCoords(this.coords) : this.coords;

		query += `&name=${encodeURIComponent(this.name)}`;
		query += `&description=${encodeURIComponent(this.description)}`;
		query += `&wikipage=${encodeURIComponent(this.wikiPage)}`;

		query += `&loctype=${this.locType}`;
		query += `&locid=${this.id}`;
		query += `&worldid=${this.worldID}`;
		query += `&destid=${-(this.destinationID)}`;
		query += `&revisionid=${this.revisionID}`;
		query += `&db=${gamemap.getMapConfig().database}&visible=1`;

		this.updateDisplayData(coords);
		query += `&x=${(this.isPolygon()) ? this.getMaxBounds().minX: coords[0].x}`;
		query += `&y=${(this.isPolygon()) ? this.getMaxBounds().maxY: coords[0].y}`;
		query += `&locwidth=${this.width}&locheight=${this.height}`;

		query += `&displaylevel=${+this.displayLevel + +currentWorld.zoomOffset}`;
		query += `&displaydata=${encodeURIComponent(JSON.stringify(this.displayData))}`;
		if (this.hasIcon()) { query += `&icontype=${encodeURIComponent(this.icon)}` }

		print(objectify(query));
		return encodeURIComponent(query);
	}

	// get query for deleting this location
	getDeleteQuery() {

		var query = 'action=enable_loc';

		query += `&locid=${this.id}`;
		query += `&db=${gamemap.getMapConfig().database}&visible=0`;

		return query;

	}

	// update display data with current object state
	updateDisplayData(coords) {
		this.displayData.labelPos = this.labelPos;
		this.displayData.points = (() => {
			let points = [];
			coords.forEach(coord => { points.push(coord.x, coord.y) });
			return points;
		})();

		if (this.isPolygon()) {
			this.displayData.fillStyle = this.fillColour;
			this.displayData.hover.fillStyle = this.fillColourHover;

			this.displayData.strokeStyle = this.strokeColour;
			this.displayData.hover.strokeStyle = this.strokeColourHover;

			this.displayData.lineWidth = this.strokeWidth;
			this.displayData.hover.lineWidth = this.strokeWidthHover;

			let bounds = this.getMaxBounds(true);
			this.width = bounds.maxX - bounds.minX;
			this.height = bounds.maxY - bounds.minY;
		}
	}

	// convert eso coordinates
	convertESOCoords(coords) {
		coords = (!Array.isArray(coords)) ? [structuredClone(coords)] : structuredClone(coords);

		coords.forEach(coord => {
			coord.x = coord.x / nextPowerOfTwo(currentWorld.dbNumTilesX) * currentWorld.dbNumTilesX;
			coord.y = coord.y / nextPowerOfTwo(currentWorld.dbNumTilesY) * currentWorld.dbNumTilesY;
			coord.x = coord.x * currentWorld.maxRangeX;
			coord.y = (1 - coord.y) * currentWorld.maxRangeY;
		})

		return coords;
	}

	// get max bounds of the current location
	getMaxBounds(regen) {
		if (regen ?? this.bounds == null) {
			let coords = (mapConfig.database == "eso") ? this.convertESOCoords(this.coords) : this.coords;
			let bounds = {};
			[bounds.minX, bounds.maxX, bounds.minY, bounds.maxY] = [coords[0].x, coords[0].x, coords[0].y, coords[0].y];
			coords.forEach(coord => {
				bounds.minX = (coord.x < bounds.minX) ? coord.x : bounds.minX;
				bounds.maxX = (coord.x > bounds.maxX) ? coord.x : bounds.maxX;
				bounds.minY = (coord.y < bounds.minY) ? coord.y : bounds.minY;
				bounds.maxY = (coord.y > bounds.maxY) ? coord.y : bounds.maxY;
			});
			this.bounds = bounds;
			return bounds;
		} else {
			return this.bounds;
		}
	}

}