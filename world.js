/*
 * world.js -- Created by Dave Humphrey (dave@uesp.net) on 22 Jan 2014
 * 		Released under the GPL v2
 *
 * TODO:
 * 		- parentId for zooming "out" to the parent map (if any)
 */


uesp.gamemap.World = function(worldName, mapOptions, worldId)
{
	this.name = worldName.toLowerCase();
	this.displayName = worldName;
	
	this.mapOptions = new uesp.gamemap.MapOptions(mapOptions);
	
	this.id = (worldId == null) ? 0 : worldId;
	this.parentId = -1;
	this.revisionId = 0;
	this.description = '';
	this.wikiPage = '';
	this.cellSize = -1;
	this.missingMapTile = this.mapOptions.missingMapTile;
	this.minZoom = this.mapOptions.minZoomLevel;
	this.maxZoom = this.mapOptions.maxZoomLevel;
	this.zoomOffset = this.mapOptions.zoomOffset;
	this.posLeft = this.mapOptions.gamePosX1;
	this.posTop = this.mapOptions.gamePosY1;
	this.posRight = this.mapOptions.gamePosX2;
	this.posBottom = this.mapOptions.gamePosY2;
	this.enabled = true;
	
	this.mapState = new uesp.gamemap.MapState();
	this.mapState.worldId = this.id;
	this.mapState.gamePos.x = this.mapOptions.initialGamePosX;
	this.mapState.gamePos.y = this.mapOptions.initialGamePosY;
	this.mapState.zoomLevel = this.mapOptions.initialZoom;
	
		/* Special case for ESO Tamriel Mundus map */
	if (worldId == 667) 
	{
		this.mapState.zoomLevel = 9;
	}
}


uesp.gamemap.World.prototype.mergeFromJson = function(data)
{
	uesp.gamemap.mergeObjects(this, data);
	this.updateOptions();
}


uesp.gamemap.World.prototype.updateOptions = function()
{
	this.mapState.worldId = this.id;
	
	this.mapOptions.minZoomLevel = this.minZoom;
	this.mapOptions.maxZoomLevel = this.maxZoom;
	this.mapOptions.zoomOffset   = this.zoomOffset;
	
	this.mapOptions.gamePosX1 = this.posLeft;
	this.mapOptions.gamePosX2 = this.posRight;
	this.mapOptions.gamePosY1 = this.posTop;
	this.mapOptions.gamePosY2 = this.posBottom;
	
	this.updateStateFromOptions();
}


uesp.gamemap.World.prototype.mergeMapOptions = function(mapOptions)
{
	this.mapOptions.mergeOptions(mapOptions);
	this.updateStateFromOptions();
}


uesp.gamemap.World.prototype.updateStateFromOptions = function()
{
	this.mapState.worldId = this.id;
	this.mapState.gamePos.x = this.mapOptions.initialGamePosX;
	this.mapState.gamePos.y = this.mapOptions.initialGamePosY;
	this.mapState.zoomLevel = this.mapOptions.initialZoom;
	
		/* Special case for ESO Tamriel Mundus map */
	if (this.id == 667) 
	{
		this.mapState.gamePos.y = 500000;
		this.mapState.zoomLevel = 9;
	}
}


uesp.gamemap.createWorldFromJson = function(data)
{
	var newWorld = new uesp.gamemap.World(data.name, null);
	
	newWorld.mergeFromJson(data);
	
	return newWorld;
}


uesp.gamemap.World.prototype.createSaveQuery = function()
{
	var query = 'action=set_world';
	
	query += '&worldid=' + this.id;
	query += '&parentid=' + this.parentId;
	query += '&revisionid=' + this.revisionId;
	query += '&name=' + encodeURIComponent(this.name);
	query += '&displayname=' + encodeURIComponent(this.displayName);
	query += '&description=' + encodeURIComponent(this.description);
	query += '&wikipage=' + encodeURIComponent(this.wikiPage);
	query += '&missingtile=' + encodeURIComponent(this.missingMapTile);
	query += '&minzoom=' + this.minZoom;
	query += '&maxzoom=' + this.maxZoom;
	query += '&posleft=' + this.posLeft;
	query += '&posright=' + this.posRight;
	query += '&postop=' + this.posTop;
	query += '&posbottom=' + this.posBottom;
	query += '&zoomoffset=' + this.zoomOffset;
	query += '&enabled=' + (this.enabled ? '1' : '0');
	query += '&db=' + this.mapOptions.dbPrefix;
	
	if (this.locType > 1)
	{
	}
	
	return query;
}

uesp.gamemap.Bounds = function(left, top, right, bottom)
{
	this.left   = (typeof left   === 'undefined' || left   === null) ? 0 : left;
	this.right  = (typeof right  === 'undefined' || right  === null) ? 0 : right;
	this.top    = (typeof top    === 'undefined' || top    === null) ? 0 : top;
	this.bottom = (typeof bottom === 'undefined' || bottom === null) ? 0 : bottom;
}