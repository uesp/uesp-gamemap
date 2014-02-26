/*
 * location.js -- Created by Dave Humphrey (dave@uesp.net) on 23 Jan 2014
 * 		Released under the GPL v2
 *
 */


uesp.gamemap.LOCTYPE_NONE  = 0;
uesp.gamemap.LOCTYPE_POINT = 1;
uesp.gamemap.LOCTYPE_PATH  = 2;
uesp.gamemap.LOCTYPE_AREA  = 3;


uesp.gamemap.Location = function(parentMap)
{
	this.parentMap = parentMap;
	
	this.id = 0;
	this.worldId = 0;
	this.revisionId = 0;
	this.destinationId = 0;
	this.iconType = 0;
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;
	this.name = "";
	this.description = "";
	this.wikiPage = "";
	this.wikiLink = "";
	this.locType = uesp.gamemap.LOCTYPE_NONE;
	this.displayLevel = 0;
	this.visible = false;
	
	this.useEditPopup = false;
	this.editPathHandles = false;
	this.lastHoverPathHandle = -1;
	this.draggingPathHandle = -1;
	this.lastSelectedPathHandle = -1;
	this.dragStartX = 0;
	this.dragStartY = 0;
	
	this.displayData = {};
	
	this.labelElement = null;
	this.iconElement  = null;
	this.popupElement = null;
	this.pathElement  = null;
	
	this.offsetLeft = 0;
	this.offsetTop  = 0;
	this.labelOffsetLeft = 0;
	this.labelOffsetTop  = 0;
	
	//this.iconFile = 0;
	//this.editorId = 0;
	//this.formId = 0;
	//this.points = [];
	//this.fontSize = 8;
	//this.fontColor = '#ff9999';
	//this.customStyle = '';
	//this.customClass = '';
}


uesp.gamemap.Location.PATH_EDITHANDLE_SIZE = 8;
uesp.gamemap.Location.PATH_EDITHANDLE_COLOR = '#ffffff';
uesp.gamemap.Location.PATH_EDITHANDLE_COLOR_HOVER = '#990000';
uesp.gamemap.Location.PATH_EDITHANDLE_COLOR_SELECTED = '#ff0000';
uesp.gamemap.Location.PATH_EDITHANDLE_COLOR_DRAGGING = '#ff0000';
uesp.gamemap.Location.nextPopupId = 100;


uesp.gamemap.Location.prototype.getNextPopupId = function ()
{
	NextId = uesp.gamemap.Location.nextPopupId;
	uesp.gamemap.Location.nextPopupId += 1;
	return NextId;
}


uesp.gamemap.Location.prototype.isInBounds = function (mapBounds)
{
		//TODO: Proper checking for all location types
	
	if (mapBounds.left < mapBounds.right)
	{
		if (this.x < mapBounds.left || this.x > mapBounds.right) return false;
	}
	else
	{
		if (this.x > mapBounds.left || this.x < mapBounds.right) return false;
	}
	
	if (mapBounds.bottom < mapBounds.top)
	{
		if (this.y < mapBounds.bottom || this.y > mapBounds.top)   return false;		
	}
	else
	{
		if (this.y > mapBounds.bottom || this.y < mapBounds.top)   return false;
	}
	
	return true;
}


uesp.gamemap.Location.prototype.hideElements = function (duration)
{
	if ( !(this.labelElement == null)) $(this.labelElement).hide(duration);
	if ( !(this.iconElement  == null)) $(this.iconElement).hide(duration);
	if ( !(this.pathElement  == null)) $(this.pathElement).hide(duration);
	if ( !(this.popupElement == null)) $(this.popupElement).hide(duration);
}


uesp.gamemap.Location.prototype.showElements = function (duration)
{
	if ( !(this.labelElement == null)) $(this.labelElement).show(duration);
	if ( !(this.iconElement  == null)) $(this.iconElement).show(duration);
	if ( !(this.pathElement  == null)) $(this.pathElement).show(duration);
	
	this.updateLabelOffset();
	this.updateIconOffset();
	this.updatePathOffset();
}


uesp.gamemap.Location.prototype.mergeFromJson = function(data)
{
	uesp.gamemap.mergeObjects(this, data);
	
	if (!uesp.gamemap.isNullorUndefined(data.displayData))
	{
		this.displayData = jQuery.parseJSON( this.displayData );
	}
	
	//this.name = encodeURIComponent(this.name);
	//this.description = encodeURIComponent(this.description);
	//this.wikiPage = encodeURIComponent(this.wikiPage);
}


uesp.gamemap.Location.prototype.removeElements = function ()
{
	if ( !(this.labelElement == null)) $(this.labelElement).remove();
	if ( !(this.iconElement  == null)) $(this.iconElement).remove();
	if ( !(this.popupElement == null)) $(this.popupElement).remove();
	if ( !(this.pathElement  == null)) $(this.pathElement).remove();
	
	this.labelElement = null;
	this.iconElement  = null;
	this.popupElement = null;
	this.pathElement  = null;
}


uesp.gamemap.Location.prototype.shiftElements = function (shiftX, shiftY)
{
	if ( !(this.labelElement == null))
	{
		curOffset = $(this.labelElement).offset();
	
		$(this.labelElement).offset({
			left: curOffset.left - shiftX,
			top : curOffset.top  - shiftY
		});
	}
	
	if ( !(this.iconElement == null))
	{
		curOffset = $(this.iconElement).offset();
	
		$(this.iconElement).offset({
			left: curOffset.left - shiftX,
			top : curOffset.top  - shiftY
		});
	}
	
	if ( !(this.popupElement == null))
	{
		curOffset = $(this.popupElement).offset();
	
		$(this.popupElement).offset({
			left: curOffset.left - shiftX,
			top : curOffset.top  - shiftY
		});
	}
	
	if ( !(this.pathElement == null))
	{
		curOffset = $(this.pathElement).offset();
	
		$(this.pathElement).offset({
			left: curOffset.left - shiftX,
			top : curOffset.top  - shiftY
		});
	}
	
}


