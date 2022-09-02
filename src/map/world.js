/**
 * @name world.js
 * @author Dave Humphrey <dave@uesp.net> (22nd Jan 2014)
 * @summary Contains class definition for gamemap's "world".
 */

export default class World {
	constructor(worldName, mapConfig, worldID) {
		this.name = worldName.toLowerCase();
		this.displayName = worldName;
		
		this.mapConfig = mapConfig;
		
		this.id = (worldID == null) ? 0 : worldID;
		this.parentID = -1;
		this.revisionID = 0;
		this.description = '';
		this.wikiPage = '';
		this.cellSize = -1;

		this.missingMapTile = mapConfig.missingMapTile;
		this.minZoomLevel = mapConfig.minZoomLevel;
		this.maxZoomLevel = mapConfig.maxZoomLevel;
		this.zoomOffset = mapOptions.zoomOffset;

		this.minX = mapConfig.minX;
		this.maxX = mapConfig.maxX;
		this.minY = mapConfig.minY;
		this.maxY = mapConfig.maxY;
		
		this.enabled = true;
		
		this.mapState = new MapState();
		this.mapState.worldID = this.id;
		this.mapState.gamePos.x = this.mapOptions.initialGamePosX;
		this.mapState.gamePos.y = this.mapOptions.initialGamePosY;
		this.mapState.zoomLevel = this.mapOptions.initialZoom;
		
		/* Special case for ESO Tamriel Aurbis map */
		if (worldID == 667) 
		{
			this.mapState.zoomLevel = 9;
		}
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
	
	/* Special case for ESO Tamriel Aurbis map */
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
	query += '&parentid=' + this.parentID;
	query += '&revisionid=' + this.revisionID;
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
	
	return query;
}