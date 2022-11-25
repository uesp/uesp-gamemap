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
	this.isPathHovering = false;
	
	this.useEditPopup = false;
	this.editPathHandles = false;
	this.lastHoverPathHandle = -1;
	this.draggingPathHandle = -1;
	this.lastSelectedPathHandle = -1;
	this.dragStartX = 0;
	this.dragStartY = 0;
	this.isFirstEdit = false;
	
	this.displayData = {};
	
	this.labelElement = null;
	this.iconElement  = null;
	this.popupElement = null;
	this.pathElement  = null;
	this.tooltipElement = null;
	this.pathObject = null;
	this.iconImage = null;
	this.labelCanvasIsShown = false;
	this.labelCanvasExtents = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
	
	this.offsetLeft = 0;
	this.offsetTop  = 0;
	this.labelOffsetLeft = 0;
	this.labelOffsetTop  = 0;
	this.isHoverCanvas = false;
	
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
	if ( !(this.tooltipElement == null)) $(this.tooltipElement).hide(duration);
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
	if ( !(this.tooltipElement  == null)) $(this.tooltipElement).remove();
	
	this.labelElement = null;
	this.iconElement  = null;
	this.popupElement = null;
	this.pathElement  = null;
	this.tooltipElement = null;
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
		curOffset = this.iconElement.offset();
	
		this.iconElement.offset({
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
	
	if ( !(this.tooltipElement == null))
	{
		curOffset = $(this.tooltipElement).offset();
	
		$(this.tooltipElement).offset({
			left: curOffset.left - shiftX,
			top : curOffset.top  - shiftY
		});
	}
	
}


uesp.gamemap.Location.prototype.onLabelClick = function(event)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Label Click", event);
	
	if (event.shiftKey && this.parentMap.canEdit())
	{
		this.useEditPopup = true;
		this.togglePopup();
	}
	else if (!this.useEditPopup && this.destinationId != 0 && this.parentMap.jumpToDestinationOnClick)
	{
		this.onJumpToDestination();
	}
	else
	{
		this.togglePopup();
	}
}


uesp.gamemap.Location.prototype.onLabelDblClick = function(event)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "Label Double-Click");
	
	if (this.parentMap.canEdit())
	{
		this.hidePopup();
		delete this.popupElement;
		this.popupElement = null;
		
		this.useEditPopup = true;
		this.showPopup();
		
		return;
	}
	
	if (this.destinationId != 0) this.onJumpToDestination(); 
}


uesp.gamemap.Location.prototype.onLabelClickFunction = function()
{
	var self = this;
	return function(e) { self.onLabelClick(e); };
}


uesp.gamemap.Location.prototype.onLabelMouseOverFunction = function()
{
	var self = this;
	return function(e) { self.onLabelMouseOver(e); };
}


uesp.gamemap.Location.prototype.onLabelMouseOutFunction = function()
{
	var self = this;
	return function(e) { self.onLabelMouseOut(e); };
}


uesp.gamemap.Location.prototype.onLabelDblClickFunction = function()
{
	var self = this;
	return function(e) { self.onLabelDblClick(e); }
}


uesp.gamemap.Location.prototype.updateLabel = function ()
{
	if (this.parentMap.USE_CANVAS_DRAW) return this.updateLabelCanvas();
	
	var labelPos = 0;
	var isDisabled = false;
	
	if ( !(this.displayData.labelPos == null) ) labelPos = this.displayData.labelPos;
	
	if (this.iconType === 0 && labelPos === 0 && this.parentMap.isShowHidden())
	{
		labelPos = 6;
		if (this.name === "") this.name = "[noname]";
		isDisabled = true;
	}
	
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
			.text(this.name)
			.on('selectstart', false);
		
		if (!this.visible || this.displayLevel >= 20 || isDisabled) this.labelElement.addClass('gmMapLocDisabled');
	}
	else
	{
		this.labelElement.text(this.name);
	}
	
	var iconSizeX = this.parentMap.mapOptions.defaultIconWidth;
	var iconSizeY = this.parentMap.mapOptions.defaultIconHeight;
		
	//var labelWidth = this.name.length*6 + 2;
	var labelWidth  = this.labelElement.width();
	var labelHeight = this.labelElement.height();
	
	switch (labelPos) {
		case 1:
			anchorPoint = 'bottomRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + iconSizeX/2;
			this.labelOffsetTop  = iconSizeY;
			break;
		case 2:
			anchorPoint = 'bottomCenter';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = iconSizeY;
			break;
		case 3:
			anchorPoint = 'bottomLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = -iconSizeX/2;
			this.labelOffsetTop  = iconSizeY;
			break;
		case 4:
			anchorPoint = 'midRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + iconSizeX/2;
			this.labelOffsetTop  = iconSizeY/2 + labelHeight/2 - 4;
			break;
		case 5:
			anchorPoint = 'center';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = iconSizeY/2 + labelHeight/2 - 4;
			break;
		case 6:
		default:
			anchorPoint = 'midLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = -iconSizeX/2;
			this.labelOffsetTop  = iconSizeY/2 + labelHeight/2 - 4;
			break;
		case 7:
			anchorPoint = 'topRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + iconSizeX/2;
			this.labelOffsetTop  = 0;
			break;
		case 8:
			anchorPoint = 'topCenter';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = 0;
			break;
		case 9:
			anchorPoint = 'topLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = -iconSizeX/2;
			this.labelOffsetTop  = 0;
			break;
	}
	
	this.labelElement.css({ textAlign: labelTextAlign });
	this.updateLabelOffset();
}


uesp.gamemap.Location.prototype.updateLabelCanvas = function ()
{
	var labelPos = 0;
	var isDisabled = false;
	
	this.labelCanvasIsShown = false;
	
	if ( !(this.displayData.labelPos == null) ) labelPos = this.displayData.labelPos;
	
	if (this.iconType === 0 && labelPos === 0 && this.parentMap.isShowHidden())
	{
		labelPos = 6;
		if (this.name === "") this.name = "[noname]";
		isDisabled = true;
	}
	
	if (labelPos === 0) return;
	
	var pixelPos = this.parentMap.convertGameToPixelPos(this.x + this.width/2, this.y - this.height/2);
	var iconSizeX = this.parentMap.mapOptions.defaultIconWidth;
	var iconSizeY = this.parentMap.mapOptions.defaultIconHeight;
	var labelWidth  = 1;
	var labelHeight = 11;
	
	this.parentMap.mapContext.font = "11px Arial";
	this.parentMap.mapContext.fillStyle = "#33ff33";
	
	labelWidth = this.parentMap.mapContext.measureText(this.name).width;
	labelHeight = this.parentMap.mapContext.measureText("M").width;			//Works but hacky
	
	if (this.iconImage)
	{
		iconSizeX = this.iconImage.width;
		iconSizeY = this.iconImage.height;
	}
	
	var labelOffsetLeft = 0;
	var labelOffsetTop = 0;
	var labelTextAlign = 'left';
	var anchorPoint = '';
	var rectx1 = pixelPos.x - 1;
	var recty1 = pixelPos.y - 1;
	var rectxoffset = 0;
	
	switch (labelPos) {
	case 1:
		anchorPoint = 'bottomRight';
		labelTextAlign = 'right';
		labelOffsetLeft = iconSizeX/2;
		labelOffsetTop  = iconSizeY/2 + labelHeight - 2;
		rectxoffset = labelWidth;
		break;
	case 2:
		anchorPoint = 'bottomCenter';
		labelTextAlign = 'center';
		labelOffsetLeft = 0;
		labelOffsetTop  = iconSizeY/2 + labelHeight - 2;
		rectxoffset = labelWidth/2;
		break;
	case 3:
		anchorPoint = 'bottomLeft';
		labelTextAlign = 'left';
		labelOffsetLeft = -iconSizeX/2;
		labelOffsetTop  = iconSizeY/2 + labelHeight - 2;
		rectxoffset = 0;
		break;
	case 4:
		anchorPoint = 'midRight';
		labelTextAlign = 'right';
		labelOffsetLeft = iconSizeX/2;
		labelOffsetTop  = labelHeight/2 - 1;
		rectxoffset = labelWidth;
		break;
	case 5:
		anchorPoint = 'center';
		labelTextAlign = 'center';
		labelOffsetLeft = 0;
		labelOffsetTop  = labelHeight/2 - 1;
		rectxoffset = labelWidth/2;
		break;
	case 6:
	default:
		anchorPoint = 'midLeft';
		labelTextAlign = 'left';
		labelOffsetLeft = -iconSizeX/2;
		labelOffsetTop  = labelHeight/2 - 1;
		rectxoffset = 0;
		break;
	case 7:
		anchorPoint = 'topRight';
		labelTextAlign = 'right';
		labelOffsetLeft = iconSizeX/2;
		labelOffsetTop  = -iconSizeY/2 + 1;
		rectxoffset = labelWidth;
		break;
	case 8:
		anchorPoint = 'topCenter';
		labelTextAlign = 'center';
		labelOffsetLeft = 0;
		labelOffsetTop  = -iconSizeY/2 + 1;
		rectxoffset = labelWidth/2;
		break;
	case 9:
		anchorPoint = 'topLeft';
		labelTextAlign = 'left';
		labelOffsetLeft = -iconSizeX/2;
		labelOffsetTop  = -iconSizeY/2 + 1;
		rectxoffset = 0;
		break;
	}
	
	
	//this.parentMap.mapContext.fillText(this.name, pixelPos.x - this.parentMap.mapTransformX, pixelPos.y - this.parentMap.mapTransformY);
	this.parentMap.mapContext.textAlign = labelTextAlign;
	this.parentMap.mapContext.textBaseline = "top";
	
	this.parentMap.mapContext.fillStyle = "rgba(0, 0, 0, 0.4)";
	this.parentMap.mapContext.fillRect(rectx1 - labelOffsetLeft - rectxoffset, recty1 - labelOffsetTop, labelWidth + 2, labelHeight + 2);
	
	this.parentMap.mapContext.strokeStyle = "rgba(0, 0, 0, 0.25)";
	this.parentMap.mapContext.lineWidth = 1;
	this.parentMap.mapContext.strokeRect(rectx1 - labelOffsetLeft - rectxoffset - 1, recty1 - labelOffsetTop - 1, labelWidth + 4, labelHeight + 4);
	
	this.parentMap.mapContext.font = "11px Arial";
	this.parentMap.mapContext.fillStyle = "#33ff33";
	this.parentMap.mapContext.fillText(this.name, pixelPos.x - labelOffsetLeft, pixelPos.y - labelOffsetTop);
	
	this.labelCanvasIsShown = true;
	this.labelCanvasExtents.left = rectx1 - labelOffsetLeft - rectxoffset + 1;
	this.labelCanvasExtents.right = this.labelCanvasExtents.left + labelWidth - 2;
	this.labelCanvasExtents.top = recty1 - labelOffsetTop + 1;
	this.labelCanvasExtents.bottom = this.labelCanvasExtents.top + labelHeight - 2;
	this.labelCanvasExtents.width = labelWidth - 2;
	this.labelCanvasExtents.height = labelHeight - 2;
}


