/**
 * @name location.js
 * @author Dave Humphrey <dave@uesp.net> (23rd Jan 2014)
 * @summary Contains class definition for the gamemap's locations.
 */

import * as Constants from "../common/constants.js";
import * as Utils from "../common/utils.js";
import Point from "./point.js";

let config;
let numTiles;
let currentWorld;

export default class Location {
	constructor(mapConfig, location, world) {

		// make sure we have a map config
		if (mapConfig == null) {
			mapConfig = DEFAULT_MAP_CONFIG;
		}

		config = mapConfig;
		currentWorld = world;
		numTiles = world.numTilesX;

		// set location type
		this.locType = location.locType || Constants.LOCTYPES.NONE;

		// set basic location info
		this.id = location.id || 0;
		this.name = location.name || "";
		this.wikiPage = location.wikiPage || "";
		this.description = location.description || "";
		this.isVisible = (location.visible != null && location.visible == 1) ? true : false;
		this.displayData = JSON.parse(location.displayData) || {};
		this.worldID = location.worldId || 0;
		this.destinationID = location.destinationId || null;
		this.revisionID = location.revisionId || 0;
		this.displayLevel = location.displayLevel - world.zoomOffset || 0;
		this.legacy = location;

		// set location icon info
		this.icon = location.iconType || null;
		this.iconSize = mapConfig.iconWidth;

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
				this.coords.push(this.getPoint(coord));
			}

		} else {
			this.coords.push(this.getPoint([location.x, location.y]));
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

			this.style.fillColour = Utils.RGBAtoHex(this.displayData.fillStyle);
			this.style.hover.fillColour = Utils.RGBAtoHex(this.displayData.hover.fillStyle);

			this.style.strokeColour = Utils.RGBAtoHex(this.displayData.strokeStyle);
			this.style.hover.strokeColour = Utils.RGBAtoHex(this.displayData.hover.strokeStyle);

			this.style.strokeWidth = this.displayData.lineWidth;
			this.style.hover.strokeWidth = this.displayData.hover.lineWidth;

		}

	}

	getPoint(coords) {
		let x = coords[0];
		let y = coords[1];

		if (config.coordType == Constants.COORD_TYPES.NORMALISED) {

			// get max range of x and y, assure it is a positive number
			let maxRangeX = Math.abs(currentWorld.maxX - currentWorld.minX);
            let maxRangeY = Math.abs(currentWorld.maxY - currentWorld.minY);

			// get normalised value of x and y in range
            x = (x - currentWorld.minX) / maxRangeX;
			y = (config.database == "eso") ? Math.abs((y - currentWorld.maxY) / maxRangeY) : (y - currentWorld.minY) / maxRangeY;

			// transform coords to better fit power of two numbers of tiles
			x = x * Utils.nextPowerOfTwo(numTiles) / numTiles;
			y = y * Utils.nextPowerOfTwo(numTiles) / numTiles;
		}

		return new Point(x, y);
	}

	getTooltipContent() {
		let content = "";

		if (this.wikiPage != "" && this.name != this.wikiPage) {
			content = this.name + "<div class='tooltip-desc'>" + this.description + this.wikiPage + "</div>";
		} else {
			content = this.name + "<div class='tooltip-desc'>" + this.description + "</div>";
		}

		return content;
	}

	getPopupContent() {

		let popupContent = "<div class='gmMapPopupTitle'><a {wikiLink}>" + this.name + "</a></div>" +
							"<div class='gmMapPopupPos'>Coords: {this.x}, {y}</div>" +
							"<div class='gmMapPopupPos'>Internal ID: {id}</div>" +
							"<div class='gmMapPopupDesc'>" + this.description + "</div>";

		if (this.destinationID != 0) {
			popupContent += "<div class='gmMapPopupPos'>Destination ID: " + this.destinationID + "</div>";
		}


		//if (this.useEditPopup) return this.updateEditPopup();

		// if (this.parentMap.canEdit()) {
		// 	popupContent += "<div class='gmMapPopupEditLabel'>Edit...</div>";
		// }

		// if (this.parentMap.canEdit())
		// {
		// 	$('#' + this.popupId + ' .gmMapPopupEditLabel').click(function(event) {
		// 		return self.onClickLocationEditPopup(event);
		// 	});
		// }

		// $('#' + this.popupId + ' .gmMapPopupClose').click(function(event) {
		// 	self.onClosePopup(event);
		// });

		return popupContent;

	}

	getEditPopupContent() {

	}


	isPolygon(){
		return this.coords.length > 1;
	}

	removePolygon() {
		this.coords = this.coords[0];
	}

	hasIcon(){
		return (this.icon != null)
	}

	hasLabel(){
		return (this.displayData.labelPos != null && this.displayData.labelPos >= 1 && this.name != "");
	}

	isLabel(){
		return (!this.hasIcon && !this.isPolygonal && this.hasLabel);
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
		}
	}

}


// uesp.gamemap.Location.prototype.onClickLocationEditPopup = function(event)
// {
// 	if (!this.parentMap.canEdit()) return false;

