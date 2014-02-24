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
	
	this.id = -1;
	this.worldId = -1;
	this.revisionId = -1;
	this.destinationId = -1;
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
	this.updateLabel();
	this.updateLabelOffset();
	this.updateIcon();
	this.updateIconOffset();
	this.updatePopupOffset();
	
	this.doSaveQuery();
	
	//this.hidePopup();
	//this.useEditPopup = false;
}


uesp.gamemap.Location.prototype.getFormData = function()
{
	if (!this.parentMap.canEdit()) return false;
	
	form = $('#' + this.popupId + ' form');
	if (form == null) return false;
	
	//TODO displayData.points
	
	formValues = {};
	
	$.each(form.serializeArray(), function(i, field) {
		formValues[field.name] = field.value;
	});
	
	formValues.displayLevel = parseInt(formValues.displayLevel);
	formValues.x = parseInt(formValues.x);
	formValues.y = parseInt(formValues.y);
	formValues.iconType = parseInt(formValues.iconType);
	
	formValues.displayData = { };
	formValues.displayData.points = [formValues.x, formValues.y];
	formValues.displayData.labelPos = parseInt(formValues.labelPos);
	delete formValues.labelPos;
	
	if (formValues.visible == null)
		formValues.visible = false;
	else
		formValues.visible = parseInt(formValues.visible) != 0;
	
	console.log(formValues);
	
	uesp.gamemap.mergeObjects(this, formValues);
	
	pixelPos = this.parentMap.convertGameToPixelPos(this.x, this.y);
	this.offsetLeft = pixelPos.x;
	this.offsetTop  = pixelPos.y;
	
	return true;
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
	
	var popupContent =	"<form onsubmit='return false;'>" +
						"<div class='gmMapEditPopupTitle'>Editing Location</div>" + 
						"<div class='gmMapPopupClose'><img src='images/cancelicon.png' width='12' height='12' /></div><br />" +
						"<div class='gmMapEditPopupLabel'>Name</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='name' value='{name}' size='24' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Enabled</div>" +
							"<input type='checkbox' class='gmMapEditPopupInput' name='visible' value='1' checked='{visible}' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Position</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='x' value='{x}' size='8' /> " +
							"<input type='text' class='gmMapEditPopupInput' name='y' value='{y}' size='8' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Wiki Page</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='wikiPage' value='{wikiPage}' size='24' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Description</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='description' value='{description}' size='24' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Display Level</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayLevel' value='{displayLevel}' size='8' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Icon</div>" +
							iconTypeInput +
							"<div class='gmMapEditPopupIconPreview'></div>" + 
							"<br />" +
						"<div class='gmMapEditPopupLabel'>Label Position</div>" +
							"<select class='gmMapEditPopupInput' name='labelPos'>" +
							this.getLabelPosSelectOptions(this.displayData.labelPos) + 
							"</select> <br />" + 
						"<div class='gmMapEditPopupLabel'>Internal ID</div>" +
							"<div class='gmMapEditPopupInput'>{id}</div> <br />" + 
						"<div class='gmMapEditPopupLabel'>World ID</div>" +
							"<div class='gmMapEditPopupInput'>{worldId}</div> <br />" +
						"<div class='gmMapEditPopupLabel'>Type</div>" +
							"<div class='gmMapEditPopupInput'>{locType}</div> <br />" +
						"<br />" + 
						"<div class='gmMapEditPopupStatus'></div>" +
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
	
	popupHtml = uesp.template2(popupContent, this, this.displayData);
	$(popupDiv).html(popupHtml);
	
	if (this.id < 0) this.setPopupEditNotice('New location not yet saved.', 'warning');
	
	//$('#' + this.popupId + ' select').val(this.iconType);
	
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
	
	$('#' + this.popupId + ' .gmMapEditPopupButtonClose').click(function(event) {
		self.onCloseEditPopup(event);
	});
	
	$('#' + this.popupId + ' .gmMapEditPopupButtonSave').click(function(event) {
		self.onSaveEditPopup(event);
	});
	
	this.updateEditPopupIconPreview();
	this.updatePopupOffset();
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
	
	popupHtml = uesp.template2(popupContent, this, this.displayData);
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
	
	$(this.pathElement).offset( { left: this.offsetLeft, top: this.offsetTop });
	
	
}