uesp.gamemap.Location.prototype.updateIcon = function ()
{
	if (this.parentMap.USE_CANVAS_DRAW) return this.updateIconCanvas();
	
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
	
	var ZIndex = 20 - this.displayLevel;
	
	if (this.iconElement == null)
	{	
		var imageElement = $('<img />').addClass('gmMapLocIcon')
			.load(this, uesp.gamemap.onLoadIconSuccess)
			.error(uesp.gamemap.onLoadIconFailed(missingURL))
			.attr('src', imageURL)
			.click(this.onLabelClickFunction())
			.dblclick(this.onLabelDblClickFunction())
			.mouseover(this.onLabelMouseOverFunction())
			.mouseout(this.onLabelMouseOutFunction())
			.attr('unselectable', 'on')
			.css('user-select', 'none')
			.on('selectstart', false);
		
		this.iconElement = $('<div />')
				.addClass('gmMapLocIconDiv')
				.css('z-index', ZIndex)
				.appendTo(this.parentMap.mapRoot);
		
		imageElement.appendTo(this.iconElement);
		
		$('<span />').addClass('gmMapLocIconHelper').appendTo(this.iconElement);
	}
	else
	{
		var imageTarget = this.iconElement.children("img");
		imageTarget.attr('src', imageURL);
		this.iconElement.css('z-index', ZIndex);
	}
	
	this.updateIconOffset();
}


uesp.gamemap.Location.prototype.updateIconCanvas = function ()
{
	if (this.iconType == 0) return;
	
	if (this.iconImage == null)
	{
		var missingURL = this.parentMap.mapOptions.iconPath + this.parentMap.mapOptions.iconMissing;
		var imageURL   = this.parentMap.mapOptions.iconPath + this.iconType + ".png";
		
		this.iconImage = new Image();
		this.iconImage.src = imageURL;
	}
	
	//var pixelPos = this.parentMap.convertGameToPixelPos(this.x + this.width/2, this.y - this.height/2);
	//this.parentMap.mapContext.drawImage(this.iconImage, pixelPos.x - this.parentMap.mapTransformX, pixelPos.y - this.parentMap.mapTransformY, this.iconImage.width, this.iconImage.height);
	
	var pixelPos = this.parentMap.convertGameToPixelPos(this.x + this.width/2, this.y - this.height/2);
	this.parentMap.mapContext.drawImage(this.iconImage, pixelPos.x - this.iconImage.width/2, pixelPos.y - this.iconImage.height/2, this.iconImage.width, this.iconImage.height);
	
		// For debug only
	if (this.isHoverCanvas)
	{
		//this.parentMap.mapContext.strokeStyle = "#ff0";
		//this.parentMap.mapContext.lineWidth = 1;
		//this.parentMap.mapContext.strokeRect(pixelPos.x - this.iconImage.width/2 - 1, pixelPos.y - this.iconImage.height/2 - 1, this.iconImage.width + 2, this.iconImage.height + 2);
	}
}