// 	this.hidePopup();
// 	if (!(this.popupElement == null)) $(this.popupElement).remove();
// 	this.popupElement = null;

// 	this.useEditPopup = true;
// 	this.updateEditPopup();

// 	return true;
// }



// uesp.gamemap.Location.prototype.onCloseEditPopup = function (event)
// {
// 	this.hidePopup();
// 	$(this.popupElement).remove();
// 	this.popupElement = null;
// 	this.useEditPopup = false;

// 		// Special case of a new location that hasn't been saved
// 	if (this.id <= 0)
// 	{
// 		delete this.parentMap.locations[this.id];
// 		this.removeElements();
// 		this.parentMap.redrawCanvas();
// 	}

// }


// uesp.gamemap.Location.prototype.setPopupEditNotice = function (Msg, MsgType)
// {
// 	if (this.popupElement == null) return;

// 	$status = $('#' + this.popupId + ' .gmMapEditPopupStatus');
// 	if ($status == null) return;

// 	$status.html(Msg);
// 	$status.removeClass('gmMapEditPopupStatusOk');
// 	$status.removeClass('gmMapEditPopupStatusNote');
// 	$status.removeClass('gmMapEditPopupStatusWarning');
// 	$status.removeClass('gmMapEditPopupStatusError');

// 	if (MsgType == null || MsgType === 'ok')
// 		$status.addClass('gmMapEditPopupStatusOk');
// 	else if (MsgType === 'note')
// 		$status.addClass('gmMapEditPopupStatusNote');
// 	else if (MsgType === 'warning')
// 		$status.addClass('gmMapEditPopupStatusWarning');
// 	else if (MsgType === 'error')
// 		$status.addClass('gmMapEditPopupStatusError');
// }


// uesp.gamemap.Location.prototype.enablePopupEditButtons = function (enable)
// {
// 	if (this.popupElement == null) return;
// 	this.popupElement.find('input[type="button"]').attr('disabled', enable ? null : 'disabled');
// }


// uesp.gamemap.Location.prototype.onSaveEditPopup = function (event)
// {
// 	if (!this.parentMap.canEdit()) return false;
// 	if (this.popupElement == null) return false;

// 	this.setPopupEditNotice('Saving location...');
// 	this.enablePopupEditButtons(false);

// 	this.iconImage = null;

// 	this.getFormData();

// 	this.updateOffset();
// 	this.update();

// 	this.doSaveQuery();

// 	this.parentMap.redrawCanvas();
// }


// uesp.gamemap.Location.prototype.onDeleteEditPopup = function (event)
// {
// 	if (!this.parentMap.canEdit()) return false;
// 	if (this.popupElement == null) return false;

// 		//Special case of a new location not yet saved
// 	if (this.id < 0)
// 	{
// 		this.visible = false;

// 		this.removeElements();

// 		delete this.parentMap.locations[this.id];

// 		this.parentMap.redrawCanvas();
// 		return true;
// 	}

// 	this.setPopupEditNotice('Saving location...');

// 	this.getFormData();
// 	this.visible = false;

// 	this.updateOffset();
// 	this.update();

// 	this.doSaveQuery();
// }


// uesp.gamemap.Location.prototype.getFormData = function()
// {
// 	if (!this.parentMap.canEdit()) return false;

// 	form = $('#' + this.popupId + ' form');
// 	if (form == null) return false;

// 	formValues = uesp.getFormData(form);

// 	formValues.displayLevel = parseInt(formValues.displayLevel);
// 	if (formValues.displayLevel < this.parentMap.mapOptions.minZoomLevel) formValues.displayLevel = this.parentMap.mapOptions.minZoomLevel;
// 	if (formValues.displayLevel > this.parentMap.mapOptions.maxZoomLevel) formValues.displayLevel = this.parentMap.mapOptions.maxZoomLevel;

// 	formValues.x = parseInt(formValues.x);
// 	formValues.y = parseInt(formValues.y);
// 	formValues.iconType = parseInt(formValues.iconType);
// 	formValues.destinationId = parseInt(formValues.destinationId);

// 	if (this.locType > 1)
// 	{
// 		formValues.displayData.lineWidth = parseInt(formValues.displayData.lineWidth);
// 		formValues.displayData.hover.lineWidth = parseInt(formValues.displayData.hover.lineWidth);

// 		this.locType = formValues.isArea ? uesp.gamemap.LOCTYPE_AREA : uesp.gamemap.LOCTYPE_PATH;
// 		delete formValues.isArea;
// 	}

// 	formValues.displayData.labelPos = parseInt(formValues.displayData.labelPos);

// 	if (this.locType == 1) formValues.displayData.points = [formValues.x, formValues.y];

// 	if (formValues.visible == null)
// 		formValues.visible = false;
// 	else
// 		formValues.visible = parseInt(formValues.visible) != 0;

// 	uesp.gamemap.mergeObjects(this.displayData, formValues.displayData);
// 	delete formValues.displayData;

// 	uesp.gamemap.mergeObjects(this, formValues);
// 	this.computeOffset();

// 	if (this.id < 0 && this.wikiPage === "") this.wikiPage = this.name;