uesp.gamemap.Location.prototype.onLabelClick = function()
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Label Click", self);
	this.togglePopup();
}


uesp.gamemap.Location.prototype.onLabelDblClick = function()
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Label Double-Click", self);
	
	if (this.parentMap.canEdit())
	{
		this.hidePopup();
		delete this.popupElement;
		this.popupElement = null;
		
		this.useEditPopup = true;
		this.showPopup();
		
		return;
	}
	
	if (this.destinationId > 0) this.onJumpToDestination(); 
}


uesp.gamemap.Location.prototype.onLabelClickFunction = function()
{
	var self = this;
	return function() { self.onLabelClick(); };
}


uesp.gamemap.Location.prototype.onLabelDblClickFunction = function()
{
	var self = this;
	return function() { self.onLabelDblClick(); }
}


uesp.gamemap.Location.prototype.updateLabel = function ()
{
	var labelPos = 0;
	
	if ( !(this.displayData.labelPos == null) ) labelPos = this.displayData.labelPos;
	
	if (labelPos === 0)
	{
		if (! (this.labelElement == null))
		{
			$(this.labelElement).remove();
			delete this.labelElement;
			this.labelElement = null;
		}
		
		return true;
	}
	
	if (this.labelElement == null)
	{
		this.labelElement = $('<div />').addClass('gmMapLoc')
			.appendTo(this.parentMap.mapRoot)
			.click(this.onLabelClickFunction())
			.dblclick(this.onLabelDblClickFunction())
			.attr('unselectable', 'on')
			.css('user-select', 'none')
			.on('selectstart', false);
	}
	
	var labelWidth = this.name.length*6 + 2;
	
	switch (labelPos) {
		case 1:
			anchorPoint = 'bottomRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + 8;
			this.labelOffsetTop  = 26;
			break;
		case 2:
			anchorPoint = 'bottomCenter';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = 26;
			break;
		case 3:
			anchorPoint = 'bottomLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = 8;
			this.labelOffsetTop  = 26;
			break;
		case 4:
			anchorPoint = 'midRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + 8;
			this.labelOffsetTop  = 16;
			break;
		case 5:
			anchorPoint = 'center';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = 16;
			break;
		case 6:
		default:
			anchorPoint = 'midLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = -8;
			this.labelOffsetTop  = 16;
			break;
			
		case 7:
			anchorPoint = 'topRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + 8;
			this.labelOffsetTop  = 4;
			break;
		case 8:
			anchorPoint = 'topCenter';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = 4;
			break;
		case 9:
			anchorPoint = 'topLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = 8;
			this.labelOffsetTop  = 4;
			break;
	}
	
	$(this.labelElement).css({ textAlign: labelTextAlign, width: labelWidth });
	$(this.labelElement).text(this.name);
	
	this.updateLabelOffset();
}


uesp.gamemap.Location.prototype.updateIcon = function ()
{
	var missingURL = this.parentMap.mapOptions.iconPath + this.parentMap.mapOptions.iconMissing;
	var imageURL   = this.parentMap.mapOptions.iconPath + this.iconType + ".png";
	
	if (this.iconType == 0)
	{
		if (!(this.iconElement == null))
		{
			this.iconElement.remove();
			this.iconElement = null;
		}
		return true;
	}
	
	if (this.iconElement == null)
	{	
		this.iconElement = $('<div />')
				.addClass('gmMapLocIconDiv')
				.appendTo(this.parentMap.mapRoot);
		
		$('<span />').addClass('gmMapLocIconHelper').appendTo(this.iconElement);
		
		imageElement = $('<img />').addClass('gmMapLocIcon')
			.load(uesp.gamemap.onLoadIconSuccess)
			.error(uesp.gamemap.onLoadIconFailed(missingURL))
			.attr('src', imageURL)
			.click(this.onLabelClickFunction())
			.dblclick(this.onLabelDblClickFunction())
			.attr('unselectable', 'on')
			.css('user-select', 'none')
			.on('selectstart', false)
			.appendTo(this.iconElement);
	}
	else
	{
		$(this.iconElement.children()[1]).attr('src', imageURL);
	}
	
	this.updateIconOffset();
}


uesp.gamemap.Location.prototype.showPopup = function ()
{
	if (this.popupElement == null) this.updatePopup();
	this.popupElement.show();
}


uesp.gamemap.Location.prototype.hidePopup = function ()
{
	if (this.popupElement == null) return;
	this.popupElement.hide();
}


uesp.gamemap.Location.prototype.togglePopup = function ()
{
	if (this.popupElement == null) return this.updatePopup();
	
	if ($(this.popupElement).is(":visible") )
	{
		$(this.popupElement).hide();
	}
	else
	{
		$(this.popupElement).show();
		this.updatePopupOffset();
	}
}


uesp.gamemap.onCloseLocationPopup = function(element)
{
	$(element.parentNode.parentNode.parentNode).hide();
	return true;
}


uesp.gamemap.onCloseLocationEditPopup = function(element)
{
	$(element.parentNode.parentNode.parentNode).hide();
	return true;
}


uesp.gamemap.Location.prototype.onClickLocationEditPopup = function(event)
{
	if (!this.parentMap.canEdit()) return false;
	
	this.hidePopup();
	if (!(this.popupElement == null)) $(this.popupElement).remove();
	this.popupElement = null;
	
	this.useEditPopup = true;
	this.updateEditPopup();
	
	return true;
}


uesp.gamemap.Location.prototype.onClosePopup = function (event)
{
	this.hidePopup();
}


uesp.gamemap.Location.prototype.onCloseEditPopup = function (event)
{
	this.hidePopup();
	$(this.popupElement).remove();
	this.popupElement = null;
	this.useEditPopup = false;
}


