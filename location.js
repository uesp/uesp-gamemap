/*
 * location.js -- Created by Dave Humphrey (dave@uesp.net) on 23 Jan 2014
 * 		Released under the GPL v2
 *
 */


uesp.gamemap.LOCTYPE_NONE  = 0;
uesp.gamemap.LOCTYPE_POINT = 1;
uesp.gamemap.LOCTYPE_PATH  = 2;
uesp.gamemap.LOCTYPE_AREA  = 3;


uesp.gamemap.Location = function()
{
	this.id = -1;
	this.worldId = -1;
	this.revisionId = -1;
	this.destinationId = -1;
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
	
	this.displayData = {};
	
	this.labelElement = null;
	this.iconElement  = null;
	this.popupElement = null;
	
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
	if ( !(this.popupElement == null)) $(this.popupElement).hide(duration);
}


uesp.gamemap.Location.prototype.showElements = function (duration)
{
	if ( !(this.labelElement == null)) $(this.labelElement).show(duration);
	if ( !(this.iconElement  == null)) $(this.iconElement).show(duration);
	
	this.updateLabelOffset();
	this.updateIconOffset();
}


uesp.gamemap.Location.prototype.mergeFromJson = function(data)
{
	uesp.gamemap.mergeObjects(this, data);
	
	if (!uesp.gamemap.isNullorUndefined(data.displayData))
	{
		this.displayData = jQuery.parseJSON( this.displayData );
	}
}


uesp.gamemap.Location.prototype.removeElements = function ()
{
	if ( !(this.labelElement == null)) $(this.labelElement).remove();
	if ( !(this.iconElement  == null)) $(this.iconElement).remove();
	if ( !(this.popupElement == null)) $(this.popupElement).remove();
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
	
}


uesp.gamemap.Location.prototype.onLabelClickFunction = function()
{
	var self = this;
	
	return function()
	{
		uesp.logDebug(uesp.LOG_LEVEL_ERROR, "Label Click", self);
		self.togglePopup();
	};
}


uesp.gamemap.Location.prototype.updateLabel = function ()
{
	var labelPos = 0;
	
	if (this.labelElement == null)
	{
		this.labelElement = $('<div />').addClass('gmMapLoc')
			.appendTo('#gmMapRoot')
			.click(this.onLabelClickFunction())
			.attr('unselectable', 'on')
			.css('user-select', 'none')
			.on('selectstart', false);
	}
	
	if ( !(this.displayData.labelPos == null) ) labelPos = this.displayData.labelPos;
	
	var labelWidth = this.name.length*6 + 2;
	
	switch (labelPos) {
		case 1:
			anchorPoint = 'topLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = 8;
			this.labelOffsetTop  = 4;
			break;
		case 2:
			anchorPoint = 'topCenter';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = 4;
			break;
		case 3:
			anchorPoint = 'topRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + 8;
			this.labelOffsetTop  = 4;
			break;
		case 4:
			anchorPoint = 'midRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + 8;
			this.labelOffsetTop  = 16;
			break;
		case 5:
			anchorPoint = 'bottomRight';
			labelTextAlign = 'right';
			this.labelOffsetLeft = labelWidth + 8;
			this.labelOffsetTop  = 26;
			break;
		case 6:
			anchorPoint = 'bottomCenter';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = 26;
			break;
		case 7:
			anchorPoint = 'bottomLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = 8;
			this.labelOffsetTop  = 26;
			break;
		case 8:		// Fall through
		default:
			anchorPoint = 'midLeft';
			labelTextAlign = 'left';
			this.labelOffsetLeft = -8;
			this.labelOffsetTop  = 16;
			break;
		case 9:
			anchorPoint = 'center';
			labelTextAlign = 'center';
			this.labelOffsetLeft = labelWidth/2;
			this.labelOffsetTop  = 16;
			break;
	}
	
	$(this.labelElement).css({ textAlign: labelTextAlign, width: labelWidth });
	$(this.labelElement).text(this.name);
	
	this.updateLabelOffset();
}


uesp.gamemap.Location.prototype.updateIcon = function (mapOptions)
{
	if (this.displayData.iconType == null) return;
	
	var missingURL = mapOptions.iconPath + mapOptions.iconMissing;
	var imageURL   = mapOptions.iconPath + this.displayData.iconType + ".png";
	
	if (this.iconElement == null)
	{	
		this.iconElement = $('<div />')
				.addClass('gmMapLocIconDiv')
				.appendTo('#gmMapRoot');
		
		$('<span />').addClass('gmMapLocIconHelper').appendTo(this.iconElement);
		
		$('<img />').addClass('gmMapLocIcon')
			.load(uesp.gamemap.onLoadIconSuccess)
			.error(uesp.gamemap.onLoadIconFailed(missingURL))
			.attr('src', imageURL)
			.click(this.onLabelClickFunction())
			.attr('unselectable', 'on')
			.css('user-select', 'none')
			.on('selectstart', false)
			.appendTo(this.iconElement);
	}
	else
	{
		$(this.iconElement.children[1]).attr('src', imageURL);
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


uesp.gamemap.Location.prototype.updatePopup = function ()
{
	var popupDiv;
	var popupContent =  "<div class='gmMapPopupClose'><img src='images/cancelicon.png' onclick='return uesp.gamemap.onCloseLocationPopup(this);' width='12' height='12' /></div>" + 
						"<div class='gmMapPopupTitle'><a href='{wikiLink}'>{name}</a></div>" + 
						"<div class='gmMapPopupPos'>Location: {x}, {y}</div>" +
						"<div class='gmMapPopupDesc'>{description}</div>";
	
	if (this.popupElement == null)
	{
		this.popupElement = $('<div />').addClass('gmMapPopupRoot')
				.appendTo('#gmMapRoot');
		
		popupDiv = $('<div />').addClass('gmMapPopup')
				.appendTo(this.popupElement);
		
		$('<div />').addClass('gmMapPopupDownArrow')
		.appendTo(this.popupElement);
	}
	else
	{
		popupDiv = this.popupElement.children[0];
	}
	
	popupHtml = uesp.template2(popupContent, this, this.displayData);
	$(popupDiv).html(popupHtml);
	
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


uesp.gamemap.Location.prototype.updateData = function (mapOptions)
{
	this.wikiLink = mapOptions.wikiUrl + this.wikiPage;
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
}


uesp.gamemap.createLocationFromJson = function(data)
{
	var newLocation = new uesp.gamemap.Location();
	newLocation.mergeFromJson(data);
	return newLocation;
}