// 	return true;
// }

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


// uesp.gamemap.Location.prototype.onSavedLocation = function (data)
// {
// 	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Received onSavedLocation data");
// 	uesp.logDebug(uesp.LOG_LEVEL_WARNING, data);

// 	if (!(data.isError == null) || data.success === false)
// 	{
// 		this.setPopupEditNotice('Error saving location data!', 'error');
// 		this.enablePopupEditButtons(true);
// 		return false;
// 	}

// 	this.setPopupEditNotice('Successfully saved location!');
// 	this.enablePopupEditButtons(true);

// 	if (!(data.newLocId == null))
// 	{
// 		this.parentMap.updateLocationId(this.id, data.newLocId)
// 		this.id = data.newLocId;
// 		this.updateEditPopup();
// 	}

// 	if (data.newRevisionId != null) this.revisionId = data.newRevisionId;

// 	this.useEditPopup = false;
// 	this.hidePopup();
// 	this.popupElement.remove();
// 	this.popupElement = null;

// 	if (!this.visible)
// 	{
// 		this.removeElements();
// 		this.parentMap.redrawCanvas();
// 	}
// 	else if (this.displayLevel > this.parentMap.zoomLevel)
// 	{
// 		this.removeElements();
// 		this.parentMap.redrawCanvas();
// 	}

// 	return true;
// }


// uesp.gamemap.Location.prototype.doSaveQuery = function()
// {
// 	var self = this;

// 	queryParams = this.createSaveQuery();

// 	$.getJSON(this.parentMap.mapOptions.gameDataScript, queryParams, function(data) {
// 		self.onSavedLocation(data);
// 	});

// 	return true;
// }


// uesp.gamemap.Location.prototype.onJumpToDestination = function()
// {
// 	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Jumping to destination " + this.destinationId);
// 	this.parentMap.jumpToDestination(this.destinationId);
// 	return false;
// }


// uesp.gamemap.Location.prototype.updateEditPopupIconPreview = function ()
// {
// 	var iconPreview = $(this.popupElement).find(".gmMapEditPopupIconPreview");

// 	iconTypeElement = $(this.popupElement).find("input[name=iconType]");
// 	if (iconTypeElement == null || iconTypeElement.length == 0) iconTypeElement = $(this.popupElement).find("select[name=iconType]");

// 	iconType = parseInt(iconTypeElement.val());
// 	imageURL = this.parentMap.mapOptions.iconPath + iconType + ".png";

// 	if (iconType <= 0)
// 		iconPreview.css('background-image', '');
// 	else
// 		iconPreview.css('background-image', 'url(' + imageURL + ')');

// 	return true;
// }


// uesp.gamemap.Location.prototype.onUpdateCurrentZoomEditPopup = function (event)
// {
// 	$('#' + this.popupId + ' .gmMapEditPopupCurrentZoom').text('Current Zoom = ' + this.parentMap.zoomLevel);
// }


// uesp.gamemap.Location.prototype.updateEditPopup = function ()
// {
// 	var popupDiv;
// 	var pathContent = '';
// 	var pathButtons = '';
// 	var pathCheckbox = '';

// 	if (this.locType > 1)
// 	{
// 		pathContent = 	"<div class='gmMapEditPopupLabel'>Fill Style</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='displayData.fillStyle' value='{displayData.fillStyle}' size='14'  maxlength='100' /><br />" +
// 						"<div class='gmMapEditPopupLabel'>Stroke Style</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='displayData.strokeStyle' value='{displayData.strokeStyle}' size='14'  maxlength='100' /> " +
// 							" &nbsp; Width:" +
// 							"<input type='text' class='gmMapEditPopupInput' name='displayData.lineWidth' value='{displayData.lineWidth}' size='2'  maxlength='10' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Hover Fill Style</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.fillStyle' value='{displayData.hover.fillStyle}' size='14'  maxlength='100' /><br />" +
// 						"<div class='gmMapEditPopupLabel'>Hover Stroke</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.strokeStyle' value='{displayData.hover.strokeStyle}' size='14'  maxlength='100' /> " +
// 							" &nbsp; Width:" +
// 							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.lineWidth' value='{displayData.hover.lineWidth}' size='2'  maxlength='10' /> <br />" +
// 						"";
// 		pathButtons = 	"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonEditHandle' value='Edit Handles' />";
// 		pathCheckbox = 	" &nbsp; &nbsp; &nbsp; Is Area <input type='checkbox' class='gmMapEditPopupInput' name='isArea' value='1' />";
// 	}
// 	else
// 	{
// 		pathButtons = "<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonDrag' value='Set Pos' />";
// 	}