uesp.gamemap.Location.prototype.setPopupEditNotice = function (Msg, MsgType)
{
	if (this.popupElement == null) return;
	
	$status = $('#' + this.popupId + ' .gmMapEditPopupStatus');
	if ($status == null) return;
	
	$status.html(Msg);
	$status.removeClass('gmMapEditPopupStatusOk');
	$status.removeClass('gmMapEditPopupStatusNote');
	$status.removeClass('gmMapEditPopupStatusWarning');
	$status.removeClass('gmMapEditPopupStatusError');
	
	if (MsgType == null || MsgType === 'ok')
		$status.addClass('gmMapEditPopupStatusOk');
	else if (MsgType === 'note')
		$status.addClass('gmMapEditPopupStatusNote');
	else if (MsgType === 'warning')
		$status.addClass('gmMapEditPopupStatusWarning');
	else if (MsgType === 'error')
		$status.addClass('gmMapEditPopupStatusError');
}


uesp.gamemap.Location.prototype.onSaveEditPopup = function (event)
{
	if (!this.parentMap.canEdit()) return false;
	if (this.popupElement == null) return false;
	
	this.setPopupEditNotice('Saving location...');
	
	this.getFormData();

	this.updateOffset();
	this.update();
	
	this.doSaveQuery();
}


uesp.gamemap.Location.prototype.onDeleteEditPopup = function (event)
{
	if (!this.parentMap.canEdit()) return false;
	if (this.popupElement == null) return false;
	
	//this.setPopupEditNotice('Delete not yet implemented!', 'error');
	this.setPopupEditNotice('Saving location...');
	
	this.getFormData();
	this.visible = false;
	
	this.updateOffset();
	this.update();
	
	this.doSaveQuery();
}


uesp.gamemap.Location.prototype.onEditHandlesEditPopup = function (event)
{
	this.popupElement.hide();
	this.editPathHandles = true;
	this.lastHoverPathHandle = -1;
	this.lastSelectedPathHandle = -1;
	this.draggingPathHandle = -1;
	this.parentMap.onEditPathHandlesStart(this);
}


uesp.gamemap.Location.prototype.getFormData = function()
{
	if (!this.parentMap.canEdit()) return false;
	
	form = $('#' + this.popupId + ' form');
	if (form == null) return false;
	
	formValues = {};
	
	$.each(form.serializeArray(), function(i, field) {
		fields = field.name.split('.');
		
		if (fields.length == 1)
		{
			formValues[field.name] = field.value;
		}
		else if (fields.length == 2)
		{
			if (formValues[fields[0]] == null) formValues[fields[0]] = { };
			formValues[fields[0]][fields[1]] = field.value;
		}
		else if (fields.length == 3)
		{
			if (formValues[fields[0]][fields[1]] == null) formValues[fields[0]][fields[1]] = { };
			formValues[fields[0]][fields[1]][fields[2]] = field.value;
		}
		else
		{
			uesp.logError("Too many nested levels in form name'" + field.name + "'!");
		}
	});
	
	formValues.displayLevel = parseInt(formValues.displayLevel);
	formValues.x = parseInt(formValues.x);
	formValues.y = parseInt(formValues.y);
	formValues.iconType = parseInt(formValues.iconType);
	formValues.destinationId = parseInt(formValues.destinationId);
	
	if (this.locType > 1)
	{
		formValues.displayData.lineWidth = parseInt(formValues.displayData.lineWidth);
		formValues.displayData.hover.lineWidth = parseInt(formValues.displayData.hover.lineWidth);
		
		this.locType = formValues.isArea ? uesp.gamemap.LOCTYPE_AREA : uesp.gamemap.LOCTYPE_PATH;
		delete formValues.isArea;
	}
	
	formValues.displayData.labelPos = parseInt(formValues.displayData.labelPos);
	
	if (this.locType == 1) formValues.displayData.points = [formValues.x, formValues.y];
	
	if (formValues.visible == null)
		formValues.visible = false;
	else
		formValues.visible = parseInt(formValues.visible) != 0;
	
	uesp.gamemap.mergeObjects(this.displayData, formValues.displayData);
	delete formValues.displayData;
	uesp.gamemap.mergeObjects(this, formValues);
	
	this.computeOffset();
	
	return true;
}


uesp.gamemap.Location.prototype.computeOffset = function()
{
	pixelPos = this.parentMap.convertGameToPixelPos(this.x + this.width/2, this.y - this.height/2);
	this.offsetLeft = pixelPos.x;
	this.offsetTop  = pixelPos.y;
}


uesp.gamemap.Location.prototype.createSaveQuery = function()
{
	var query = 'action=set_loc';
	
	displayDataJson = JSON.stringify(this.displayData);
	
	query += '&locid=' + this.id;
	query += '&worldid=' + this.worldId;
	query += '&loctype=' + this.locType;
	query += '&name=' + encodeURIComponent(this.name);
	query += '&description=' + encodeURIComponent(this.description);
	query += '&wikipage=' + encodeURIComponent(this.wikiPage);
	query += '&x=' + this.x;
	query += '&y=' + this.y;
	query += '&displaydata=' + encodeURIComponent(displayDataJson);
	query += '&icontype=' + encodeURIComponent(this.iconType);
	query += '&displaylevel=' + this.displayLevel;
	query += '&visible=' + (this.visible ? '1' : '0');
	query += '&destid=' + this.destinationId;
	query += '&locwidth=' + this.width;
	query += '&locheight=' + this.height;
	
	if (this.locType > 1)
	{
		
	}
	
	return query;
}


uesp.gamemap.Location.prototype.onSavedLocation = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Received onSavedLocation data");
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, data);
	
	if (!(data.isError == null) || data.success === false)
	{
		this.setPopupEditNotice('Error saving location data!', 'error');
		return false;
	}
	
	this.setPopupEditNotice('Successfully saved location!');
	
	if (!(data.newLocId == null))
	{
		this.parentMap.updateLocationId(this.id, data.newLocId)
		this.id = data.newLocId;
		this.updateEditPopup();
	}
	
	this.useEditPopup = false;
	this.hidePopup();
	this.popupElement.remove();
	this.popupElement = null;
	
		// TODO: Temporay way to delete elements
	if (!this.visible)
	{
		this.removeElements();
	}
	
	return true;
}