uesp.gamemap.Location.prototype.showPopup = function ()
{
	if (this.popupElement == null) this.updatePopup();
	
	this.hideTooltip();
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
	else if (this.useEditPopup)
	{
		if (this.popupElement.find('.gmMapEditPopup').length == 0)
		{
			this.popupElement.remove();
			this.popupElement = null;
			return this.updatePopup();
		}
		
		$(this.popupElement).show();
		this.updatePopupOffset();
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
	
		// Special case of a new location that hasn't been saved 
	if (this.id <= 0)
	{
		delete this.parentMap.locations[this.id];
		this.removeElements();
		this.parentMap.redrawCanvas();
	}

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


uesp.gamemap.Location.prototype.enablePopupEditButtons = function (enable)
{
	if (this.popupElement == null) return;
	this.popupElement.find('input[type="button"]').attr('disabled', enable ? null : 'disabled');
}


uesp.gamemap.Location.prototype.onSaveEditPopup = function (event)
{
	if (!this.parentMap.canEdit()) return false;
	if (this.popupElement == null) return false;
	
	this.setPopupEditNotice('Saving location...');
	this.enablePopupEditButtons(false);
	
	this.iconImage = null;
	
	this.getFormData();
	
	this.updateOffset();
	this.update();
	
	this.doSaveQuery();
	
	this.parentMap.redrawCanvas();
}


uesp.gamemap.Location.prototype.onDragEditPopup = function (event)
{
	this.popupElement.hide();
	this.parentMap.onEditDragLocationStart(this);
}


uesp.gamemap.Location.prototype.onDeleteEditPopup = function (event)
{
	if (!this.parentMap.canEdit()) return false;
	if (this.popupElement == null) return false;
	
		//Special case of a new location not yet saved
	if (this.id < 0)
	{
		this.visible = false;
		
		this.removeElements();
		
		delete this.parentMap.locations[this.id];
		
		this.parentMap.redrawCanvas();
		return true;
	}
	
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
	
	formValues = uesp.getFormData(form);
	
	formValues.displayLevel = parseFloat(formValues.displayLevel);
	if (formValues.displayLevel < this.parentMap.mapOptions.minZoomLevel) formValues.displayLevel = this.parentMap.mapOptions.minZoomLevel;
	if (formValues.displayLevel > this.parentMap.mapOptions.maxZoomLevel) formValues.displayLevel = this.parentMap.mapOptions.maxZoomLevel;
	
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
	
	if (this.id < 0 && this.wikiPage === "") this.wikiPage = this.name;
	
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
	query += '&revisionid=' + this.revisionId;
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
	query += '&db=' + this.parentMap.mapOptions.dbPrefix;
	
	if (this.locType > 1)
	{
		
	}
	
	return query;
}


uesp.gamemap.Location.prototype.onSavedLocation = function (data)
{
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Received onSavedLocation data");
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, data);
	
	if (!(data.isError == null) || data.success === false)
	{
		this.setPopupEditNotice('Error saving location data!', 'error');
		this.enablePopupEditButtons(true);
		return false;
	}
	
	this.setPopupEditNotice('Successfully saved location!');
	this.enablePopupEditButtons(true);
	
	if (!(data.newLocId == null))
	{
		this.parentMap.updateLocationId(this.id, data.newLocId)
		this.id = data.newLocId;
		this.updateEditPopup();
	}
	
	if (data.newRevisionId != null) this.revisionId = data.newRevisionId;
	
	this.useEditPopup = false;
	this.hidePopup();
	this.popupElement.remove();
	this.popupElement = null;
	
	if (!this.visible)
	{
		this.removeElements();
		this.parentMap.redrawCanvas();
	}
	else if (this.displayLevel > this.parentMap.zoomLevel)
	{
		this.removeElements();
		this.parentMap.redrawCanvas();
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
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "Jumping to destination " + this.destinationId);
	this.parentMap.jumpToDestination(this.destinationId);
	return false;
}


uesp.gamemap.Location.prototype.updateEditPopupIconPreview = function ()
{
	var iconPreview = $(this.popupElement).find(".gmMapEditPopupIconPreview");
	
	iconTypeElement = $(this.popupElement).find("input[name=iconType]");
	if (iconTypeElement == null || iconTypeElement.length == 0) iconTypeElement = $(this.popupElement).find("select[name=iconType]");
	
	iconType = parseInt(iconTypeElement.val());
	imageURL = this.parentMap.mapOptions.iconPath + iconType + ".png";
	
	if (iconType <= 0)
		iconPreview.css('background-image', '');
	else
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
	var pathContent = '';
	var pathButtons = '';
	var pathCheckbox = '';
	
	if (this.locType > 1)
	{
		pathContent = 	"<div class='gmMapEditPopupLabel'>Fill Style</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayData.fillStyle' value='{displayData.fillStyle}' size='14'  maxlength='100' /><br />" +
						"<div class='gmMapEditPopupLabel'>Stroke Style</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayData.strokeStyle' value='{displayData.strokeStyle}' size='14'  maxlength='100' /> " +
							" &nbsp; Width:" + 
							"<input type='text' class='gmMapEditPopupInput' name='displayData.lineWidth' value='{displayData.lineWidth}' size='2'  maxlength='10' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Hover Fill Style</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.fillStyle' value='{displayData.hover.fillStyle}' size='14'  maxlength='100' /><br />" +
						"<div class='gmMapEditPopupLabel'>Hover Stroke</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.strokeStyle' value='{displayData.hover.strokeStyle}' size='14'  maxlength='100' /> " +
							" &nbsp; Width:" + 
							"<input type='text' class='gmMapEditPopupInput' name='displayData.hover.lineWidth' value='{displayData.hover.lineWidth}' size='2'  maxlength='10' /> <br />" +
						"";
		pathButtons = 	"<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonEditHandle' value='Edit Handles' />";
		pathCheckbox = 	" &nbsp; &nbsp; &nbsp; Is Area <input type='checkbox' class='gmMapEditPopupInput' name='isArea' value='1' />";
	}
	else
	{
		pathButtons = "<input type='button' class='gmMapEditPopupButtons gmMapEditPopupButtonDrag' value='Set Pos' />";
	}
	
		//TODO: Proper permission checking for edit/add/delete abilities
		//TODO: Proper template functionality
		//TODO: Better function organization/shorter
	var popupContent =	"<form onsubmit='return false;'>" +
						"<div class='gmMapEditPopupTitle'>Editing Location</div>" + 
						"<div class='gmMapPopupClose'><img src='images/cancelicon.png' width='12' height='12' /></div><br />" +
						"<div class='gmMapEditPopupLabel'>Name</div>" +
							"<input type='text' class='gmMapEditPopupInput' name=\"name\" value=\"{name}\" size='24' maxlength='100' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Enabled</div>" +
							"<input type='checkbox' class='gmMapEditPopupInput' name='visible' value='1' />" +
							pathCheckbox + 
							"<br />" +
						"<div class='gmMapEditPopupLabel'>Position</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='x' value='{x}' size='8' maxlength='10' /> " +
							"<input type='text' class='gmMapEditPopupInput' name='y' value='{y}' size='8' maxlength='10' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Wiki Page</div>" +
							"<input type='text' class='gmMapEditPopupInput' name=\"wikiPage\" value=\"{wikiPage}\" size='24' maxlength='100' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Description</div>" +
							"<input type='text' class='gmMapEditPopupInput' name=\"description\" value=\"{description}\" size='24' maxlength='500' /> <br />" +
						"<div class='gmMapEditPopupLabel'>Display Level</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='displayLevel' value='{displayLevel}' size='8' maxlength='10' />" + 
							"<div class='gmMapEditPopupCurrentZoom'>Current Zoom = </div> <br />" +
						"<div class='gmMapEditPopupLabel'>Icon Type</div>" +
							this.getIconTypeCustomList(this.iconType) + 
							"<div class='gmMapEditPopupIconPreview'></div>" +
							"<br />" +
						"<div class='gmMapEditPopupLabel'>Label Position</div>" +
							"<select class='gmMapEditPopupInput' name='displayData.labelPos'>" +
							this.getLabelPosSelectOptions(this.displayData.labelPos) + 
							"</select> <br />" +
						"<div class='gmMapEditPopupLabel'>Destination ID</div>" +
							"<input type='text' class='gmMapEditPopupInput' name='destinationId' value='{destinationId}' size='8' maxlength='10' /> &nbsp; + for location, - for world<br />" +
						pathContent +
						"<div class='gmMapEditPopupLabel'>locationId</div>" +
							"<div class='gmMapEditPopupInput'>{id}</div> &nbsp; " + 
							"<div class='gmMapEditPopupInput'>World: {worldId}</div> &nbsp; " +
							"<div class='gmMapEditPopupInput'>Type: {locType}</div> &nbsp;" +
							"<div class='gmMapEditPopupInput'>Rev: {revisionId}</div> <br />" +
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
	
	popupHtml = uesp.templateEsc(popupContent, this);
	$(popupDiv).html(popupHtml);
	
	this.createIconTypeCustomListEvents();
	this.setIconTypeCustomListValue(this.iconType);
	
	$(popupDiv).find('input[name=visible]').prop('checked', this.visible);
	$(popupDiv).find('input[name=isArea]').prop('checked', this.locType == uesp.gamemap.LOCTYPE_AREA);
	
	if (this.id < 0) this.setPopupEditNotice('New location not yet saved.', 'warning');
	
	var self = this;
	
	$(popupDiv).find('input[name=name]').focus();
	
	$('#' + this.popupId + ' .gmMapPopupClose').click(function(event) {
		self.onCloseEditPopup(event);
	});
	
	$(popupDiv).find('.gmMapIconTypeListContainer').keydown(function(event) {
		self.showIconTypeCustomList();
		self.scrollIconTypeCustomList();
		
		self.popupElement.find(".gmMapIconTypeList").trigger(event);
		event.preventDefault();
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
	
	$('#' + this.popupId + ' input[name=name]').blur(function(e) {
		self.onEditLocationNameBlur(e);
	});
	
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
	
	$('#' + this.popupId + ' .gmMapEditPopupButtonDrag').click(function(event) {
		self.onDragEditPopup(event);
	});
	
	$('#' + this.popupId + ' .gmMapEditPopupButtonEditHandle').click(function(event) {
		self.onEditHandlesEditPopup(event);
	});

	this.onUpdateCurrentZoomEditPopup();
	this.updateEditPopupIconPreview();
	this.updatePopupOffset();
	
	if (this.locType > 1) this.updatePath();
}


uesp.gamemap.Location.prototype.onEditLocationNameBlur = function(event)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onEditLocationNameBlur");
	
		/* Only works on new locations on their first edit */
	if (this.isFirstEdit == null || this.isFirstEdit === false) return;
	if (this.id > 0) return;
	
	var nameInput = this.popupElement.find("input[name=name]");
	
	rawNameValue = nameInput.val();
	nameValue = rawNameValue.toLowerCase();
	if (nameValue == null || nameValue === "") return;
	
	var iconType = this.popupElement.find("input[name=iconType]");
	var displayLevel = this.popupElement.find("input[name=displayLevel]");
	var labelPos = this.popupElement.find("select[name='displayData.labelPos']");
	var wikiPage = this.popupElement.find("input[name=wikiPage]");
	
		// TODO: Don't hardcode values?
	if (nameValue == "skyshard")
	{
		this.setIconTypeCustomListValue(75);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
		wikiPage.val("Skyshard");
	}
	else if (nameValue == "chest")
	{
		this.setIconTypeCustomListValue(83);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "fishing hole")
	{
		this.setIconTypeCustomListValue(36);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "ayleid well")
	{
		this.setIconTypeCustomListValue(131);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
	}
	else if (nameValue == "heavy sack" || nameValue == "heavy crate")
	{
		this.setIconTypeCustomListValue(89);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "cooking fire")
	{
		this.setIconTypeCustomListValue(28);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "alchemy station")
	{
		this.setIconTypeCustomListValue(84);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "enchanting station")
	{
		this.setIconTypeCustomListValue(85);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "enchanting table")
	{
		nameInput.val("Enchanting Station");	//To be consistent with everything else named as "station"
		this.setIconTypeCustomListValue(85);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "jewelry station" || nameValue == "jewel station" || nameValue == "jewelry crafting station")
	{
		nameInput.val("Jewelry Crafting Station");
		this.setIconTypeCustomListValue(215);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "blacksmith station")
	{
		this.setIconTypeCustomListValue(86);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "clothing station")
	{
		this.setIconTypeCustomListValue(88);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "woodworking station")
	{
		this.setIconTypeCustomListValue(87);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "ayleid well")
	{
		this.setIconTypeCustomListValue(0);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel-1);
		labelPos.val(6);
	}
	else if (nameValue == "imperial camp")
	{
		this.setIconTypeCustomListValue(0);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel-1);
		labelPos.val(6);
	}
	else if (nameValue == "lorebook" || nameValue == "lore book")
	{
		this.setIconTypeCustomListValue(76);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (uesp.endsWith(nameValue, "wayshrine"))
	{
		this.setIconTypeCustomListValue(19);
		displayLevel.val(this.parentMap.mapOptions.minZoomLevel);
		labelPos.val(0);
		wikiPage.val(rawNameValue);
	}
	else if (uesp.endsWith(nameValue, "world event"))
	{
		this.setIconTypeCustomListValue(140);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
		wikiPage.val(rawNameValue);
	}
	else if (uesp.endsWith(nameValue, "crafting node"))
	{
		this.setIconTypeCustomListValue(90);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (uesp.endsWith(nameValue, "container"))
	{
		this.setIconTypeCustomListValue(91);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue.indexOf("treasure map") !== -1)
	{
		this.setIconTypeCustomListValue(79);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel - 1);
		labelPos.val(0);
	}
	else if (uesp.endsWith(nameValue, "dolmen"))
	{
		this.setIconTypeCustomListValue(69);
		displayLevel.val(this.parentMap.mapOptions.minZoomLevel-2);
		wikiPage.val(rawNameValue);
	}
	else if (nameValue == "dark fissure")
	{
		this.setIconTypeCustomListValue(129);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
		wikiPage.val(rawNameValue);
	}
	else if (nameValue == "celestial rift")
	{
		this.setIconTypeCustomListValue(128);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
		wikiPage.val(rawNameValue);
	}
	else if (uesp.endsWith(nameValue, "fighters guild"))
	{
		this.setIconTypeCustomListValue(30);
		displayLevel.val(this.parentMap.mapOptions.minZoomLevel+2);
		labelPos.val(0);
		wikiPage.val(rawNameValue);
	}
	else if (uesp.endsWith(nameValue, "mages guild"))
	{
		this.setIconTypeCustomListValue(35);
		displayLevel.val(this.parentMap.mapOptions.minZoomLevel+2);
		labelPos.val(0);
		wikiPage.val(rawNameValue);
	}
	else if (uesp.beginsWith(nameValue, "safebox") || uesp.beginsWith(nameValue, "strongbox") || uesp.beginsWith(nameValue, "lockbox"))
	{
		this.setIconTypeCustomListValue(143);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
		wikiPage.val("Safebox");
	}
	else if (nameValue == "dye station" || nameValue == "outfit station")
	{
		this.setIconTypeCustomListValue(135);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "fence")
	{
		this.setIconTypeCustomListValue(133);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "hiding spot")
	{
		this.setIconTypeCustomListValue(170);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "thieves trove")
	{
		this.setIconTypeCustomListValue(167);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	else if (nameValue == "psijic portal")
	{
		this.setIconTypeCustomListValue(204);
		displayLevel.val(this.parentMap.mapOptions.maxZoomLevel);
		labelPos.val(0);
	}
	
	//this.isFirstEdit = false;
}


uesp.gamemap.Location.prototype.updatePopup = function ()
{
	
	if (this.useEditPopup) return this.updateEditPopup();
	
	var popupDiv;
	var popupContent =  "<div class='gmMapPopupClose'><img src='images/cancelicon.png' width='12' height='12' /></div>" + 
						"<div class='gmMapPopupTitle'><a {wikiLink}>{name}</a></div>" + 
						"<div class='gmMapPopupPos'>Location: {x}, {y}</div>" +
						"<div class='gmMapPopupPos'>Internal ID: {id}</div>" +
						"<div class='gmMapPopupDesc'>{description}</div>";
	
	this.wikiLink = this.createWikiLinkHref();
	
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
	
	if (this.destinationId != 0) popupContent += "<div class='gmMapPopupPos'>Destination ID: {destinationId}</div>";
	
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
	
	if (this.destinationId != 0)
	{
		if (this.destinationId < 0)
		{
		}
		else
		{
			if (!this.parentMap.hasLocation(this.destinationId)) this.parentMap.retrieveLocation(this.destinationId);
		}
		
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
	
	var width  = this.iconElement.width();
	var height = this.iconElement.height();
	if (width  == 0 || height == 0) height = this.parentMap.mapOptions.defaultIconHeight;
	if (width  == 0) width = this.parentMap.mapOptions.defaultIconWidth;
		
	this.iconElement.offset( { left: this.offsetLeft - width/2, top: this.offsetTop - height/2 });
}


uesp.gamemap.Location.prototype.updatePopupOffset = function ()
{
	if (this.popupElement == null) return;
	
	if (this.parentMap.USE_CANVAS_DRAW)
	{
		var offset = this.parentMap.mapContainer.offset();
		$(this.popupElement).offset( { left: this.offsetLeft - $(this.popupElement).width()/2 + this.parentMap.mapTransformX + offset.left, top: this.offsetTop - $(this.popupElement).height() - 8 + this.parentMap.mapTransformY + offset.top});
	}
	else
	{
		$(this.popupElement).offset( { left: this.offsetLeft - $(this.popupElement).width()/2, top: this.offsetTop - $(this.popupElement).height() - 8 });
	}
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
	
	if (redraw && this.parentMap.USE_CANVAS_DRAW)
	{
		this.drawPathCanvas();
		if (this.editPathHandles) this.drawPathHandlesCanvas();
	}
	else if (redraw && !this.parentMap.USE_CANVAS_DRAW)
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
	if (this.parentMap.USE_CANVAS_DRAW) return this.drawPathHandlesCanvas();
	
	for (i = 0; i < this.displayData.points.length; i += 2)
	{
		this.drawPathHandle(i, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR, context);
	}
}


uesp.gamemap.Location.prototype.drawPathHandlesCanvas = function ()
{
	this.pathHandleObjects = [];
	
	for (i = 0; i < this.displayData.points.length; i += 2)
	{
		this.drawPathHandleCanvas(i, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR);
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
	
	var handleSize = uesp.gamemap.Location.PATH_EDITHANDLE_SIZE / this.getContextScale();
	
	x = this.displayData.points[index] - handleSize/2;
	y = this.y * 2 - this.displayData.points[index+1] - this.height - handleSize/2;
	
	context.beginPath();
	context.fillStyle = fillColor;
	context.fillRect(x, y, handleSize, handleSize);
	
	return true;
}


uesp.gamemap.Location.prototype.drawPathHandleCanvas = function (index, fillColor)
{
	if (index < 0 || index >= this.displayData.points.length-1) return false;
	
	var context = this.parentMap.mapContext;
	
	if (fillColor == null) fillColor = uesp.gamemap.Location.PATH_EDITHANDLE_COLOR;
	
	x = this.displayData.points[index];
	y = this.displayData.points[index+1];
	
	var pixelPos = this.parentMap.convertGameToPixelPos(x, y);
	var handleSize = uesp.gamemap.Location.PATH_EDITHANDLE_SIZE;
	
	//context.beginPath();
	context.fillStyle = fillColor;
	context.fillRect(pixelPos.x - handleSize/2, pixelPos.y - handleSize/2, handleSize, handleSize);
	
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


uesp.gamemap.Location.prototype.drawPathCanvas = function ()
{
	var i = 0;
	var hasFill = false;
	var hasStroke = false;
	var context = this.parentMap.mapContext;
	var path = new Path2D();
	
	//context.beginPath();
	
	while (i + 1 < this.displayData.points.length)
	{
		var pixelPos = this.parentMap.convertGameToPixelPos(this.displayData.points[i], this.displayData.points[i+1]);
		
		if (i == 0)
			path.moveTo(pixelPos.x, pixelPos.y);
		else
			path.lineTo(pixelPos.x, pixelPos.y);
		
		i += 2;
	}
	
	if (this.locType == uesp.gamemap.LOCTYPE_AREA)
	{
		path.closePath();
		
		if (this.editPathHandles)
		{
			context.fillStyle = 'rgba(255,255,255,0.4)';
			hasFill = true;
		}
		else if (this.isHoverCanvas)
		{
			context.fillStyle = this.displayData.hover.fillStyle;
			if (this.displayData.hover.fillStyle != "") hasFill = true;
		}
		else
		{
			context.fillStyle = this.displayData.fillStyle;
			if (this.displayData.fillStyle != "") hasFill = true;
		}
		
		if (hasFill) context.fill(path);
	}
	
	if (this.editPathHandles)
	{
		context.strokeStyle = 'rgba(0,0,0,1)';
		context.lineWidth = 1;
		hasStroke = true;
	}
	else if (this.isHoverCanvas)
	{
		context.lineWidth = this.displayData.hover.lineWidth;
		context.strokeStyle = this.displayData.hover.strokeStyle;
		if (this.displayData.hover.lineWidth > 0 && this.displayData.hover.strokeStyle != "") hasStroke = true;
	}
	else
	{
		context.lineWidth = this.displayData.lineWidth;
		context.strokeStyle = this.displayData.strokeStyle;
		if (this.displayData.lineWidth > 0 && this.displayData.strokeStyle != "") hasStroke = true;
	}
	
	if (hasStroke) context.stroke(path);
	this.pathObject = path;
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
	this.updateTooltipOffset();
}


uesp.gamemap.Location.prototype.onPathEditHandlesDragMove = function (event)
{
	x = this.displayData.points[this.draggingPathHandle];
	y = this.displayData.points[this.draggingPathHandle + 1];
	
	newPixelX = event.pageX;
	newPixelY = event.pageY;
	
	newGamePos = this.parentMap.convertWindowPixelToGamePos(newPixelX, newPixelY);
	
	this.displayData.points[this.draggingPathHandle  ] = newGamePos.x;
	this.displayData.points[this.draggingPathHandle+1] = newGamePos.y;
	
	this.computePathSize();
	this.updateFormPosition();
	this.computeOffset();
	this.updatePath();
	
	this.parentMap.redrawCanvas();
	
	event.preventDefault();
	return true;
}


uesp.gamemap.Location.prototype.updateFormPosition = function (x, y)
{
	if (x == null) x = this.x;
	if (y == null) y = this.y;
	
	$(this.popupElement).find('input[name=x]').val(x);
	$(this.popupElement).find('input[name=y]').val(y);
}


uesp.gamemap.Location.prototype.updatePathEditHandlesCursor = function (event)
{
	if (this.lastHoverPathHandle < 0)
	{
		if (event != null && event.shiftKey)
		{
			if (this.pathElement) this.pathElement.css('cursor', 'crosshair');
			this.parentMap.editClickWall.css('cursor', 'crosshair');
		}
		else
		{
			if (this.pathElement) this.pathElement.css('cursor', '');
			this.parentMap.editClickWall.css('cursor', 'default');
		}
		
		return true;
	}
	
	if (event != null && event.ctrlKey)
	{
		if (this.pathElement) this.pathElement.css('cursor',  'no-drop');
		this.parentMap.editClickWall.css('cursor', 'no-drop');
	}
	else
	{
		if (this.pathElement) this.pathElement.css('cursor', 'pointer');
		this.parentMap.editClickWall.css('cursor', 'default');
	}
	
	return true;
}


uesp.gamemap.Location.prototype.onPathEditHandlesMouseMove = function (event)
{
	var avgScale = (this.pixelWidth / this.width + this.pixelHeight / this.height) / 2.0;
	if (avgScale === 0) avgScale = 1;
	
	var handleSize = uesp.gamemap.Location.PATH_EDITHANDLE_SIZE / avgScale;
	var gamePos = this.parentMap.convertPixelToGamePos(event.pageX, event.pageY);
	
	for (i = 0; i < this.displayData.points.length; i += 2)
	{
		var x1 = this.displayData.points[i] - handleSize/2;
		var y1 = this.displayData.points[i+1] - handleSize/2;
		var x2 = x1 + handleSize;
		var y2 = y1 + handleSize;
		
		if (gamePos.x >= x1 && gamePos.x <= x2 && gamePos.y >= y1 && gamePos.y <= y2)
		{
			if (this.lastHoverPathHandle == i) return true;
			
			if (this.lastHoverPathHandle >= 0)
			{
				this.drawPathHandle(this.lastHoverPathHandle, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR);
			}
			
			this.drawPathHandle(i, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR_HOVER);
			this.lastHoverPathHandle = i;
			this.updatePathEditHandlesCursor(event);
			
			return true;
		}
	}
	
	if (this.lastHoverPathHandle >= 0)
	{
		this.drawPathHandle(this.lastHoverPathHandle, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR);
	}
	
	this.lastHoverPathHandle = -1;
	this.updatePathEditHandlesCursor(event);
	
	return false;
}


uesp.gamemap.Location.prototype.onPathEditHandlesMouseMoveCanvas = function (event)
{
	var avgScale = (this.pixelWidth / this.width + this.pixelHeight / this.height) / 2.0;
	if (avgScale === 0) avgScale = 1;
	
	var handleSize = uesp.gamemap.Location.PATH_EDITHANDLE_SIZE / avgScale;
	var gamePos = this.parentMap.convertWindowPixelToGamePos(event.pageX, event.pageY);
	
	for (i = 0; i < this.displayData.points.length; i += 2)
	{
		var x1 = this.displayData.points[i] - handleSize/2;
		var y1 = this.displayData.points[i+1] - handleSize/2;
		var x2 = x1 + handleSize;
		var y2 = y1 + handleSize;
		
		if (gamePos.x >= x1 && gamePos.x <= x2 && gamePos.y >= y1 && gamePos.y <= y2)
		{
			if (this.lastHoverPathHandle == i) return true;
			
			if (this.lastHoverPathHandle >= 0)
			{
				this.drawPathHandleCanvas(this.lastHoverPathHandle, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR);
			}
			
			this.drawPathHandleCanvas(i, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR_HOVER);
			this.lastHoverPathHandle = i;
			this.updatePathEditHandlesCursor(event);
			
			return true;
		}
	}
	
	if (this.lastHoverPathHandle >= 0)
	{
		this.drawPathHandleCanvas(this.lastHoverPathHandle, uesp.gamemap.Location.PATH_EDITHANDLE_COLOR);
	}
	
	this.lastHoverPathHandle = -1;
	this.updatePathEditHandlesCursor(event);
	
	return false;
}


uesp.gamemap.Location.prototype.onPathMouseMoveCanvas = function (event)
{
	if (this.draggingPathHandle >= 0) return this.onPathEditHandlesDragMove(event);
	if (this.editPathHandles) return this.onPathEditHandlesMouseMoveCanvas(event);
	
	if (this.useEditPopup && this.popupElement != null) return false;
	
		// Path hover detection done elsewhere
	
	return false;
}


uesp.gamemap.Location.prototype.onPathMouseMove = function (event)
{
	if (this.parentMap.USE_CANVAS_DRAW) return this.onPathMouseMoveCanvas(event);
	
	if (this.draggingPathHandle >= 0) return this.onPathEditHandlesDragMove(event);
	if (this.editPathHandles) return this.onPathEditHandlesMouseMove(event);
	
	if (this.useEditPopup && this.popupElement != null) return false;
	
	var ca = event.target;
	var co = ca.getContext('2d');
	var offset = $(ca).offset();
	
	avgScale = (this.pixelWidth / this.width + this.pixelHeight / this.height) / 2.0;
	if (avgScale === 0) avgScale = 1;

	if (co.isPointInPath(event.pageX - offset.left, event.pageY - offset.top) ||
		(co.isPointInStroke && co.isPointInStroke(event.pageX - offset.left, event.pageY - offset.top)) )
	{
		if (this.isPathHovering) return;
		this.isPathHovering = true;
		co.clearRect(this.x, this.y - this.height, this.width, this.height);
		
		if (this.locType == uesp.gamemap.LOCTYPE_AREA)
		{
			co.fillStyle = this.displayData.hover.fillStyle;
			co.fill();
		}
		
		co.lineWidth = this.displayData.hover.lineWidth / avgScale;
		co.strokeStyle = this.displayData.hover.strokeStyle;
		co.stroke();
		
		this.onLabelMouseOver(event);
		ca.style.cursor = "pointer";
	}
	else
	{
		if (!this.isPathHovering) return;
		this.isPathHovering = false;
		co.clearRect(this.x, this.y - this.height, this.width, this.height);
		
		
		if (this.locType == uesp.gamemap.LOCTYPE_AREA)
		{
			co.fillStyle = this.displayData.fillStyle;
			co.fill();
		}
		
		co.lineWidth = this.displayData.lineWidth / avgScale;
		co.strokeStyle = this.displayData.strokeStyle;
		co.stroke();
		
		this.onLabelMouseOut(event);
		
		ca.style.cursor = "url(grab.cur) 8 8, default";
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
	if (event.shiftKey) return this.onPathEditHandlesAdd(event);
	if (this.lastHoverPathHandle < 0) return false;
	if (event.ctrlKey) return this.onPathEditHandlesDelete(this.lastHoverPathHandle);
	
	this.onPathEditHandlesDragStart(event, this.lastHoverPathHandle);
	return false;
}


uesp.gamemap.Location.prototype.onPathEditHandlesAdd = function (event)
{
	gamePos = this.parentMap.convertWindowPixelToGamePos(event.pageX, event.pageY);
	
	if (this.displayData.points.length <= 3)
	{
		this.displayData.points.push(gamePos.x);
		this.displayData.points.push(gamePos.y);
		
		this.computePathSize();
		this.updateFormPosition();
		this.computeOffset();
		this.updatePath();
		
		this.parentMap.redrawCanvas();
		
		return true;
	}
	
	insertPointIndex = this.findClosestLineSegment(gamePos.x, gamePos.y);
	if (insertPointIndex < 0) insertPointIndex = this.displayData.points.length - 2;
	
	this.displayData.points.splice(insertPointIndex + 2, 0, gamePos.x, gamePos.y);
	
	this.computePathSize();
	this.updateFormPosition();
	this.computeOffset();
	this.updatePath();
	
	this.parentMap.redrawCanvas();
	
	return true;
}


uesp.gamemap.Location.prototype.findClosestLineSegment = function (px, py)
{
	if (this.displayData.points.length <= 3) return 0;
	
	x1 = this.displayData.points[0];
	y1 = this.displayData.points[1];
	x2 = this.displayData.points[2];
	y2 = this.displayData.points[3];
	
	minPointIndex = 0;
	minDistance = uesp.distToSegment2(px, py, x1, y1, x2, y2);
	
	for (i = 2; i < this.displayData.points.length; i += 2)
	{
		x1 = this.displayData.points[i];
		y1 = this.displayData.points[i+1];
		
		if (i < this.displayData.points.length)
		{
			x2 = this.displayData.points[i+2];
			y2 = this.displayData.points[i+3];
		}
		else if (this.locType == uesp.gamemap.LOCTYPE_PATH)
		{
			break;
		}
		else
		{
			x2 = this.displayData.points[0];
			y2 = this.displayData.points[1];
		}
		
		distance = uesp.distToSegment2(px, py, x1, y1, x2, y2);
		
		if (distance < minDistance)
		{
			minDistance = distance;
			minPointIndex = i;
		}
	}
	
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "findClosestLineSegment", minPointIndex, minDistance);
	return minPointIndex;
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
	
	this.parentMap.redrawCanvas();
	
	return true;
}


uesp.gamemap.Location.prototype.onPathEditHandlesDragEnd = function (event)
{
	this.draggingPathHandle = -1;
	this.updatePath();
	this.parentMap.redrawCanvas(true);
	
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
	
	this.x = xMin;
	this.y = yMax;
	
	this.width  = xMax - xMin;
	this.height = yMax - yMin;
	
	return true;
}


uesp.gamemap.Location.prototype.onPathMouseUp = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onPathMouseUp");
	
	if (this.draggingPathHandle >= 0) return this.onPathEditHandlesDragEnd(event);
	
	return false;
}


uesp.gamemap.Location.prototype.onPathMouseDown = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onPathMouseDown");
	
	if (this.editPathHandles) return this.onPathEdit/andlesMouseDown(event);
	
	var ca = event.target;
	var co = ca.getContext('2d');
	var offset = $(ca).offset();
	
	if (co.isPointInPath(event.pageX - offset.left, event.pageY - offset.top) || 
		(co.isPointInStroke && co.isPointInStroke(event.pageX - offset.left, event.pageY - offset.top)))
	{
		return false;
	}
	
	var bottomEvent = new $.Event("mousedown");
	
	bottomEvent.pageX = event.pageX;
	bottomEvent.pageY = event.pageY;
	bottomEvent.which = event.which;
	
	let bottomLayer = $(".gmMapTile:first");
	if (bottomLayer.length == 0) bottomLayer = $("#gmMapCanvas");
	bottomLayer.trigger(bottomEvent);
	
	return false;
}


uesp.gamemap.Location.prototype.onPathMouseOut = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, "onPathMouseOut");
	
	var ca = event.target;
	var co = ca.getContext('2d');
	
	this.isPathHovering = false;
	
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
	
	this.onLabelMouseOut(event);
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


uesp.gamemap.Location.prototype.onPathKeyDown = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, 'onPathKeyDown');
	
	if (this.editPathHandles) return this.onPathEditHandlesKeyDown(event);
	
	return true;
}