// 		//TODO: Proper permission checking for edit/add/delete abilities
// 		//TODO: Proper template functionality
// 		//TODO: Better function organization/shorter
// 	var popupContent =	"<form onsubmit='return false;'>" +
// 						"<div class='gmMapEditPopupTitle'>Editing Location</div>" +
// 						"<div class='gmMapPopupClose'><img src='images/cancelicon.png' width='12' height='12' /></div><br />" +
// 						"<div class='gmMapEditPopupLabel'>Name</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name=\"name\" value=\"{name}\" size='24' maxlength='100' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Enabled</div>" +
// 							"<input type='checkbox' class='gmMapEditPopupInput' name='visible' value='1' />" +
// 							pathCheckbox +
// 							"<br />" +
// 						"<div class='gmMapEditPopupLabel'>Position</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='x' value='{x}' size='8' maxlength='10' /> " +
// 							"<input type='text' class='gmMapEditPopupInput' name='y' value='{y}' size='8' maxlength='10' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Wiki Page</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name=\"wikiPage\" value=\"{wikiPage}\" size='24' maxlength='100' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Description</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name=\"description\" value=\"{description}\" size='24' maxlength='500' /> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Display Level</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='displayLevel' value='{displayLevel}' size='8' maxlength='10' />" +
// 							"<div class='gmMapEditPopupCurrentZoom'>Current Zoom = </div> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Icon Type</div>" +
// 							this.getIconTypeCustomList(this.iconType) +
// 							"<div class='gmMapEditPopupIconPreview'></div>" +
// 							"<br />" +
// 						"<div class='gmMapEditPopupLabel'>Label Position</div>" +
// 							"<select class='gmMapEditPopupInput' name='displayData.labelPos'>" +
// 							this.getLabelPosSelectOptions(this.displayData.labelPos) +
// 							"</select> <br />" +
// 						"<div class='gmMapEditPopupLabel'>Destination ID</div>" +
// 							"<input type='text' class='gmMapEditPopupInput' name='destinationId' value='{destinationId}' size='8' maxlength='10' /> &nbsp; + for location, - for world<br />" +
// 						pathContent +
// 						"<div class='gmMapEditPopupLabel'>locationId</div>" +
// 							"<div class='gmMapEditPopupInput'>{id}</div> &nbsp; " +
// 							"<div class='gmMapEditPopupInput'>World: {worldId}</div> &nbsp; " +
// 							"<div class='gmMapEditPopupInput'>Type: {locType}</div> &nbsp;" +
// 							"<div class='gmMapEditPopupInput'>Rev: {revisionId}</div> <br />" +
// 						"<div class='gmMapEditPopupStatus'></div>" +
// 						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonDelete' value='Delete' />" +
// 						pathButtons +
// 						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonSave' value='Save' />" +
// 						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonClose' value='Cancel' />" +
// 						"</form>";

// 	this.wikiLink = this.createWikiLink();

// 	if (this.popupElement == null)
// 	{
// 		this.popupId = "locPopup" + this.getNextPopupId();

// 		this.popupElement = $('<div />').addClass('gmMapPopupRoot')
// 				.attr('id', this.popupId)
// 				.appendTo(this.parentMap.mapRoot);

// 		popupDiv = $('<div />').addClass('gmMapEditPopup')
// 				.appendTo(this.popupElement);

// 		$('<div />').addClass('gmMapPopupDownArrow')
// 				.appendTo(this.popupElement);
// 	}
// 	else
// 	{
// 		popupDiv = this.popupElement.children()[0];
// 	}

// 	popupHtml = uesp.templateEsc(popupContent, this);
// 	$(popupDiv).html(popupHtml);

// 	this.createIconTypeCustomListEvents();
// 	this.setIconTypeCustomListValue(this.iconType);

// 	$(popupDiv).find('input[name=visible]').prop('checked', this.visible);
// 	$(popupDiv).find('input[name=isArea]').prop('checked', this.locType == uesp.gamemap.LOCTYPE_AREA);

// 	if (this.id < 0) this.setPopupEditNotice('New location not yet saved.', 'warning');

// 	var self = this;

// 	$(popupDiv).find('input[name=name]').focus();

// 	$('#' + this.popupId + ' .gmMapPopupClose').click(function(event) {
// 		self.onCloseEditPopup(event);
// 	});

// 	$(popupDiv).find('.gmMapIconTypeListContainer').keydown(function(event) {
// 		self.showIconTypeCustomList();
// 		self.scrollIconTypeCustomList();

// 		self.popupElement.find(".gmMapIconTypeList").trigger(event);
// 		event.preventDefault();
// 	});

// 	if (this.parentMap.mapOptions.iconTypeMap == null)
// 	{
// 		$('#' + this.popupId + ' input[name=iconType]').keyup(function() {
// 			self.updateEditPopupIconPreview();
// 		});
// 	}
// 	else
// 	{
// 		$('#' + this.popupId + ' select[name=iconType]').change(function() {
// 			self.updateEditPopupIconPreview();
// 		});
// 	}

// 	$('#' + this.popupId + ' input[name=name]').blur(function(e) {
// 		self.onEditLocationNameBlur(e);
// 	});

// 	$('#' + this.popupId + ' input[name=displayLevel]').on('focus keydown', function(event) {
// 		self.onUpdateCurrentZoomEditPopup(event);
// 	});

// 	$('#' + this.popupId + ' .gmMapEditPopupButtonClose').click(function(event) {
// 		self.onCloseEditPopup(event);
// 	});