uesp.gamemap.Location.prototype.doSaveQuery = function()
{
	var self = this;
	
	queryParams = this.createSaveQuery();
	
	$.getJSON(this.parentMap.mapOptions.gameDataScript, queryParams, function(data) {
		self.onSavedLocation(data); 
	});
	
	return true;
}


uesp.gamemap.Location.prototype.onJumpToDestination = function()
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Jumping to destination " + this.destinationId);
	this.parentMap.jumpToDestination( this.destinationId);
	return false;
}


uesp.gamemap.Location.prototype.updateEditPopupIconPreview = function ()
{
	var iconPreview = $(this.popupElement).find(".gmMapEditPopupIconPreview");
	
	iconTypeElement = $(this.popupElement).find("input[name=iconType]");
	if (iconTypeElement == null || iconTypeElement.length == 0) iconTypeElement = $(this.popupElement).find("select[name=iconType]");
	
	imageURL = this.parentMap.mapOptions.iconPath + parseInt(iconTypeElement.val()) + ".png";
	
	iconPreview.css('background-image', 'url(' + imageURL + ')');
	return true;
}


uesp.gamemap.Location.prototype.onUpdateCurrentZoomEditPopup = function (event)
{
	$('#' + this.popupId + ' .gmMapEditPopupCurrentZoom').text('Current Zoom = ' + this.parentMap.zoomLevel);
}


uesp.gamemap.Location.prototype.updateEditPopup = function ()
{
	var popupDiv;
	var iconTypeInput;
	
	if (this.parentMap.mapOptions.iconTypeMap == null)
	{
		iconTypeInput = "<input type='text' class='gmMapEditPopupInput' name='iconType' value='{iconType}' size='8' />";
	}
	else
	{
		iconTypeInput = "<select class='gmMapEditPopupInput' name='iconType'>" +
						this.getIconTypeSelectOptions(this.iconType) + "</select>";
	}
	
	var pathContent = '';
	var pathButtons = '';
	var pathCheckbox = '';
	
	if (this.locType > 1)
	{
		pathContent = 	"<div class='gmMapEditPopupLabel'>Fill Style</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayData.fillStyle' value='{displayData.fillStyle}' size='14' /><br />" +
						"<div class='gmMapEditPopupLabel'>Stroke Style</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayData.strokeStyle' value='{displayData.strokeStyle}' size='14' /> " +
							" &nbsp; Width:" + 
							"<input type='text' class='gmMapEditPopupInput' name='displayData.lineWidth' value='{displayData.lineWidth}' size='2' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Hover Fill Style</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.fillStyle' value='{displayData.hover.fillStyle}' size='14' /><br />" +
						"<div class='gmMapEditPopupLabel'>Hover Stroke</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.strokeStyle' value='{displayData.hover.strokeStyle}' size='14' /> " +
							" &nbsp; Width:" + 
							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.lineWidth' value='{displayData.hover.lineWidth}' size='2' /> <br />" +
						"";
		pathButtons = 	"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonEditHandle' value='Edit Handles' />";
		pathCheckbox = 	" &nbsp; &nbsp; &nbsp; Is Area <input type='checkbox' class='gmMapEditPopupInput' name='isArea' value='1' />";
	}
	
		//TODO: Proper permission checking for edit/add/delete abilities
		//TODO: Proper template functionality
		//TODO: Better function organization/shorter
	var popupContent =	"<form onsubmit='return false;'>" +
						"<div class='gmMapEditPopupTitle'>Editing Location</div>" + 
						"<div class='gmMapPopupClose'><img src='images/cancelicon.png' width='12' height='12' /></div><br />" +
						"<div class='gmMapEditPopupLabel'>Name</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='name' value='{name}' size='24' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Enabled</div>" +
							"<input type='checkbox' class='gmMapEditPopupInput' name='visible' value='1' />" +
							pathCheckbox + 
							"<br />" +
						"<div class='gmMapEditPopupLabel'>Position</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='x' value='{x}' size='8' /> " +
							"<input type='text' class='gmMapEditPopupInput' name='y' value='{y}' size='8' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Wiki Page</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='wikiPage' value='{wikiPage}' size='24' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Description</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='description' value='{description}' size='24' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Display Level</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayLevel' value='{displayLevel}' size='8' />" + 
							"<div class='gmMapEditPopupCurrentZoom'>Current Zoom = </div> <br />" +
						"<div class='gmMapEditPopupLabel'>Icon</div>" +
							iconTypeInput +
							"<div class='gmMapEditPopupIconPreview'></div>" + 
							"<br />" +
						"<div class='gmMapEditPopupLabel'>Label Position</div>" +
							"<select class='gmMapEditPopupInput' name='displayData.labelPos'>" +
							this.getLabelPosSelectOptions(this.displayData.labelPos) + 
							"</select> <br />" +
						"<div class='gmMapEditPopupLabel'>Destination ID</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='destinationId' value='{destinationId}' size='8' /> <br />" +
						pathContent +
						"<div class='gmMapEditPopupLabel'>Internal ID</div>" +
							"<div class='gmMapEditPopupInput'>{id}</div> &nbsp; " + 
							"<div class='gmMapEditPopupInput'>World ID: {worldId}</div> &nbsp; " +
							"<div class='gmMapEditPopupInput'>Type: {locType}</div> <br />" +
						"<div class='gmMapEditPopupStatus'></div>" +
						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonDelete' value='Delete' />" +
						pathButtons + 
						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonSave' value='Save' />" +
						"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonClose' value='Cancel' />" +
						"</form>";
	
	this.wikiLink = this.createWikiLink();
	
	if (this.popupElement == null)
	{
		this.popupId = "locPopup" + this.getNextPopupId();
		
		this.popupElement = $('<div />').addClass('gmMapPopupRoot')
				.attr('id', this.popupId)
				.appendTo(this.parentMap.mapRoot);
		
		popupDiv = $('<div />').addClass('gmMapEditPopup')
				.appendTo(this.popupElement);
		
		$('<div />').addClass('gmMapPopupDownArrow')
				.appendTo(this.popupElement);
	}
	else
	{
		popupDiv = this.popupElement.children()[0];
	}
	
	popupHtml = uesp.template(popupContent, this);
	$(popupDiv).html(popupHtml);
	
	$(popupDiv).find('input[name=visible]').prop('checked', this.visible);
	$(popupDiv).find('input[name=isArea]').prop('checked', this.locType == uesp.gamemap.LOCTYPE_AREA);
	
	if (this.id < 0) this.setPopupEditNotice('New location not yet saved.', 'warning');
	
	var self = this;
	
	$('#' + this.popupId + ' .gmMapPopupClose').click(function(event) {
		self.onCloseEditPopup(event);
	});
	
	if (this.parentMap.mapOptions.iconTypeMap == null)
	{
		$('#' + this.popupId + ' input[name=iconType]').keyup(function() {
			self.updateEditPopupIconPreview();
		});
	}
	else
	{
		$('#' + this.popupId + ' select[name=iconType]').change(function() {
			self.updateEditPopupIconPreview();
		});
	}
	
	$('#' + this.popupId + ' input[name=displayLevel]').on('focus keydown', function(event) {
		self.onUpdateCurrentZoomEditPopup(event);
	});
	
	$('#' + this.popupId + ' .gmMapEditPopupButtonClose').click(function(event) {
		self.onCloseEditPopup(event);
	});
	
	$('#' + this.popupId + ' .gmMapEditPopupButtonSave').click(function(event) {
		self.onSaveEditPopup(event);
	});
	
	$('#' + this.popupId + ' .gmMapEditPopupButtonDelete').click(function(event) {
		self.onDeleteEditPopup(event);
	});
	
	$('#' + this.popupId + ' .gmMapEditPopupButtonEditHandle').click(function(event) {
		self.onEditHandlesEditPopup(event);
	});

	this.onUpdateCurrentZoomEditPopup();
	this.updateEditPopupIconPreview();
	this.updatePopupOffset();
	
	if (this.locType > 1) this.updatePath();
}


