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

		if (world == null) {
			throw new Error("World cannot be null!")
		}

		mapConfig = gamemap.getMapConfig() || DEFAULT_MAP_CONFIG;
		currentWorld = world;

		// set location type
		this.locType = location.locType || LOCTYPES.MARKER;

		// set basic location info
		this.id = location.id || 0;
		this.name = location.name || "";
		this.wikiPage = location.wikiPage || "";
		this.description = location.description || "";
		this.isVisible = (location.visible != null && location.visible == 1 && !location.description.includes("teleport dest")) ? true : false;
		this.displayData = JSON.parse(location.displayData) || {};
		this.worldID = location.worldId || 0;
		this.destinationID = -(location.destinationId) || null;
		this.revisionID = location.revisionId || 0;
		this.displayLevel = parseFloat(location.displayLevel - world.zoomOffset || 0);
		this.legacy = location;

		// set location icon info
		this.icon = location.iconType || null;
		if (this.icon) {
			this.iconSize = mapConfig.iconSize;
		}

		// set coords
		this.coords = [];
		let coordArray = this.displayData.points;
		if (coordArray != null && coordArray.length > 0) {

			let x = [];
			let y = [];

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
				this.coords.push(this.makePoint(coord));
			}

		} else {
			this.coords.push(this.makePoint([location.x, location.y]));
		}

		// set up label info
		if (this.displayData.labelPos != null){
			this.getLabelOffsets(this.displayData.labelPos);
		}

		// set up display info for polygons
		if (this.isPolygon()){

			this.style = {};
			this.style.hover = {};

			if (this.displayData.lineWidth == null){
				this.displayData.lineWidth = 0;
			}

			if (this.displayData.hover == null){
				this.displayData.hover = this.displayData;
			}

			this.style.lineWidth = this.displayData.lineWidth;
			this.style.hover.lineWidth = this.displayData.hover.lineWidth;

			print(this.displayData.fillStyle);

			this.style.fillColour = this.displayData.fillStyle;
			this.style.hover.fillColour = this.displayData.hover.fillStyle;

			this.style.strokeColour = this.displayData.strokeStyle;
			this.style.hover.strokeColour = this.displayData.hover.strokeStyle;

			this.style.strokeWidth = this.displayData.lineWidth;
			this.style.hover.strokeWidth = this.displayData.hover.lineWidth;

		}

	}

	makePoint(coords) {

		let x = coords[0];
		let y = coords[1];

		// convert eso coordinates to normalised
		if (mapConfig.coordType == COORD_TYPES.NORMALISED && mapConfig.database == "eso") {

			// get max range of x and y, assure it is a positive number
			let maxRangeX = Math.abs(currentWorld.maxX - currentWorld.minX);
            let maxRangeY = Math.abs(currentWorld.maxY - currentWorld.minY);

			// get normalised value of x and y in range
            x = (x - currentWorld.minX) / maxRangeX;
			y = Math.abs((y - currentWorld.maxY) / maxRangeY); // flip y around


			if (mapConfig.coordType == COORD_TYPES.NORMALISED) {

				// transform coords to better fit power of two numbers of tiles
				x = (x * nextPowerOfTwo(currentWorld.dbNumTilesX) / currentWorld.dbNumTilesX).toFixed(3);
				y = (y * nextPowerOfTwo(currentWorld.dbNumTilesY) / currentWorld.dbNumTilesY).toFixed(3);
			}
		}

		return new Point(x, y, mapConfig.coordType, currentWorld.maxZoomLevel);
	}

	getTooltipContent() {
		let content = this.name;

		// put icon by the tooltip to indicate that clicking will go to a different map
		if (this.isClickable()){ content += "  <i class='tiny material-icons'>open_in_browser</i>"; }

		content += "<div class='tooltip-desc'>";

		if (this.wikiPage != "" && this.name != this.wikiPage) {
			content += this.description + this.wikiPage + "</div>";
		} else {
			content += this.description + "</div>";
		}

		return content;
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
		return this.locType == LOCTYPES.AREA || this.locType == LOCTYPES.PATH || this.coords.length > 1;
	}

	removePolygon() {
		let coord = this.coords[0];
		this.coords = [];
		this.coords[0] = coord;
	}

	hasIcon() {
		return (this.icon != null);
	}

	hasLabel() {
		return (this.displayData.labelPos != null && this.displayData.labelPos >= 1 && this.name != "");
	}

	isLabel() {
		return (!this.hasIcon && !this.isPolygonal && this.hasLabel);
	}

	isClickable() {
		return this.destinationID != 0 && ((this.destinationID < 0 || this.destinationID > 0));
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

	getLabelOffsets(labelPos) {

		switch (labelPos) {
			case 1:
				// top left
				this.labelDirection = "left";
				break;
			case 2:
				// top
				this.labelDirection = "top";
				break;
			case 3:
				// top right
				this.labelDirection = "right";
			case 4:
				// left
				this.labelDirection = "left";
				break;
			case 5:
				// centre
				this.labelDirection = "center";
				break;
			case 6:
				// right
				this.labelDirection = "right";
				break;
			case 7:
				// bottom left
				this.labelDirection = "left";
				break;
			case 8:
				// bottom
				this.labelDirection = "bottom";
				break;
			case 9:
				// bottom right
				this.labelDirection = "right";
				break;
			default:
				// auto
				this.labelDirection = "auto";
		}
	}

	getCentre() {
		return gamemap.toLatLngs(this.coords);
	}

	// modify location data upon loc type change
	setLocType(locType) {

		// if we were a polygon before and now set to a marker, lose extra coords
		if (this.isPolygon() && locType == LOCTYPES.MARKER) {
			this.removePolygon();
		}

		// if we were an area or a marker before and now set to a polyline, lose the icon
		if ((this.locType == LOCTYPES.MARKER || this.locType == LOCTYPES.AREA) && locType == LOCTYPES.PATH) {
			this.icon = null;
			this.destinationID = null;
			this.labelDirection = null;
		}

		// if we were a path before and are now an area or a marker, add generic icon
		if (this.locType == LOCTYPES.PATH && (locType == LOCTYPES.MARKER || locType == LOCTYPES.AREA)) {
			this.icon = null;
			if (this.labelDirection == null) {
				this.getLabelOffsets(1);
			}
		}

	}

	// get query for saving this location
	getSaveQuery() {
		var query = 'action=set_loc';

		query += `&name=${encodeURIComponent(this.name)}`;
		query += `&description=${encodeURIComponent(this.description)}`;
		query += `&wikipage=${encodeURIComponent(this.wikiPage)}`;

		query += `&locid=${this.id}`;
		query += `&worldid=${this.worldID}`;
		query += `&loctype=${this.locType}`;

		if (this.hasIcon()) {
			query += `&icontype=${encodeURIComponent(this.icon)}`;
			query += `&locheight=${this.iconSize}&locwidth=${this.iconSize}`;
		}

		// query += '&x=' + (this.coords[0].x * gamemap.getWorldFromID(this.worldID).maxX)
		// query += '&y=' + (this.coords[0].y * gamemap.getWorldFromID(this.worldID).maxY);

		query += `&displaylevel=${+this.displayLevel + +gamemap.getWorldFromID(this.worldID).zoomOffset}`;

		query += `&displaydata=${encodeURIComponent(JSON.stringify(this.displayData))}`;

		query += `&destid=${-(this.destinationID)}`;
		query += `&revisionid=${this.revisionID}`;
		query += `&db=${gamemap.getMapConfig().database}&visible=1`;

		//return query;
	}

	// get query for deleting this location
	getDeleteQuery() {

		var query = 'action=enable_loc';

		query += `&locid=${this.id}`;
		query += `&db=${gamemap.getMapConfig().database}&visible=1`;
		query += '&visible=0';

		return query;

	}

}