// 	$('#' + this.popupId + ' .gmMapEditPopupButtonSave').click(function(event) {
// 		self.onSaveEditPopup(event);
// 	});

// 	$('#' + this.popupId + ' .gmMapEditPopupButtonDelete').click(function(event) {
// 		self.onDeleteEditPopup(event);
// 	});

// 	$('#' + this.popupId + ' .gmMapEditPopupButtonDrag').click(function(event) {
// 		self.onDragEditPopup(event);
// 	});

// 	$('#' + this.popupId + ' .gmMapEditPopupButtonEditHandle').click(function(event) {
// 		self.onEditHandlesEditPopup(event);
// 	});

// 	this.onUpdateCurrentZoomEditPopup();
// 	this.updateEditPopupIconPreview();
// 	this.updatePopupOffset();

// 	if (this.locType > 1) this.updatePath();
// }


// uesp.gamemap.Location.prototype.onEditLocationNameBlur = function(event)
// {
// 	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onEditLocationNameBlur");

// 		/* Only works on new locations on their first edit */
// 	if (this.isFirstEdit == null || this.isFirstEdit === false) return;
// 	if (this.id > 0) return;

// 	var nameInput = this.popupElement.find("input[name=name]");

// 	rawNameValue = nameInput.val();
// 	nameValue = rawNameValue.toLowerCase();
// 	if (nameValue == null || nameValue === "") return;

// 	var iconType = this.popupElement.find("input[name=iconType]");
// 	var displayLevel = this.popupElement.find("input[name=displayLevel]");
// 	var labelPos = this.popupElement.find("select[name='displayData.labelPos']");
// 	var wikiPage = this.popupElement.find("input[name=wikiPage]");

// 		// TODO: Don't hardcode values?
// 	if (nameValue == "skyshard")
// 	{
// 		this.setIconTypeCustomListValue(75);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 		wikiPage.val("Skyshard");
// 	}
// 	else if (nameValue == "chest")
// 	{
// 		this.setIconTypeCustomListValue(83);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "fishing hole")
// 	{
// 		this.setIconTypeCustomListValue(36);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "ayleid well")
// 	{
// 		this.setIconTypeCustomListValue(131);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 	}
// 	else if (nameValue == "heavy sack" || nameValue == "heavy crate")
// 	{
// 		this.setIconTypeCustomListValue(89);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "cooking fire")
// 	{
// 		this.setIconTypeCustomListValue(28);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "alchemy station")
// 	{
// 		this.setIconTypeCustomListValue(84);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "enchanting station")
// 	{
// 		this.setIconTypeCustomListValue(85);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "enchanting table")
// 	{
// 		nameInput.val("Enchanting Station");	//To be consistent with everything else named as "station"
// 		this.setIconTypeCustomListValue(85);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "jewelry station" || nameValue == "jewel station" || nameValue == "jewelry crafting station")
// 	{
// 		nameInput.val("Jewelry Crafting Station");
// 		this.setIconTypeCustomListValue(215);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "blacksmith station")
// 	{
// 		this.setIconTypeCustomListValue(86);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "clothing station")
// 	{
// 		this.setIconTypeCustomListValue(88);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "woodworking station")
// 	{
// 		this.setIconTypeCustomListValue(87);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "ayleid well")
// 	{
// 		this.setIconTypeCustomListValue(0);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel-1);
// 		labelPos.val(6);
// 	}
// 	else if (nameValue == "imperial camp")
// 	{
// 		this.setIconTypeCustomListValue(0);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel-1);
// 		labelPos.val(6);
// 	}
// 	else if (nameValue == "lorebook" || nameValue == "lore book")
// 	{
// 		this.setIconTypeCustomListValue(76);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (uesp.endsWith(nameValue, "wayshrine"))
// 	{
// 		this.setIconTypeCustomListValue(19);
// 		displayLevel.val(this.parentMap.mapOptions.minZoomLevel);
// 		labelPos.val(0);
// 		wikiPage.val(rawNameValue);
// 	}
// 	else if (uesp.endsWith(nameValue, "world event"))
// 	{
// 		this.setIconTypeCustomListValue(140);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 		wikiPage.val(rawNameValue);
// 	}
// 	else if (uesp.endsWith(nameValue, "crafting node"))
// 	{
// 		this.setIconTypeCustomListValue(90);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (uesp.endsWith(nameValue, "container"))
// 	{
// 		this.setIconTypeCustomListValue(91);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue.indexOf("treasure map") !== -1)
// 	{
// 		this.setIconTypeCustomListValue(79);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel - 1);
// 		labelPos.val(0);
// 	}
// 	else if (uesp.endsWith(nameValue, "dolmen"))
// 	{
// 		this.setIconTypeCustomListValue(69);
// 		displayLevel.val(this.parentMap.mapOptions.minZoomLevel-2);
// 		wikiPage.val(rawNameValue);
// 	}
// 	else if (nameValue == "dark fissure")
// 	{
// 		this.setIconTypeCustomListValue(129);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 		wikiPage.val(rawNameValue);
// 	}
// 	else if (nameValue == "celestial rift")
// 	{
// 		this.setIconTypeCustomListValue(128);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 		wikiPage.val(rawNameValue);
// 	}
// 	else if (uesp.endsWith(nameValue, "fighters guild"))
// 	{
// 		this.setIconTypeCustomListValue(30);
// 		displayLevel.val(this.parentMap.mapOptions.minZoomLevel+2);
// 		labelPos.val(0);
// 		wikiPage.val(rawNameValue);
// 	}
// 	else if (uesp.endsWith(nameValue, "mages guild"))
// 	{
// 		this.setIconTypeCustomListValue(35);
// 		displayLevel.val(this.parentMap.mapOptions.minZoomLevel+2);
// 		labelPos.val(0);
// 		wikiPage.val(rawNameValue);
// 	}
// 	else if (uesp.beginsWith(nameValue, "safebox") || uesp.beginsWith(nameValue, "strongbox") || uesp.beginsWith(nameValue, "lockbox"))
// 	{
// 		this.setIconTypeCustomListValue(143);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 		wikiPage.val("Safebox");
// 	}
// 	else if (nameValue == "dye station" || nameValue == "outfit station")
// 	{
// 		this.setIconTypeCustomListValue(135);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "fence")
// 	{
// 		this.setIconTypeCustomListValue(133);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "hiding spot")
// 	{
// 		this.setIconTypeCustomListValue(170);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "thieves trove")
// 	{
// 		this.setIconTypeCustomListValue(167);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}
// 	else if (nameValue == "psijic portal")
// 	{
// 		this.setIconTypeCustomListValue(204);
// 		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
// 		labelPos.val(0);
// 	}