uesp.gamemap.Location.prototype.updatePopup = function ()
{
	
	if (this.useEditPopup) return this.updateEditPopup();
	
	var popupDiv;
	var popupContent =  "<div class='gmMapPopupClose'><img src='images/cancelicon.png' width='12' height='12' /></div>" + 
						"<div class='gmMapPopupTitle'><a href='{wikiLink}'>{name}</a></div>" + 
						"<div class='gmMapPopupPos'>Location: {x}, {y}</div>" +
						"<div class='gmMapPopupPos'>Internal ID: {id}</div>" +
						"<div class='gmMapPopupDesc'>{description}</div>";
	
	this.wikiLink = this.createWikiLink();
	
	if (this.popupElement == null)
	{
		this.popupId = "locPopup" + this.getNextPopupId();
		
		this.popupElement = $('<div />').addClass('gmMapPopupRoot')
				.attr('id', this.popupId)
				.appendTo(this.parentMap.mapRoot);
		
		popupDiv = $('<div />').addClass('gmMapPopup')
				.appendTo(this.popupElement);
		
		$('<div />').addClass('gmMapPopupDownArrow')
				.appendTo(this.popupElement);
	}
	else
	{
		popupDiv = this.popupElement.children()[0];
	}
	
	if (this.destinationId > 0) popupContent += "<div class='gmMapPopupPos'>Destination ID: {destinationId}</div>";
	
	if (this.parentMap.canEdit())
	{
		popupContent += "<div class='gmMapPopupEditLabel'>Edit...</div>";
	}
	
	popupHtml = uesp.template(popupContent, this);
	$(popupDiv).html(popupHtml);
	
	var self = this;
	
	if (this.parentMap.canEdit())
	{
		$('#' + this.popupId + ' .gmMapPopupEditLabel').click(function(event) {
			return self.onClickLocationEditPopup(event);
		});
	}
	
	$('#' + this.popupId + ' .gmMapPopupClose').click(function(event) {
		self.onClosePopup(event);
	});
	
	if (this.destinationId > 0)
	{
		if (!this.parentMap.hasLocation(this.destinationId)) this.parentMap.retrieveLocation(this.destinationId);
		
		var self = this;
		
		newDiv = $('<div />').addClass('gmMapPopupDesc')
				.appendTo(popupDiv);
		
		$('<a></a>').attr('href', '#')
				.html('Jump To Destination')
				.click(function(event) {
					self.onJumpToDestination();
					event.preventDefault();
					return false;
				})
				.appendTo(newDiv);
		
	}
	
	this.updatePopupOffset();
}


uesp.gamemap.Location.prototype.updateLabelOffset = function ()
{
	if (this.labelElement == null) return;
	
	$(this.labelElement).offset( { left: this.offsetLeft - this.labelOffsetLeft, top: this.offsetTop - this.labelOffsetTop + 8 });
}


uesp.gamemap.Location.prototype.updateIconOffset = function ()
{
	if (this.iconElement == null) return;
	
	$(this.iconElement).offset( { left: this.offsetLeft - $(this.iconElement).width()/2, top: this.offsetTop - $(this.iconElement).height()/2 });
}


uesp.gamemap.Location.prototype.updatePopupOffset = function ()
{
	if (this.popupElement == null) return;
	
	$(this.popupElement).offset( { left: this.offsetLeft - $(this.popupElement).width()/2, top: this.offsetTop - $(this.popupElement).height() - 8 });
}


uesp.gamemap.Location.prototype.updatePathOffset = function ()
{
	if (this.pathElement == null) return;
	
	pixelPos = this.parentMap.convertGameToPixelPos(this.x, this.y);
	
	$(this.pathElement).offset( { left: pixelPos.x, top: pixelPos.y });
}


