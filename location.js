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
}


uesp.gamemap.Location.prototype.removeElements = function ()
{
	if ( !(this.labelElement == null)) $(this.labelElement).remove();
	if ( !(this.iconElement  == null)) $(this.iconElement).remove();
	if ( !(this.popupElement == null)) $(this.popupElement).remove();
	if ( !(this.pathElement  == null)) $(this.pathElement).remove();
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


uesp.gamemap.Location.prototype.updateIcon = function ()
{
	if (this.displayData.iconType == null) return;
	
	var missingURL = this.parentMap.mapOptions.iconPath + this.parentMap.mapOptions.iconMissing;
	var imageURL   = this.parentMap.mapOptions.iconPath + this.displayData.iconType + ".png";
	
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


uesp.gamemap.onJumpToDestination = function(destId)
{
	console.debug("Jumping to destinationId " + destId);
	return false;
}


uesp.gamemap.Location.prototype.updatePopup = function ()
{
	var popupDiv;
	var popupContent =  "<div class='gmMapPopupClose'><img src='images/cancelicon.png' onclick='return uesp.gamemap.onCloseLocationPopup(this);' width='12' height='12' /></div>" + 
						"<div class='gmMapPopupTitle'><a href='{wikiLink}'>{name}</a></div>" + 
						"<div class='gmMapPopupPos'>Location: {x}, {y}</div>" +
						"<div class='gmMapPopupPos'>Internal ID: {id}</div>" +
						"<div class='gmMapPopupPos'>Destination ID: {destinationId}</div>" +
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
	
	if (this.destinationId > 0)
	{
		var destContent = "<div class='gmMapPopupDesc'><a href='' onclick='return uesp.gamemap.onJumpToDestination({destinationId});'>Jump to Destination</a></div>";
		popupHtml += uesp.template2(destContent, this, this.displayData);
	}
	
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


uesp.gamemap.Location.prototype.updatePathOffset = function ()
{
	if (this.pathElement == null) return;
	
	$(this.pathElement).offset( { left: this.offsetLeft, top: this.offsetTop });
	
	
}


uesp.gamemap.Location.prototype.updatePathSize = function ()
{
	if (this.locType < uesp.gamemap.LOCTYPE_PATH) return;
	if (this.pathElement == null) return;
	
	this.pathElement.attr( { width: this.pixelWidth, height: this.pixelHeight });
	
	var context = this.pathElement[0].getContext('2d');
	
	context.translate(-this.x * this.pixelWidth / this.width, -this.x * this.pixelHeight / this.height);
	context.scale(this.pixelWidth / this.width, this.pixelHeight / this.height);
	
	this.drawPath(context);
}


uesp.gamemap.Location.prototype.drawPath = function (context)
{
	var i = 0;
	
	context.clearRect(this.x, this.y, this.width, this.height);
	context.globalCompositeOperation = 'destination-atop';
	context.lineWidth = this.displayData.lineWidth;
	context.strokeStyle = this.displayData.strokeStyle;
	//console.debug(context.lineWidth, context.strokeStyle);
	
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


uesp.gamemap.Location.prototype.updateData = function ()
{
	this.wikiLink = this.parentMap.mapOptions.wikiUrl + this.wikiPage;
	
	var pixelSize = this.parentMap.convertGameToPixelSize(this.width, this.height);
	this.pixelWidth  = pixelSize.x;
	this.pixelHeight = pixelSize.y;
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


uesp.gamemap.Location.prototype.updatePath = function ()
{
	
	if (this.pathElement == null)
	{
		var divSize = this.parentMap.convertGameToPixelSize(this.width, this.height);
		console.log(divSize);
		
		var divW = divSize.x;
		var divH = divSize.y;
		var yConstant = this.height;
		
		this.pathElement = $('<canvas />').addClass('gmMapPathCanvas')
			.attr({'width': divW,'height': divH})
			.on('selectstart', false)
			.appendTo('#gmMapRoot');
		
		var c2 = this.pathElement[0].getContext('2d');
		
		c2.translate(-this.x * divW / this.width, -this.x * divH / this.height);
		c2.scale(divW / this.width, divH / this.height);
		
		this.drawPath(c2);
		
		var self = this;
		
		this.pathElement.click(function (e) {
			var ca = e.target;
			var co = ca.getContext('2d');
			var offset = $(ca).offset();
			
			if (co.isPointInPath(e.pageX - offset.left, e.pageY - offset.top) )
			{
				console.debug("clicked path");
			}
		});
		
		this.pathElement.dblclick(function (e) {
			var bottomEvent = new $.Event("dblclick");
	        
	        bottomEvent.pageX = e.pageX;
	        bottomEvent.pageY = e.pageY;
	        
	        $(".gmMapTile:first").trigger(bottomEvent);
	        
	        return false;
		});
		
		this.pathElement.mousedown(function (e) {
			console.debug("Canvas mousedown");
			var bottomEvent = new $.Event("mousedown");
	        
	        bottomEvent.pageX = e.pageX;
	        bottomEvent.pageY = e.pageY;
	        
	        $(".gmMapTile:first").trigger(bottomEvent);
	        
	        return false;
		});
		
		this.pathElement.mouseout(function (e) {
			var ca = e.target;
			var co = ca.getContext('2d');
			
			if (self.locType != uesp.gamemap.LOCTYPE_PATH)
			{
				co.fillStyle = self.displayData.fillStyle;
				co.fill();
			}
			else
			{
				co.fillStyle = 'rgba(255,0,0,0)';
				co.fill();
			}
			
			co.lineWidth = self.displayData.lineWidth;
			co.strokeStyle = self.displayData.strokeStyle;
			co.stroke();
		});
		
		this.pathElement.mousemove(function (e) {
			var ca = e.target;
			var co = ca.getContext('2d');
			var offset = $(ca).offset();

			if (co.isPointInPath(e.pageX - offset.left, e.pageY - offset.top) )
			{
				if (self.locType != uesp.gamemap.LOCTYPE_PATH)
				{
					co.fillStyle = self.displayData.hover.fillStyle;
					co.fill();
				}
				else
				{
					co.fillStyle = 'rgba(255,0,0,0)';
					co.fill();
				}
				
				co.lineWidth = self.displayData.hover.lineWidth;
				co.strokeStyle = self.displayData.hover.strokeStyle;
				co.stroke();
			}
			else
			{
				if (self.locType != uesp.gamemap.LOCTYPE_PATH)
				{
					co.fillStyle = self.displayData.fillStyle;
					co.fill();
				}
				else
				{
					co.fillStyle = 'rgba(255,0,0,0)';
					co.fill();
				}
				
				co.lineWidth = self.displayData.lineWidth;
				co.strokeStyle = self.displayData.strokeStyle;
				co.stroke();
			}
			
			//console.debug('Is point in path: ' + (? 'YES' : 'NO'));
		});
	}
	else
	{
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


uesp.gamemap.createLocationFromJson = function(data, gameMap)
{
	var newLocation = new uesp.gamemap.Location(gameMap);
	newLocation.mergeFromJson(data);
	return newLocation;
}