uesp.gamemap.Location.prototype.onPathEditHandlesKeyDown = function (event)
{
	this.updatePathEditHandlesCursor(event);
	
	return true;
}


uesp.gamemap.Location.prototype.onPathKeyUp = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_INFO, 'onPathKeyUp');
	
	if (this.editPathHandles) return this.onPathEditHandlesKeyUp(event);
	
	return true;
}


uesp.gamemap.Location.prototype.onPathEditHandlesKeyUp = function (event)
{
	this.updatePathEditHandlesCursor(event);
	return true;
}


uesp.gamemap.Location.prototype.onPathClick = function (event)
{
	if (this.editPathHandles) return this.onPathEditHandlesClick(event);
	
	var ca = event.target;
	var co = ca.getContext('2d');
	var offset = $(ca).offset();
	
	if (co.isPointInPath(event.pageX - offset.left, event.pageY - offset.top) ||
		(co.isPointInStroke && co.isPointInStroke(event.pageX - offset.left, event.pageY - offset.top)) )
	{
		uesp.logDebug(uesp.LOG_LEVEL_WARNING, "clicked path");
		
		if (this.parentMap.canEdit() && event.shiftKey)
		{
			this.useEditPopup = true;
			this.togglePopup();
		}
		else if (!this.useEditPopup && this.destinationId != 0 && this.parentMap.jumpToDestinationOnClick)
		{
			this.onJumpToDestination();
		}
		else
		{
			this.useEditPopup = false;
			this.togglePopup();
		}
	}
	
	return false;
}