uesp.gamemap.Location.prototype.updatePathSize = function (redraw)
{
	if (this.locType < uesp.gamemap.LOCTYPE_PATH) return;
	if (this.pathElement == null) return;
	
	if (redraw == null) redraw = true;
	
	var pixelSize = this.parentMap.convertGameToPixelSize(this.width, this.height);
	this.pixelWidth  = pixelSize.x;
	this.pixelHeight = pixelSize.y;
	
	this.pathElement.attr( { width: this.pixelWidth, height: this.pixelHeight });
	
	if (redraw)
	{
		var context = this.pathElement[0].getContext('2d');
		
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.translate(-this.x * this.pixelWidth / this.width, -(this.y - this.height) * this.pixelHeight / this.height);
		context.scale(this.pixelWidth / this.width, this.pixelHeight / this.height);
		
		context.clearRect(this.x, this.y - this.height, this.width, this.height);
		
		this.drawPath(context);
		if (this.editPathHandles) this.drawPathHandles(context);
	}
}


uesp.gamemap.Location.prototype.drawPathHandles = function (context)
{
	
	for (i = 0; i < this.displayData.points.length; i += 2)
	{
		this.drawPathHandle(i, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR, context);
	}
	
}

uesp.gamemap.Location.prototype.getContextScale = function ()
{
	if (this.pixelWidth == 0 || this.width == 0) return 1.0;
	return (this.pixelWidth / this.width);
}


uesp.gamemap.Location.prototype.drawPathHandle = function (index, fillColor, context)
{
	if (index < 0 || index >= this.displayData.points.length-1) return false;
	
	if (context == null)
	{
		context = this.getContext();
		if (context == null) return false;
	}
	
	if (fillColor == null) fillColor = uesp.gamemap.Location.PATH_EDITHANDLE_COLOR;
	
	handleSize = uesp.gamemap.Location.PATH_EDITHANDLE_SIZE / this.getContextScale();
	
	x = this.displayData.points[index] - handleSize/2;
	y = this.y * 2 - this.displayData.points[index+1] - this.height - handleSize/2;
	
	context.beginPath();
	context.fillStyle = fillColor;
	context.fillRect(x, y, handleSize, handleSize);
	
	return true;
}


uesp.gamemap.Location.prototype.drawPath = function (context)
{
	var i = 0;
	
	avgScale = (this.pixelWidth / this.width + this.pixelHeight / this.height) / 2.0;
	if (avgScale === 0) avgScale = 1;
	
	context.beginPath();
	
	while (i + 1 < this.displayData.points.length)
	{
		if (i == 0)
			context.moveTo(this.displayData.points[i], this.y * 2 - this.displayData.points[i+1] - this.height);
		else
			context.lineTo(this.displayData.points[i], this.y * 2 - this.displayData.points[i+1] - this.height);
		
		i += 2;
	}
	
	if (this.locType == uesp.gamemap.LOCTYPE_AREA)
	{
		context.closePath();
		
		if (this.editPathHandles)
			context.fillStyle = 'rgba(255,255,255,0.4)';
		else
			context.fillStyle = this.displayData.fillStyle;
		
		context.fill();
	}
	
	if (this.editPathHandles)
	{
		context.strokeStyle = 'rgba(0,0,0,1)';
		context.lineWidth = 1 / avgScale;
	}
	else
	{
		context.lineWidth = this.displayData.lineWidth / avgScale;
		context.strokeStyle = this.displayData.strokeStyle;
	}
	
	context.stroke();
}


uesp.gamemap.Location.prototype.updateOffset = function (x, y, animate)
{
	if (!(x == null))
	{
		this.offsetLeft = x;
		this.offsetTop  = y;
		
		if (animate === true)
		{
			//deltaX = curOffset.left - x;
			//deltaY = curOffset.top  - y;
			//curOffset  = $(this.labelElement).offset();
			//if (curOffset.left == xPos && curOffset.top == yPos) return;
			
				// TODO: Doesn't currently work perfectly...
			//$(this.labelElement).animate({ left: "-=" + deltaX + "px", top: "-=" + deltaY + "px" }, 100);
			//return;
		}
	}
	
	this.updateLabelOffset();
	this.updateIconOffset();
	this.updatePopupOffset();
	this.updatePathOffset();
}


uesp.gamemap.Location.prototype.onPathEditHandlesDragMove = function (event)
{
	x = this.displayData.points[this.draggingPathHandle];
	y = this.displayData.points[this.draggingPathHandle + 1];
	
	newPixelX = event.pageX;
	newPixelY = event.pageY;
	
	newGamePos = this.parentMap.convertPixelToGamePos(newPixelX, newPixelY);
	
	this.displayData.points[this.draggingPathHandle  ] = newGamePos.x;
	this.displayData.points[this.draggingPathHandle+1] = newGamePos.y;
	
	this.computePathSize();
	this.updateFormPosition();
	this.computeOffset();
	this.updatePath();
	
	return true;
}


uesp.gamemap.Location.prototype.updateFormPosition = function (x, y)
{
	if (x == null) x = this.x;
	if (y == null) y = this.y;
	
	$(this.popupElement).find('input[name=x]').val(x);
	$(this.popupElement).find('input[name=y]').val(y);
}


uesp.gamemap.Location.prototype.onPathEditHandlesMouseMove = function (event)
{
	avgScale = (this.pixelWidth / this.width + this.pixelHeight / this.height) / 2.0;
	if (avgScale === 0) avgScale = 1;
	
	handleSize = uesp.gamemap.Location.PATH_EDITHANDLE_SIZE / avgScale;
	gamePos = this.parentMap.convertPixelToGamePos(event.pageX, event.pageY);
	
	for (i = 0; i < this.displayData.points.length; i += 2)
	{
		x1 = this.displayData.points[i] - handleSize/2;
		y1 = this.displayData.points[i+1] - handleSize/2;
		x2 = x1 + handleSize;
		y2 = y1 + handleSize;
		
		if (gamePos.x >= x1 && gamePos.x <= x2 && gamePos.y >= y1 && gamePos.y <= y2)
		{
			this.pathElement.css('cursor', 'pointer');
			if (this.lastHoverPathHandle == i) return true;
			
			if (this.lastHoverPathHandle >= 0)
			{
				this.drawPathHandle(this.lastHoverPathHandle, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR);
			}
			
			this.drawPathHandle(i, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR_HOVER);
			this.lastHoverPathHandle = i;
			
			return true;
		}
	}
	
	if (this.lastHoverPathHandle >= 0)
	{
		this.drawPathHandle(this.lastHoverPathHandle, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR);
	}
	
	this.lastHoverPathHandle = -1;
	this.pathElement.css('cursor', '');
	return false;
}