// 	//this.isFirstEdit = false;
// }



// uesp.gamemap.Location.prototype.updateLabelOffset = function ()
// {
// 	if (this.labelElement == null) return;

// 	$(this.labelElement).offset( { left: this.offsetLeft - this.labelOffsetLeft, top: this.offsetTop - this.labelOffsetTop + 8 });
// }












// uesp.gamemap.Location.prototype.createWikiLinkHref = function()
// {
// 	wikiLink = this.createWikiLink();
// 	if (wikiLink == "") return ""
// 	return 'href="' + wikiLink + '"';
// }


// uesp.gamemap.Location.prototype.createWikiLink = function()
// {
// 	if (this.parentMap.mapOptions.wikiNamespace != null && this.parentMap.mapOptions.wikiNamespace.length > 0)
// 	{
// 		if (this.wikiPage == "") return "";

// 		if (this.wikiPage.indexOf(":") >= 0)
// 		{
// 			var safeWikiPage = encodeURIComponent(this.wikiPage).replace("%3A", ":").replace("%2F", "/");
// 			return this.parentMap.mapOptions.wikiUrl + safeWikiPage;
// 		}
// 		else
// 		{
// 			return this.parentMap.mapOptions.wikiUrl + this.parentMap.mapOptions.wikiNamespace + ':' + encodeURIComponent(this.wikiPage);
// 		}
// 	}

// 	if (this.wikiPage == "") return "";
// 	return this.parentMap.mapOptions.wikiUrl + encodeURIComponent(this.wikiPage);
// }


// uesp.gamemap.Location.prototype.update = function ()
// {
// 	if (this.locType == uesp.gamemap.LOCTYPE_POINT)
// 	{
// 		this.updateIcon();
// 		this.updateLabel();
// 	}
// 	else if (this.locType == uesp.gamemap.LOCTYPE_PATH)
// 	{
// 		this.updateIcon();
// 		this.updateLabel();
// 		this.updatePath();
// 	}
// 	else if (this.locType == uesp.gamemap.LOCTYPE_AREA)
// 	{
// 		this.updateIcon();
// 		this.updateLabel();
// 		this.updatePath();
// 	}
// }


// uesp.gamemap.Location.prototype.getLabelPosSelectOptions = function (selectedValue)
// {
// 	var options = '';

// 	for (key in uesp.gamemap.Location.LABEL_POSITIONS)
// 	{
// 		options += "<option value='" + key + "' " + (selectedValue == key ? "selected": "") + ">" + uesp.gamemap.Location.LABEL_POSITIONS[key] + "  (" + key.toString() + ")</option>\n";
// 	}

// 	return options;
// }


// uesp.gamemap.Location.prototype.hideIconTypeCustomList = function()
// {
// 	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
// 	var iconTypeListHeader = this.popupElement.find('.gmMapIconTypeListHeader');

// 	if (iconTypeList.length == 0) return false;

// 	iconTypeListHeader.removeClass('gmMapIconTypeListHeaderOpen');
// 	iconTypeList.hide();

// 	return true;
// }


// uesp.gamemap.Location.prototype.showIconTypeCustomList = function()
// {
// 	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
// 	var iconTypeListHeader = this.popupElement.find('.gmMapIconTypeListHeader');

// 	if (iconTypeList.length == 0) return false;

// 	iconTypeListHeader.addClass('gmMapIconTypeListHeaderOpen');

// 	iconTypeList.show().focus();
// }


