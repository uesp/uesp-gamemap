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
		this.locType = location.locType || LOCTYPES.NONE;

		// set basic location info
		this.id = location.id || 0;
		this.name = location.name || "";
		this.wikiPage = location.wikiPage || "";
		this.description = location.description || "";
		this.isVisible = (location.visible != null && location.visible == 1 && !location.description.includes("teleport dest")) ? true : false;
		this.displayData = JSON.parse(location.displayData) || {};
		this.worldID = location.worldId || 0;
		this.destinationID = location.destinationId || null;
		this.revisionID = location.revisionId || 0;
		this.displayLevel = parseFloat(location.displayLevel - world.zoomOffset || 0);
		this.legacy = location;

		// set location icon info
		this.icon = location.iconType || null;
		this.iconSize = mapConfig.iconSize;

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

			this.style.fillOpacity = this.displayData.fillStyle.replace(/^.*,(.+)\)/,'$1');
			this.style.hover.fillOpacity = this.displayData.hover.fillStyle.replace(/^.*,(.+)\)/,'$1');

			this.style.strokeOpacity = this.displayData.strokeStyle.replace(/^.*,(.+)\)/,'$1');
			this.style.hover.strokeOpacity = this.displayData.hover.strokeStyle.replace(/^.*,(.+)\)/,'$1');

			this.style.fillColour = RGBAtoHex(this.displayData.fillStyle);
			this.style.hover.fillColour = RGBAtoHex(this.displayData.hover.fillStyle);

			this.style.strokeColour = RGBAtoHex(this.displayData.strokeStyle);
			this.style.hover.strokeColour = RGBAtoHex(this.displayData.hover.strokeStyle);

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

		let popupContent = "<div class='popupTitle'><a "+ this.createWikiLink() +" target='_top'>" + this.name + "</a></div>" +
							"<div class='popupDesc'>" + this.description + "</div>" +
							"<hr/>" +
							"<div class='popupInfo'><b>Internal ID:</b> " + this.id + "</div>";

		if (this.coords.length == 1 ) {
			popupContent += "<div class='popupInfo'><b>Coords: </b> X: " + this.coords[0].x + ", Y: " + this.coords[0].y + "</div>";
		}

		if (this.destinationID != null) {
			popupContent += "<div class='popupInfo'><b>Destination ID:</b> " + this.destinationID + "</div>";
		}

		if (mapConfig.editingEnabled) {
			popupContent += "<hr/> <a style='text-align: center; height: unset; margin-bottom: -8px; width: inherit; line-height: 26px;' class='btn-flat waves-effect'>Edit</a>";
		}

		return popupContent;

	}

	isPolygon(){
		return this.coords.length > 1;
	}

	removePolygon() {
		this.coords = this.coords[0];
	}

	hasIcon() {
		return (this.icon != null)
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
			wikiLink = 'href="' + wikiLink + '"';
		}

		return wikiLink;

	}

	getLabelOffsets(labelPos) {

		switch (labelPos) {
			case 1:
				// top right
				this.labelDirection = "right";
				break;
			case 2:
				// top
				this.labelDirection = "top";
				break;
			case 3:
				// top left
				this.labelDirection = "left";
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

}

// uesp.gamemap.Location.prototype.createSaveQuery = function()
// {
// 	var query = 'action=set_loc';

// 	displayDataJson = JSON.stringify(this.displayData);

// 	query += '&locid=' + this.id;
// 	query += '&worldid=' + this.worldId;
// 	query += '&revisionid=' + this.revisionId;
// 	query += '&loctype=' + this.locType;
// 	query += '&name=' + encodeURIComponent(this.name);
// 	query += '&description=' + encodeURIComponent(this.description);
// 	query += '&wikipage=' + encodeURIComponent(this.wikiPage);
// 	query += '&x=' + this.x;
// 	query += '&y=' + this.y;
// 	query += '&displaydata=' + encodeURIComponent(displayDataJson);
// 	query += '&icontype=' + encodeURIComponent(this.iconType);
// 	query += '&displaylevel=' + this.displayLevel;
// 	query += '&visible=' + (this.visible ? '1' : '0');
// 	query += '&destid=' + this.destinationId;
// 	query += '&locwidth=' + this.width;
// 	query += '&locheight=' + this.height;
// 	query += '&db=' + this.parentMap.mapOptions.dbPrefix;

// 	return query;
// }