uesp.gamemap.Location.prototype.onPathDblClick = function (event)
{
	uesp.logDebug(uesp.LOG_LEVEL_WARNING, "double-clicked path");
	
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
	bottomEvent.which = event.which;
	
	let bottomLayer = $(".gmMapTile:first");
	if (bottomLayer.length == 0) bottomLayer = $("#gmMapCanvas");
	bottomLayer.trigger(bottomEvent);
	
	return false;
}


uesp.gamemap.Location.prototype.createPath = function ()
{uesp.logDebug(uesp.LOG_LEVEL_INFO, "onPathMouseDown");
	var divSize = this.parentMap.convertGameToPixelSize(this.width, this.height);
	var divW = divSize.x;
	var divH = divSize.y;
	var elementClass = (this.locType == uesp.gamemap.LOCTYPE_PATH) ? 'gmMapPathCanvas' : 'gmMapAreaCanvas';
	
	this.pathElement = $('<canvas></canvas>').addClass(elementClass)
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
	this.pathElement.keydown(function (e) { self.onPathKeyDown(e); });
	this.pathElement.keyup(function (e) { self.onPathKeyUp(e); });
	this.pathElement.mouseup(function (e) { self.onPathMouseUp(e); });
	this.pathElement.mouseout(function (e) { self.onPathMouseOut(e); });
	this.pathElement.mousemove(function (e) { self.onPathMouseMove(e); });
}