// uesp.gamemap.Location.prototype.setIconTypeCustomListValue = function(iconType)
// {
// 	listHeader= this.popupElement.find('.gmMapIconTypeListHeader');
// 	if (listHeader == null) return;

// 	if (this.parentMap.mapOptions.iconTypeMap == null)
// 	{
// 		listHeader.text(iconType);
// 		return;
// 	}

// 	if (iconType <= 0)
// 	{
// 		iconLabel = "None";
// 	}
// 	else
// 	{
// 		iconLabel = this.parentMap.mapOptions.iconTypeMap[iconType];
// 	}

// 	listHeader.text(iconLabel);
// 	this.popupElement.find('.gmMapIconTypeListContainer input[name="iconType"]').val(iconType);
// 	this.updateEditPopupIconPreview(iconType);
// }


// uesp.gamemap.Location.prototype.selectIconTypeCustomList = function(iconType)
// {
// 	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');

// 	iconTypeList.find('.gmMapIconTypeLabel').removeClass('gmMapIconTypeLabelSelected');
// 	iconTypeList.find('.gmMapIconTypeValue:contains("' + iconType + '")').first().next().addClass('gmMapIconTypeLabelSelected');
// }


// uesp.gamemap.Location.prototype.changeSelectIconTypeCustomList = function(deltaSelect)
// {
// 	var $iconTypeList = this.popupElement.find('.gmMapIconTypeList');
// 	selectedElement = $iconTypeList.find('.gmMapIconTypeLabelSelected');
// 	curElement = selectedElement.parent();

// 	while (deltaSelect != 0)
// 	{
// 		if (deltaSelect < 0)
// 		{
// 			nextElement = curElement.prev();
// 			deltaSelect += 1;
// 		}
// 		else
// 		{
// 			nextElement = curElement.next();
// 			deltaSelect -= 1;
// 		}

// 		if (nextElement == null || nextElement.length == 0) break;
// 		curElement = nextElement;
// 	}

// 	selectedElement.removeClass('gmMapIconTypeLabelSelected');
// 	curElement.find('.gmMapIconTypeLabel').addClass('gmMapIconTypeLabelSelected');
// 	this.scrollIconTypeCustomList();
// }


// uesp.gamemap.Location.prototype.scrollIconTypeCustomList = function()
// {
// 	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
// 	selectedElement = iconTypeList.find('.gmMapIconTypeLabelSelected').first();

// 	if (selectedElement == null)
// 	{
// 		iconTypeList.scrollTop(0);
// 		return;
// 	}

// 	iconTypeList.scrollTop(selectedElement.offset().top - iconTypeList.offset().top + iconTypeList.scrollTop() - 20);
// }


// uesp.gamemap.Location.prototype.createIconTypeCustomListEvents = function()
// {
// 	var self = this;
// 	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
// 	var listHeader = this.popupElement.find('.gmMapIconTypeListHeader');

// 	listHeader.click(function (e) {
// 		self.showIconTypeCustomList();
// 		self.scrollIconTypeCustomList();
// 	});

// 	iconTypeList.find('li').mousedown(function (e) {
// 		iconType = $(e.target).parents('li').find('.gmMapIconTypeValue').text();
// 		self.setIconTypeCustomListValue(iconType);
// 		self.selectIconTypeCustomList(iconType);
// 		self.hideIconTypeCustomList();
// 	});

// 	iconTypeList.on('DOMMouseScroll mousewheel', { self: this }, function (event) {
// 		self = event.data.self;
// 		deltaY = -20;
// 		if (event.originalEvent.detail > 0 || event.originalEvent.wheelDelta < 0) deltaY = -deltaY;

// 		iconTypeList.scrollTop(iconTypeList.scrollTop() + deltaY);

// 		event.preventDefault();
// 		return false;
// 	});

// 	iconTypeList.blur(function (e) {
// 		self.hideIconTypeCustomList();
// 	});

// 	listHeader.keydown(function (event) {

// 		if (isNaN(event.which))
// 			charPressed = event.which.toLowerCase();
// 		else
// 			charPressed = String.fromCharCode(event.which).toLowerCase();

// 		if (event.keyCode == 13 || event.keyCode == 40 || event.keyCode == 38 || event.keyCode == 36 || event.keyCode == 35 || event.keyCode == 33 || event.keyCode == 34)
// 		{
// 			self.showIconTypeCustomList();
// 			self.popupElement.find('.gmMapIconTypeList').trigger(event);
// 		}
// 		else if (charPressed >= 'a' && charPressed <= 'z')
// 		{
// 			self.showIconTypeCustomList();
// 			self.popupElement.find('.gmMapIconTypeList').trigger(event);
// 		}
// 		else if (event.keyCode == 27)
// 		{
// 			self.hideIconTypeCustomList();
// 		}

// 	});

// 	iconTypeList.keydown(function (event) {
// 		event.preventDefault();

// 		if (isNaN(event.which))
// 			charPressed = event.which.toLowerCase();
// 		else
// 			charPressed = String.fromCharCode(event.which).toLowerCase();