uesp.gamemap.Location.prototype.onPathMouseMove = function (event)
{
	var ca = event.target;
	var co = ca.getContext('2d');
	var offset = $(ca).offset();
	
	if (this.draggingPathHandle >= 0) return this.onPathEditHandlesDragMove(event);
	if (this.editPathHandles) return this.onPathEditHandlesMouseMove(event);
	
	if (this.useEditPopup && this.popupElement != null) return false;
	
	avgScale = (this.pixelWidth / this.width + this.pixelHeight / this.height) / 2.0;
	if (avgScale === 0) avgScale = 1;
	
	co.clearRect(this.x, this.y - this.height, this.width, this.height);

	if (co.isPointInPath(event.pageX - offset.left, event.pageY - offset.top) )
	{
		if (this.locType == uesp.gamemap.LOCTYPE_AREA)
		{
			co.fillStyle = this.displayData.hover.fillStyle;
			co.fill();
		}
		
		co.lineWidth = this.displayData.hover.lineWidth / avgScale;
		co.strokeStyle = this.displayData.hover.strokeStyle;
		co.stroke();
	}
	else
	{
		if (this.locType == uesp.gamemap.LOCTYPE_AREA)
		{
			co.fillStyle = this.displayData.fillStyle;
			co.fill();
		}
		
		co.lineWidth = this.displayData.lineWidth / avgScale;
		co.strokeStyle = this.displayData.strokeStyle;
		co.stroke();
	}
}


uesp.gamemap.Location.prototype.onPathEditHandlesDragStart = function (event, pointIndex)
{
	this.draggingPathHandle = pointIndex;
	this.dragStartX = event.pageX;
	this.dragStartY = event.pageY;
	return true;
}


uesp.gamemap.Location.prototype.onPathEditHandlesMouseDown = function (event)
{
	if (this.lastHoverPathHandle < 0) return false;
	
	if (event.ctrlKey) return this.onPathEditHandlesDelete(this.lastHoverPathHandle);
	
	this.onPathEditHandlesDragStart(event, this.lastHoverPathHandle);
	
	return false;
}


uesp.gamemap.Location.prototype.onPathEditHandlesDelete = function (pointIndex)
{
	if (pointIndex < 0) return false;
	if (pointIndex >= this.displayData.points.length-1) return false;
	
	if (pointIndex == this.lastHoverPathHandle) this.lastHoverPathHandle = -1;
	if (pointIndex == this.lastSelectedPathHandle) this.lastSelectedPathHandle = -1;
	if (pointIndex == this.draggingPathHandle) this.draggingPathHandle = -1;
	
	this.displayData.points.splice(pointIndex, 2);
	
	this.computePathSize();
	this.updateFormPosition();
	this.computeOffset();
	this.updatePath();
	
	return true;
}


uesp.gamemap.Location.prototype.onPathEditHandlesDragEnd = function (event)
{
	this.draggingPathHandle = -1;
	this.updatePath();
	return false;
}


uesp.gamemap.Location.prototype.computePathSize = function ()
{
	if (this.displayData.points.length <= 0) return;
	
	xMin = this.displayData.points[0];
	yMin = this.displayData.points[1];
	xMax = xMin;
	yMax = yMin;
	
	for (i = 2; i < this.displayData.points.length; i += 2)
	{
		x = this.displayData.points[i];
		y = this.displayData.points[i+1];
		
		if (x < xMin) xMin = x;
		if (y < yMin) yMin = y;
		if (x > xMax) xMax = x;
		if (y > yMax) yMax = y;
	}
	
		//TODO: Proper handling of inverse coordinate systems
	this.x = xMin;
	this.y = yMax;
	
	this.width  = xMax - xMin;
	this.height = yMax - yMin;
	
	return true;
}


uesp.gamemap.Location.prototype.onPathMouseUp = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "onPathMouseUp");
	
	if (this.draggingPathHandle >= 0) return this.onPathEditHandlesDragEnd(event);
	
	return false;
}


uesp.gamemap.Location.prototype.onPathMouseDown = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "onPathMouseDown");
	
	if (this.editPathHandles) return this.onPathEditHandlesMouseDown(event);
	
	var bottomEvent = new $.Event("mousedown");
	
	bottomEvent.pageX = event.pageX;
	bottomEvent.pageY = event.pageY;
	
	$(".gmMapTile:first").trigger(bottomEvent);
	
	return false;
}


uesp.gamemap.Location.prototype.onPathMouseOut = function (event)
{
	var ca = event.target;
	var co = ca.getContext('2d');
	
	if (this.useEditPopup && this.popupElement != null) return false;
	
	co.clearRect(this.x, this.y - this.height, this.width, this.height);
	
	if (this.locType == uesp.gamemap.LOCTYPE_AREA)
	{
		co.fillStyle = this.displayData.fillStyle;
		co.fill();
	}
	
	avgScale = (this.pixelWidth / this.width + this.pixelHeight / this.height) / 2.0;
	if (avgScale === 0) avgScale = 1;
	
	co.lineWidth = this.displayData.lineWidth / avgScale;
	co.strokeStyle = this.displayData.strokeStyle;
	co.stroke();
}


uesp.gamemap.Location.prototype.getContext = function ()
{
	return this.pathElement[0].getContext('2d');
}


uesp.gamemap.Location.prototype.onPathEditHandlesClick = function (event)
{
	if (this.lastHoverPathHandle < 0) return false;
	
	this.lastSelectedPathHandle = this.lastHoverPathHandle;
	
	return false;
}


