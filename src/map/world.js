/**
 * @name world.js
 * @author Dave Humphrey <dave@uesp.net> (22nd Jan 2014)
 * @summary Contains class definition for gamemap's "world".
 */

import MapState from "./mapState.js";
import * as Utils from "../common/utils.js";

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

		this.missingMapTile = mapConfig.missingMapTilePath;
		this.minZoomLevel = mapConfig.minZoomLevel;
		this.maxZoomLevel = mapConfig.maxZoomLevel;
		this.zoomOffset = mapConfig.zoomOffset;

		this.minX = mapConfig.minX;
		this.maxX = mapConfig.maxX;
		this.minY = mapConfig.minY;
		this.maxY = mapConfig.maxY;
		
		this.enabled = true;
		
		this.mapState = new MapState();
		this.mapState.worldID = this.id;
		this.mapState.coords.x = mapConfig.xPos;
		this.mapState.coords.y = mapConfig.yPos;
		this.mapState.zoomLevel = mapConfig.zoomLevel;
		
		/* Special case for ESO Tamriel Aurbis map */
		if (worldID == 667) {
			this.mapState.zoomLevel = 9;
		}
	}

	updateWorldState() {
		this.mapState.worldId = this.id;
	
		this.mapConfig.minZoomLevel = this.minZoomLevel;
		this.mapConfig.maxZoomLevel = this.maxZoomLevel;
		this.mapConfig.zoomOffset   = this.zoomOffset;
		
		this.mapConfig.minX = this.minX;
		this.mapConfig.maxX = this.maxX;
		this.mapConfig.minY = this.minY;
		this.mapConfig.maxY = this.maxY;
	
		this.mapState.worldId = this.id;
		this.mapState.coords.x = this.mapConfig.xPos;
		this.mapState.coords.y = this.mapConfig.yPos;
		this.mapState.zoomLevel = this.mapConfig.zoomLevel;
		
		/* Special case for ESO Tamriel Aurbis map */
		if (this.id == 667) 
		{
			this.mapState.coords.y = 500000;
			this.mapState.zoomLevel = 9;
		}
	} 

	mergeMapConfig(mapConfig) {
		this.mapConfig = Utils.mergeObjects(this.mapConfig, mapConfig)
		this.updateWorldState();
	}

	createSaveQuery() {
		let query = 'action=set_world';
		
		query += '&worldid=' + this.id;
		query += '&parentid=' + this.parentID;
		query += '&revisionid=' + this.revisionID;
		query += '&name=' + encodeURIComponent(this.name);
		query += '&displayname=' + encodeURIComponent(this.displayName);
		query += '&description=' + encodeURIComponent(this.description);
		query += '&wikipage=' + encodeURIComponent(this.wikiPage);
		query += '&missingtile=' + encodeURIComponent(this.missingMapTile);
		query += '&minzoom=' + this.minZoomLevel;
		query += '&maxzoom=' + this.maxZoomLevel;
		query += '&posleft=' + this.minX;
		query += '&posright=' + this.maxX;
		query += '&postop=' + this.minY;
		query += '&posbottom=' + this.maxY;
		query += '&zoomoffset=' + this.zoomOffset;
		query += '&enabled=' + (this.enabled ? '1' : '0');
		query += '&db=' + this.mapConfig.database;
		
		return query;
	}

}