uesp.gamemap.Location.prototype.updatePathSize = function (redraw)
{
	if (this.locType < uesp.gamemap.LOCTYPE_PATH) return;
	if (this.pathElement == null) return;
	
	if (!(redraw == null)) redraw = true;
	
	var pixelSize = this.parentMap.convertGameToPixelSize(this.width, this.height);
	this.pixelWidth  = pixelSize.x;
	this.pixelHeight = pixelSize.y;
	
	this.pathElement.attr( { width: this.pixelWidth, height: this.pixelHeight });
	
	if (redraw)
	{
		var context = this.pathElement[0].getContext('2d');
		context.translate(-this.x * this.pixelWidth / this.width, -this.x * this.pixelHeight / this.height);
		context.scale(this.pixelWidth / this.width, this.pixelHeight / this.height);
		this.drawPath(context);
	}
}


uesp.gamemap.Location.prototype.drawPath = function (context)
{
	var i = 0;
	
	context.clearRect(this.x, this.y, this.width, this.height);
	context.globalCompositeOperation = 'destination-atop';
	context.lineWidth = this.displayData.lineWidth;
	context.strokeStyle = this.displayData.strokeStyle;
	
	while (i + 1 < this.displayData.points.length)
	{
		if (i == 0)
			context.moveTo(this.displayData.points[i], this.height - this.displayData.points[i+1]);
		else
			context.lineTo(this.displayData.points[i], this.height - this.displayData.points[i+1]);
		
		i += 2;
	}
	
	if (this.locType == uesp.gamemap.LOCTYPE_AREA)
	{
		context.closePath();
		context.fillStyle = this.displayData.fillStyle;
		context.fill();
	}
	else
	{
		context.fillStyle = 'rgba(255,0,0,0)';
		context.fill();
	}
	
	context.lineWidth = this.displayData.lineWidth;
	context.strokeStyle = this.displayData.strokeStyle;
	context.stroke();
}


uesp.gamemap.Location.prototype.updateOffset = function (x, y, animate)
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
	
	this.updateLabelOffset();
	this.updateIconOffset();
	this.updatePopupOffset();
	this.updatePathOffset();
}


uesp.gamemap.Location.prototype.onPathMouseMove = function (event)
{
	var ca = event.target;
	var co = ca.getContext('2d');
	var offset = $(ca).offset();

	if (co.isPointInPath(event.pageX - offset.left, event.pageY - offset.top) )
	{
		if (this.locType != uesp.gamemap.LOCTYPE_PATH)
		{
			co.fillStyle = this.displayData.hover.fillStyle;
			co.fill();
		}
		else
		{
			co.fillStyle = 'rgba(255,0,0,0)';
			co.fill();
		}
		
		co.lineWidth = this.displayData.hover.lineWidth;
		co.strokeStyle = this.displayData.hover.strokeStyle;
		co.stroke();
	}
	else
	{
		if (this.locType != uesp.gamemap.LOCTYPE_PATH)
		{
			co.fillStyle = this.displayData.fillStyle;
			co.fill();
		}
		else
		{
			co.fillStyle = 'rgba(255,0,0,0)';
			co.fill();
		}
		
		co.lineWidth = this.displayData.lineWidth;
		co.strokeStyle = this.displayData.strokeStyle;
		co.stroke();
	}
}


uesp.gamemap.Location.prototype.onPathMouseDown = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Canvas mousedown");
	
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
	
	if (this.locType != uesp.gamemap.LOCTYPE_PATH)
	{
		co.fillStyle = this.displayData.fillStyle;
		co.fill();
	}
	else
	{
		co.fillStyle = 'rgba(255,0,0,0)';
		co.fill();
	}
	
	co.lineWidth = this.displayData.lineWidth;
	co.strokeStyle = this.displayData.strokeStyle;
	co.stroke();
}


uesp.gamemap.Location.prototype.onPathClick = function (event)
{
	var ca = event.target;
	var co = ca.getContext('2d');
	var offset = $(ca).offset();
	
	if (co.isPointInPath(event.pageX - offset.left, event.pageY - offset.top) )
	{
		uesp.logDebug(uesp.LOG_LEVEL_WARNING, "clicked path");
	}
	
	return false;
}


uesp.gamemap.Location.prototype.onPathDblClick = function (event)
{
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
	
	context.translate(-this.x * divW / this.width, -this.x * divH / this.height);
	context.scale(divW / this.width, divH / this.height);
	
	var self = this;
	this.pathElement.click(function (e) { self.onPathClick(e); });
	this.pathElement.dblclick(function (e) { self.onPathDblClick(e); });
	this.pathElement.mousedown(function (e) { self.onPathMouseDown(e); });
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
	this.updatePathSize();
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
	if (this.parentMap.mapOptions.iconTypeMap == null) return "";
	
	var options = '';
	
	for (key in this.parentMap.mapOptions.iconTypeMap)
	{
		options += "<option value='" + key + "' " + (selectedValue == key ? "selected": "") + ">" + this.parentMap.mapOptions.iconTypeMap[key] + "  (" + key.toString() + ")</option>\n";
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