uesp.gamemap.Location.prototype.createWikiLinkHref = function()
{
	wikiLink = this.createWikiLink();
	if (wikiLink == "") return ""
	return 'href="' + wikiLink + '"';
}


uesp.gamemap.Location.prototype.createWikiLink = function()
{
	if (this.parentMap.mapOptions.wikiNamespace != null && this.parentMap.mapOptions.wikiNamespace.length > 0)
	{
		if (this.wikiPage == "") return "";
		
		if (this.wikiPage.indexOf(":") >= 0)
		{
			var safeWikiPage = encodeURIComponent(this.wikiPage).replace("%3A", ":").replace("%2F", "/");
			return this.parentMap.mapOptions.wikiUrl + safeWikiPage;
		}
		else
		{
			return this.parentMap.mapOptions.wikiUrl + this.parentMap.mapOptions.wikiNamespace + ':' + encodeURIComponent(this.wikiPage);
		}
	}
	
	if (this.wikiPage == "") return "";
	return this.parentMap.mapOptions.wikiUrl + encodeURIComponent(this.wikiPage);
}


uesp.gamemap.Location.prototype.updatePathCanvas = function ()
{
	this.updatePathOffset();
	
	if (this.locType < uesp.gamemap.LOCTYPE_PATH) return;
	
	var pixelSize = this.parentMap.convertGameToPixelSize(this.width, this.height);
	
	this.pixelWidth  = pixelSize.x;
	this.pixelHeight = pixelSize.y;
	
	this.drawPathCanvas();
	if (this.editPathHandles) this.drawPathHandlesCanvas();
}