// 		if (event.keyCode == 27)	//esc
// 		{
// 			self.hideIconTypeCustomList();
// 		}
// 		else if (event.keyCode == 13) //enter
// 		{
// 			selectedElement = iconTypeList.find('.gmMapIconTypeLabelSelected').first();
// 			iconType = selectedElement.prev().text();
// 			self.setIconTypeCustomListValue(iconType);
// 			self.hideIconTypeCustomList();
// 		}
// 		else if (event.keyCode == 40) //down
// 		{
// 			self.changeSelectIconTypeCustomList(1);
// 		}
// 		else if (event.keyCode == 38) //up
// 		{
// 			self.changeSelectIconTypeCustomList(-1);
// 		}
// 		else if (event.keyCode == 36) //home
// 		{
// 			self.changeSelectIconTypeCustomList(-1000);
// 		}
// 		else if (event.keyCode == 35) //end
// 		{
// 			self.changeSelectIconTypeCustomList(1000);
// 		}
// 		else if (event.keyCode == 33) //pageup
// 		{
// 			self.changeSelectIconTypeCustomList(-10);
// 		}
// 		else if (event.keyCode == 34) //pagedown
// 		{
// 			self.changeSelectIconTypeCustomList(10);
// 		}
// 		else if (charPressed >= 'a' && charPressed <= 'z')
// 		{
// 			var $target = iconTypeList.find('.gmMapIconTypeLabel').filter(function () {
// 				return $(this).text()[0].toLowerCase() == charPressed;
// 			}).first();

// 			if ($target.length == 0) return false;

// 			iconTypeList.find('.gmMapIconTypeLabelSelected').removeClass('gmMapIconTypeLabelSelected');
// 			$target.addClass('gmMapIconTypeLabelSelected');
// 			self.scrollIconTypeCustomList();
// 		}

// 		return false;
// 	});
// }


// uesp.gamemap.Location.prototype.getIconTypeCustomList = function(currentIconType)
// {
// 	if (this.parentMap.mapOptions.iconTypeMap == null) return '';

// 	var reverseIconTypeMap = { };
// 	var sortedIconTypeArray = [ ];

// 	for (key in this.parentMap.mapOptions.iconTypeMap)
// 	{
// 		var keyValue = this.parentMap.mapOptions.iconTypeMap[key];
// 		reverseIconTypeMap[keyValue] = key;
// 		sortedIconTypeArray.push(keyValue);
// 	}

// 	sortedIconTypeArray.sort();

// 	var output = "<div tabindex='0' class='gmMapIconTypeListContainer'>";
// 	output += "<div class='gmMapIconTypeListHeader'></div>"
// 	output += "<input type='hidden' name='iconType' value='{iconType}' />";
// 	output += "<ul tabindex='0' class='gmMapIconTypeList' style='display: none'>";
// 	output += "<li><div class='gmMapIconTypeValue'>0</div><div class='gmMapIconTypeLabel" + (currentIconType == 0 ? ' gmMapIconTypeLabelSelected' : '') + "'> None</div></li>";

// 	for (key in sortedIconTypeArray)
// 	{
// 		iconTypeLabel = sortedIconTypeArray[key];
// 		iconType = reverseIconTypeMap[iconTypeLabel];

// 		output += "<li><div class='gmMapIconTypeValue'>" + iconType + "</div><div class='gmMapIconTypeLabel" + (currentIconType == iconType ? ' gmMapIconTypeLabelSelected' : '') + "'>" + iconTypeLabel;
// 		output += "<img src='" + this.parentMap.mapOptions.iconPath + iconType + ".png' />";
// 		output += "</div></li>";
// 	}

// 	output += "</ul></div>"
// 	return output;

// }


// uesp.gamemap.Location.prototype.getIconTypeSelectOptions = function (selectedValue)
// {
// 	if (this.parentMap.mapOptions.iconTypeMap == null) return '';

// 	var reverseIconTypeMap = { };
// 	var sortedIconTypeArray = [ ];

// 	for (key in this.parentMap.mapOptions.iconTypeMap)
// 	{
// 		var keyValue = this.parentMap.mapOptions.iconTypeMap[key];
// 		reverseIconTypeMap[keyValue] = key;
// 		sortedIconTypeArray.push(keyValue);
// 	}

// 	sortedIconTypeArray.sort();

// 	var options = "<option value='0' " + (selectedValue == 0 ? "selected": "") + ">None (0)</option>\n";

// 	for (key in sortedIconTypeArray)
// 	{
// 		iconTypeName = sortedIconTypeArray[key];
// 		iconType = reverseIconTypeMap[iconTypeName];

// 		options += "<option value='" + iconType + "' " + (selectedValue == iconType ? "selected": "") + ">" + iconTypeName + "  (" + iconType + ")</option>\n";
// 	}

// 	return options;
// }


// uesp.gamemap.Location.prototype.convertIconTypeToString = function (iconType)
// {
// 	if (this.parentMap == null || this.parentMap.mapOptions.iconTypeMap == null)
// 	{
// 		return iconType.toString();
// 	}

// 	if (iconType in this.parentMap.mapOptions.iconTypeMap) return this.parentMap.mapOptions.iconTypeMap[iconType];
// 	return iconType.toString();
// }