uesp.gamemap.Location.prototype.onPathClick = function (event)
{
	if (this.editPathHandles) return this.onPathEditHandlesClick(event);
	
	var ca = event.target;
	var co = ca.getContext('2d');
	var offset = $(ca).offset();
	
	if (co.isPointInPath(event.pageX - offset.left, event.pageY - offset.top) )
	{
		uesp.logDebug(uesp.LOG_LEVEL_ERROR, "clicked path");
		
		this.togglePopup();
	}
	
	return false;
}


uesp.gamemap.Location.prototype.onPathDblClick = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_ERROR, "double-clicked path");
	
	if (this.editPathHandles) return false;
	
	if (this.parentMap.canEdit())
	{
		this.useEditPopup = true;
		
		if (this.popupElement != null) 
		{
			this.popupElement.remove();
			this.popupElement = null;
		}
		
		this.showPopup();
		return true;
	}
	
	var bottomEvent = new $.Event("dblclick");
	
	bottomEvent.pageX = event.pageX;
	bottomEvent.pageY = event.pageY;
	
	$(".gmMapTile:first").trigger(bottomEvent);
	
	return false;
}


uesp.gamemap.Location.prototype.createPath = function ()
{
	var divSize = this.parentMap.convertGameToPixelSize(this.width, this.height);
	var divW = divSize.x;
	var divH = divSize.y;
	
	this.pathElement = $('<canvas></canvas>').addClass('gmMapPathCanvas')
		.attr({'width': divW,'height': divH})
		.on('selectstart', false)
		.appendTo(this.parentMap.mapRoot);
	
	var context = this.pathElement[0].getContext('2d');
	
	context.translate(-this.x * divW / this.width, -(this.y - this.height) * divH / this.height);
	context.scale(divW / this.width, divH / this.height);
	
	var self = this;
	this.pathElement.click(function (e) { self.onPathClick(e); });
	this.pathElement.dblclick(function (e) { self.onPathDblClick(e); });
	this.pathElement.mousedown(function (e) { self.onPathMouseDown(e); });
	this.pathElement.mouseup(function (e) { self.onPathMouseUp(e); });
	this.pathElement.mouseout(function (e) { self.onPathMouseOut(e); });
	this.pathElement.mousemove(function (e) { self.onPathMouseMove(e); });
}


uesp.gamemap.Location.prototype.createWikiLink = function()
{
	if ( !(this.parentMap.mapOptions.wikiNamespace == null) && this.parentMap.mapOptions.wikiNamespace.length > 0)
	{
		return this.parentMap.mapOptions.wikiUrl + this.parentMap.mapOptions.wikiNamespace + ':' + this.wikiPage;
	}
	
	return this.parentMap.mapOptions.wikiUrl + this.wikiPage;
}


uesp.gamemap.Location.prototype.updatePath = function ()
{
	
	if (this.pathElement == null)
	{
		this.createPath();
	}
	
	this.updatePathOffset();
	this.updatePathSize(true);
}


uesp.gamemap.Location.prototype.update = function ()
{
	if (this.locType == uesp.gamemap.LOCTYPE_POINT)
	{
		this.updateLabel();
		this.updateIcon();
	}
	else if (this.locType == uesp.gamemap.LOCTYPE_PATH)
	{
		this.updateLabel();
		this.updateIcon();
		this.updatePath();
	}
	else if (this.locType == uesp.gamemap.LOCTYPE_AREA)
	{
		this.updateLabel();
		this.updateIcon();
		this.updatePath();
	}
}


uesp.gamemap.Location.LABEL_POSITIONS = {
	0 : 'None',
	1 : 'Top Left',
	2 : 'Top Center',
	3 : 'Top Right',
	4 : 'Middle Left',
	5 : 'Center',
	6 : 'Middle Right',
	7 : 'Bottom Right',
	8 : 'Bottom Center',
	9 : 'Bottom Left'
};


uesp.gamemap.Location.prototype.getLabelPosSelectOptions = function (selectedValue)
{
	var options = '';
	
	for (key in uesp.gamemap.Location.LABEL_POSITIONS)
	{
		options += "<option value='" + key + "' " + (selectedValue == key ? "selected": "") + ">" + uesp.gamemap.Location.LABEL_POSITIONS[key] + "  (" + key.toString() + ")</option>\n";
	}
	
	return options;
}


uesp.gamemap.Location.prototype.getIconTypeSelectOptions = function (selectedValue)
{
	if (this.parentMap.mapOptions.iconTypeMap == null) return '';
	
	var reverseIconTypeMap = { };
	var sortedIconTypeArray = [ ];
	
	for (key in this.parentMap.mapOptions.iconTypeMap)
	{
		var keyValue = this.parentMap.mapOptions.iconTypeMap[key];
		reverseIconTypeMap[keyValue] = key;
		sortedIconTypeArray.push(keyValue);
	}
	
	sortedIconTypeArray.sort();
	
	var options = "<option value='0' " + (selectedValue == 0 ? "selected": "") + ">None (0)</option>\n";
	
	for (key in sortedIconTypeArray)
	{
		iconTypeName = sortedIconTypeArray[key];
		iconType = reverseIconTypeMap[iconTypeName];
		
		options += "<option value='" + iconType + "' " + (selectedValue == iconType ? "selected": "") + ">" + iconTypeName + "  (" + iconType + ")</option>\n";
	}
	
	return options;
}


uesp.gamemap.Location.prototype.convertIconTypeToString = function (iconType)
{
	if (this.parentMap == null || this.parentMap.mapOptions.iconTypeMap == null)
	{
		return iconType.toString();
	}
	
	if (iconType in this.parentMap.mapOptions.iconTypeMap) return this.parentMap.mapOptions.iconTypeMap[iconType];
	return iconType.toString();
}


uesp.gamemap.createLocationFromJson = function(data, parentMap)
{
	var newLocation = new uesp.gamemap.Location(parentMap);
	newLocation.mergeFromJson(data);
	return newLocation;
}