uesp.gamemap.Location.prototype.updatePath = function ()
{
	if (this.parentMap.USE_CANVAS_DRAW) return this.updatePathCanvas();
	
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
		this.updateIcon();
		this.updateLabel();
	}
	else if (this.locType == uesp.gamemap.LOCTYPE_PATH)
	{
		this.updateIcon();
		this.updateLabel();
		this.updatePath();
	}
	else if (this.locType == uesp.gamemap.LOCTYPE_AREA)
	{
		this.updateIcon();
		this.updateLabel();
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
	7 : 'Bottom Left',
	8 : 'Bottom Center',
	9 : 'Bottom Right'
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


uesp.gamemap.Location.prototype.hideIconTypeCustomList = function()
{
	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
	var iconTypeListHeader = this.popupElement.find('.gmMapIconTypeListHeader');
	
	if (iconTypeList.length == 0) return false;
	
	iconTypeListHeader.removeClass('gmMapIconTypeListHeaderOpen');
	iconTypeList.hide();
	
	return true;
}


uesp.gamemap.Location.prototype.showIconTypeCustomList = function()
{
	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
	var iconTypeListHeader = this.popupElement.find('.gmMapIconTypeListHeader');
	
	if (iconTypeList.length == 0) return false;
	
	iconTypeListHeader.addClass('gmMapIconTypeListHeaderOpen');
		
	iconTypeList.show().focus();
}


uesp.gamemap.Location.prototype.setIconTypeCustomListValue = function(iconType)
{
	listHeader= this.popupElement.find('.gmMapIconTypeListHeader');
	if (listHeader == null) return;
	
	if (this.parentMap.mapOptions.iconTypeMap == null)
	{
		listHeader.text(iconType);
		return;
	}
	
	if (iconType <= 0)
	{
		iconLabel = "None";
	}
	else
	{
		iconLabel = this.parentMap.mapOptions.iconTypeMap[iconType];
	}
	
	listHeader.text(iconLabel);
	this.popupElement.find('.gmMapIconTypeListContainer input[name="iconType"]').val(iconType);
	this.updateEditPopupIconPreview(iconType);
}


uesp.gamemap.Location.prototype.selectIconTypeCustomList = function(iconType)
{
	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
	
	iconTypeList.find('.gmMapIconTypeLabel').removeClass('gmMapIconTypeLabelSelected');
	iconTypeList.find('.gmMapIconTypeValue:contains("' + iconType + '")').first().next().addClass('gmMapIconTypeLabelSelected');
}


uesp.gamemap.Location.prototype.changeSelectIconTypeCustomList = function(deltaSelect)
{
	var $iconTypeList = this.popupElement.find('.gmMapIconTypeList');
	selectedElement = $iconTypeList.find('.gmMapIconTypeLabelSelected');
	curElement = selectedElement.parent();
	
	while (deltaSelect != 0)
	{
		if (deltaSelect < 0)
		{
			nextElement = curElement.prev();
			deltaSelect += 1;
		}
		else
		{
			nextElement = curElement.next();
			deltaSelect -= 1;
		}
		
		if (nextElement == null || nextElement.length == 0) break;
		curElement = nextElement;
	}
	
	selectedElement.removeClass('gmMapIconTypeLabelSelected');
	curElement.find('.gmMapIconTypeLabel').addClass('gmMapIconTypeLabelSelected');
	this.scrollIconTypeCustomList();
}


uesp.gamemap.Location.prototype.scrollIconTypeCustomList = function()
{
	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
	selectedElement = iconTypeList.find('.gmMapIconTypeLabelSelected').first();
	
	if (selectedElement == null) 
	{
		iconTypeList.scrollTop(0);
		return;
	}
	
	iconTypeList.scrollTop(selectedElement.offset().top - iconTypeList.offset().top + iconTypeList.scrollTop() - 20);
}


uesp.gamemap.Location.prototype.createIconTypeCustomListEvents = function()
{
	var self = this;
	var iconTypeList = this.popupElement.find('.gmMapIconTypeList');
	var listHeader = this.popupElement.find('.gmMapIconTypeListHeader');
	
	listHeader.click(function (e) {
		self.showIconTypeCustomList();
		self.scrollIconTypeCustomList();
	});
	
	iconTypeList.find('li').mousedown(function (e) {
		iconType = $(e.target).parents('li').find('.gmMapIconTypeValue').text();
		self.setIconTypeCustomListValue(iconType);
		self.selectIconTypeCustomList(iconType);
		self.hideIconTypeCustomList();
	});
	
	iconTypeList.on('DOMMouseScroll mousewheel', { self: this }, function (event) {
		self = event.data.self;
		deltaY = -20;
		if (event.originalEvent.detail > 0 || event.originalEvent.wheelDelta < 0) deltaY = -deltaY;
		
		iconTypeList.scrollTop(iconTypeList.scrollTop() + deltaY);
		
		event.preventDefault();
		return false;
	});
	
	iconTypeList.blur(function (e) {
		self.hideIconTypeCustomList();
	});
	
	listHeader.keydown(function (event) {
		
		if (isNaN(event.which))
			charPressed = event.which.toLowerCase();
		else
			charPressed = String.fromCharCode(event.which).toLowerCase();
		
		if (event.keyCode == 13 || event.keyCode == 40 || event.keyCode == 38 || event.keyCode == 36 || event.keyCode == 35 || event.keyCode == 33 || event.keyCode == 34)
		{
			self.showIconTypeCustomList();
			self.popupElement.find('.gmMapIconTypeList').trigger(event);
		}
		else if (charPressed >= 'a' && charPressed <= 'z')
		{
			self.showIconTypeCustomList();
			self.popupElement.find('.gmMapIconTypeList').trigger(event);
		}
		else if (event.keyCode == 27)
		{
			self.hideIconTypeCustomList();
		}
			
	});
	
	iconTypeList.keydown(function (event) {
		event.preventDefault();
		
		if (isNaN(event.which))
			charPressed = event.which.toLowerCase();
		else
			charPressed = String.fromCharCode(event.which).toLowerCase();
		
		if (event.keyCode == 27)	//esc
		{
			self.hideIconTypeCustomList();
		}
		else if (event.keyCode == 13) //enter
		{
			selectedElement = iconTypeList.find('.gmMapIconTypeLabelSelected').first();
			iconType = selectedElement.prev().text();
			self.setIconTypeCustomListValue(iconType);
			self.hideIconTypeCustomList();
		}
		else if (event.keyCode == 40) //down
		{
			self.changeSelectIconTypeCustomList(1);
		}
		else if (event.keyCode == 38) //up
		{
			self.changeSelectIconTypeCustomList(-1);
		}
		else if (event.keyCode == 36) //home
		{
			self.changeSelectIconTypeCustomList(-1000);
		}
		else if (event.keyCode == 35) //end
		{
			self.changeSelectIconTypeCustomList(1000);
		}
		else if (event.keyCode == 33) //pageup
		{
			self.changeSelectIconTypeCustomList(-10);
		}
		else if (event.keyCode == 34) //pagedown
		{
			self.changeSelectIconTypeCustomList(10);
		}
		else if (charPressed >= 'a' && charPressed <= 'z')
		{
			var $target = iconTypeList.find('.gmMapIconTypeLabel').filter(function () {
				return $(this).text()[0].toLowerCase() == charPressed;
			}).first();
			
			if ($target.length == 0) return false;
			
			iconTypeList.find('.gmMapIconTypeLabelSelected').removeClass('gmMapIconTypeLabelSelected');
			$target.addClass('gmMapIconTypeLabelSelected');
			self.scrollIconTypeCustomList();
		}
		
		return false;
	});
}


uesp.gamemap.Location.prototype.getIconTypeCustomList = function(currentIconType)
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
	
	var output = "<div tabindex='0' class='gmMapIconTypeListContainer'>";
	output += "<div class='gmMapIconTypeListHeader'></div>"
	output += "<input type='hidden' name='iconType' value='{iconType}' />";
	output += "<ul tabindex='0' class='gmMapIconTypeList' style='display: none'>";
	output += "<li><div class='gmMapIconTypeValue'>0</div><div class='gmMapIconTypeLabel" + (currentIconType == 0 ? ' gmMapIconTypeLabelSelected' : '') + "'> None</div></li>";
	
	for (key in sortedIconTypeArray)
	{
		iconTypeLabel = sortedIconTypeArray[key];
		iconType = reverseIconTypeMap[iconTypeLabel];
		
		output += "<li><div class='gmMapIconTypeValue'>" + iconType + "</div><div class='gmMapIconTypeLabel" + (currentIconType == iconType ? ' gmMapIconTypeLabelSelected' : '') + "'>" + iconTypeLabel;
		output += "<img src='" + this.parentMap.mapOptions.iconPath + iconType + ".png' />";
		output += "</div></li>";
	}
	
	output += "</ul></div>"
	return output;
	
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


uesp.gamemap.Location.prototype.isPopupOpen = function ()
{
	if (this.popupElement == null) return false;
	return this.popupElement.is(":visible");
}


uesp.gamemap.Location.prototype.shouldShowTooltip = function ()
{
	if (this.isPopupOpen()) return false;
	//if (this.displayData.labelPos != 0) return false;
	
	return true;
}


uesp.gamemap.Location.prototype.onTooltipMouseMove = function (event)
{
	if (this.pathElement != null)
	{
		var bottomEvent = new $.Event("mousemove");
		bottomEvent.pageX = event.pageX;
		bottomEvent.pageY = event.pageY;
		bottomEvent.which = event.which;
		
		this.pathElement.trigger(bottomEvent);
		event.preventDefault();
	}
}


uesp.gamemap.Location.prototype.updateTooltip = function ()
{
	if (this.tooltipElement == null)
	{
		var self = this;
		
		this.tooltipElement = $("<div />")
									.addClass('gmLocToolTip')
									.css('display', 'none')
									.mousemove(function(e) { self.onTooltipMouseMove(e); })
									.appendTo(this.parentMap.mapRoot);
	}
	
	this.updateTooltipOffset();
	
	if (this.wikiPage != "" && this.name != this.wikiPage)
		this.tooltipElement.html(this.name + "<div class='gmLocTooltipDesc'>" + this.description + "<br/>" + this.wikiPage + "</div>");
	else
		this.tooltipElement.html(this.name + "<div class='gmLocTooltipDesc'>" + this.description + "</div>");
	
	return true;
}


uesp.gamemap.Location.prototype.updateTooltipOffset = function ()
{
	if (this.tooltipElement == null) return;
	
	if (this.parentMap.USE_CANVAS_DRAW)
	{
		$(this.tooltipElement).offset( { left: this.offsetLeft + this.parentMap.mapTransformX + 16, top: this.offsetTop + this.parentMap.mapTransformY + 8 });
	}
	else
	{
		$(this.tooltipElement).offset( { left: this.offsetLeft + 8, top: this.offsetTop - 16 });
	}
}


uesp.gamemap.Location.prototype.showTooltip = function ()
{
	this.updateTooltip();
	this.tooltipElement.show();
	this.updateTooltipOffset();
}

uesp.gamemap.Location.prototype.hideTooltip = function ()
{
	if (this.tooltipElement == null) return;
	this.tooltipElement.hide();
}


uesp.gamemap.Location.prototype.removetooltip = function ()
{
	if (this.tooltipElement == null) return;
	
	this.tooltipElement.remove();
	this.tooltipElement = null;
}


uesp.gamemap.Location.prototype.onLabelMouseOver = function (event)
{
	//uesp.logDebug(uesp.LOG_LEVEL_WARNING, 'onLabelMouseOver');
	if (this.shouldShowTooltip()) this.showTooltip();
}


uesp.gamemap.Location.prototype.onLabelMouseOut = function (event)
{
	//uesp.logDebug(uesp.LOG_LEVEL_WARNING, 'onLabelMouseOut');
	this.hideTooltip();
}


uesp.gamemap.Location.prototype.isMouseHoverCanvas = function (x, y)
{
	if (this.labelCanvasIsShown)
	{
		var x1 = x - this.parentMap.mapTransformX;
		var y1 = y - this.parentMap.mapTransformY;
		
		if (x1 >= this.labelCanvasExtents.left && x1 <= this.labelCanvasExtents.right && y1 >= this.labelCanvasExtents.top && y1 <= this.labelCanvasExtents.bottom) return true;
	}
	
	if (this.locType == uesp.gamemap.LOCTYPE_POINT)
	{
		var iconWidth = 2;
		var iconHeight = 2;
		
		if (this.iconImage && this.iconImage.width)
		{
			iconWidth = this.iconImage.width;
			iconHeight = this.iconImage.height;
		}
		
		var gamePos1 = this.parentMap.convertPixelToGamePos(x - iconWidth/2, y - iconHeight/2);
		var gamePos2 = this.parentMap.convertPixelToGamePos(x + iconWidth/2, y + iconHeight/2);
		
		if (this.x >= gamePos1.x && this.x <= gamePos2.x && this.y >= gamePos2.y && this.y <= gamePos1.y)
		{
			return true;
		}
		
	}
	else if (this.locType == uesp.gamemap.LOCTYPE_PATH)
	{
		var gamePos = this.parentMap.convertPixelToGamePos(x, y);
		
		if (gamePos.x < this.x || gamePos.x > this.x + this.width || gamePos.y > this.y || gamePos.y < this.y - this.height) return false;
		if (this.pathObject == null) return false;
		
		if (this.parentMap.mapContext.isPointInPath(this.pathObject, x, y) || (this.parentMap.mapContext.isPointInStroke && this.parentMap.mapContext.isPointInStroke(this.pathObject, x, y)) ) return true;
	}
	else if (this.locType == uesp.gamemap.LOCTYPE_AREA)
	{
		var gamePos = this.parentMap.convertPixelToGamePos(x, y);
		
		if (gamePos.x < this.x || gamePos.x > this.x + this.width || gamePos.y > this.y || gamePos.y < this.y - this.height) return false;
		if (this.pathObject == null) return false;
		
		if (this.parentMap.mapContext.isPointInPath(this.pathObject, x, y) || (this.parentMap.mapContext.isPointInStroke && this.parentMap.mapContext.isPointInStroke(this.pathObject, x, y)) ) return true;
	}
	
	return false;
}


uesp.gamemap.createLocationFromJson = function(data, parentMap)
{
	var newLocation = new uesp.gamemap.Location(parentMap);
	newLocation.mergeFromJson(data);
	return newLocation;
}


