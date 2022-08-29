

window.ugmLimitCount = 200;


function ugmLoadOfflineLocation (self, queryParams, onLoadFunction, eventData) 
{
	var locationId = queryParams.locid;
	var action = queryParams.action;
	var showHidden = (queryParams.showhidden == 1);
	
	var jsonData = { 
		action: action,
	};
	
	uesp.gamemap.mergeObjects(jsonData, ugmFindOfflineLocationById(locationId, showHidden));
	
	self.onReceiveLocationData(jsonData);
	if ( !(onLoadFunction == null) ) onLoadFunction.call(self, eventData, jsonData);
	
	return true;
}


function ugmFindOfflineLocationsByBounds (worldId, top, bottom, left, right, zoom, showHidden)
{
	var jsonData = {
		locations: [],
		locationCount: 0,
	};
	
	if (g_UespOfflineMapData == null) return jsonData;
	
	if (top < bottom)
	{
		var tmp = top;
		top = bottom;
		bottom = tmp;
	}
	
	if (right < left)
	{
		var tmp = right;
		right = left;
		left = tmp;
	}
	
	for (var locId in g_UespOfflineMapData.locations)
	{
		var location = g_UespOfflineMapData.locations[locId];
		
		if (location.worldId != worldId) continue;
		if (location.displayLevel > zoom) continue;
		if (location.visible == 0 && !showHidden) continue;
		
		var isInBounds = (location.x >= left && location.x <= right && location.y >= bottom && location.y <= top) || 
						 (location.x + location.width >= left && location.x + location.width <= right && location.y - location.height >= bottom && location.y - location.height <= top);
		
		if (isInBounds) jsonData.locations.push(location);
	}
	
	jsonData.locationCount = jsonData.locations.length;
	return jsonData;
}


function ugmLoadOfflineLocations(self, queryParams)
{
	var action = queryParams.action;
	var showHidden = (queryParams.showhidden == 1);
	var worldId = queryParams.world;
	var top = queryParams.top;
	var bottom = queryParams.bottom;
	var left = queryParams.left;
	var right = queryParams.right;
	var zoom = queryParams.zoom;
	var includeWorld = (queryParams.incworld == 1);
	
	var jsonData = { 
		action: action,
	};
	
	uesp.gamemap.mergeObjects(jsonData, ugmFindOfflineLocationsByBounds(worldId, top, bottom, left, right, zoom, showHidden));
	
	if (includeWorld) uesp.gamemap.mergeObjects(jsonData, ugmFindOfflineWorldById(worldId, showHidden));
	
	self.onReceiveLocationData(jsonData);
	
	return true;
}


function ugmLoadOfflineCenterOnLocation (self, queryParams)
{
	var locationName = queryParams.centeron;
	var world = queryParams.world;
	var action = queryParams.action;
	var showHidden = (queryParams.showhidden == 1);
	var locations = [];
		
	var jsonData = { 
		action: action,
	};
	
	uesp.gamemap.mergeObjects(jsonData, ugmFindMatchingOfflineLocations(locationName, world, showHidden));
	
	self.onReceiveCenterOnLocationData(jsonData);
	
	return true;
}


function ugmFindOfflineLocationById (locationId, showHidden)
{
	var jsonData = {
		locations: [],
		locationCount: 0,
	};
	
	if (g_UespOfflineMapData == null) return jsonData;
	
	var location = g_UespOfflineMapData.locations[locationId];
	if (location == null) return jsonData;
	
	if (!showHidden && location.visible == 0) return jsonData;
	
	jsonData.locations.push(location);
	jsonData.locationCount = 1;
	
	return jsonData
}


function ugmFindOfflineLocationByName (locationName, showHidden)
{
	var jsonData = {
		locations: [],
		locationCount: 0,
	};
	
	if (g_UespOfflineMapData == null) return jsonData;
	locationName = locationName.toLowerCase();
	
	for (var locId in g_UespOfflineMapData.locations)
	{
		var location = g_UespOfflineMapData.locations[locId];
		if (location.visible == 0 && !showHidden) continue;
		if (location.name.toLowerCase() == locationName) jsonData.locations.push(location);
	}
	
	jsonData.locationCount = jsonData.locations.length;
	return jsonData;
}


function ugmFindOfflineWorldById (worldId, showHidden)
{
	var jsonData = {
		worlds: [],
		worldCount: 0,
	};
	
	if (g_UespOfflineMapData == null) return jsonData;
	
	var world = g_UespOfflineMapData.worlds[worldId];
	if (world == null) return jsonData;
	
	if (!showHidden && world.enabled == 0) return jsonData;
	
	jsonData.worlds.push(world);
	jsonData.worldCount = 1;
	
	return jsonData
}


function ugmFindOfflineWorldsByText (searchText, showHidden)
{
	var jsonData = {
		worlds: [],
		worldCount: 0,
	};
	
	if (g_UespOfflineMapData == null) return jsonData;
	
	searchText = searchText.toLowerCase();
	
	for (var worldId in g_UespOfflineMapData.worlds)
	{
		var world = g_UespOfflineMapData.worlds[worldId];
		
		if (world.enabled == 0 && !showHidden) continue;
		
		if (searchText == "" || world.name.toLowerCase().indexOf(searchText) != -1 || 
				world.displayName.toLowerCase().indexOf(searchText) != -1 ||
				world.description.toLowerCase().indexOf(searchText) != -1 ||
				world.wikiPage.toLowerCase().indexOf(searchText) != -1)
		{
			jsonData.worlds.push(world);
			jsonData.worldCount++;
		}
	}
	
	return jsonData;		
}


function ugmFindOfflineLocationsByText (searchText, worldId, searchType, showHidden)
{
	var jsonData = {
		locations: [],
		locationCount: 0,
	};
	
	if (g_UespOfflineMapData == null) return jsonData;
	
	searchText = searchText.toLowerCase();
	
	for (var locId in g_UespOfflineMapData.locations)
	{
		var location = g_UespOfflineMapData.locations[locId];
		
		if (location.visible == 0 && !showHidden) continue;
		if (worldId != null && worldId != location.worldId) continue;
		
		if (searchType != null)
		{
			if (location.iconType == searchType)
			{
				jsonData.locations.push(world);
				jsonData.locationCount++;		
			}
			continue;
		}
		
		if (searchText == "" || location.name.toLowerCase().indexOf(searchText) != -1 || 
				location.description.toLowerCase().indexOf(searchText) != -1 ||
				location.wikiPage.toLowerCase().indexOf(searchText) != -1)
		{
			jsonData.locations.push(location);
			jsonData.locationCount++;
		}
	}
	
	return jsonData;		
}


function ugmFindMatchingOfflineLocations (locationName, worldId, showHidden)
{
	var jsonData = {
		locations: [],
		locationCount: 0,
		worlds: [],
		worldCount: 0,
		worldId: worldId,
		locationId: -1,
	};
		
	if (g_UespOfflineMapData == null) return jsonData;
	
	if (isNAN(locationName))
	{
		uesp.gamemap.mergeObjects(jsonData, ugmFindOfflineLocationByName(locationName, showHidden));
	}
	else
	{
		uesp.gamemap.mergeObjects(jsonData, ugmFindOfflineLocationById(locationName, showHidden));
	}
	
	if (jsonData.locations[0] == null) return jsonData;
	
	jsonData.locationId = jsonData.locations[0].id;
	jsonData.worldId = jsonData.locations[0].worldId;
	
	uesp.gamemap.mergeObjects(jsonData, ugmFindOfflineWorldById(jsonData.worldId, ));
	
	return jsonData;
}


function ugmLoadOfflineWorlds (self, queryParams)
{
	var action = queryParams.action;
	var showHidden = (queryParams.showhidden == 1);
	
	var jsonData = { 
		action: action,
		worlds: [],
		worldCount: 0
	};
	
	if (g_UespOfflineMapData == null) return jsonData;
	
	for (var worldId in g_UespOfflineMapData.worlds)
	{
		var world = g_UespOfflineMapData.worlds[worldId];
		
		if (world.enabled == 0 && !showHidden) continue;
		
		jsonData.worlds.push(world);
		jsonData.worldCount++;
	}
	
	self.onReceiveWorldData(jsonData);
	
	return true;
}


function ugmSearchOfflineLocations (self, queryParams)
{
	var action = queryParams.action;
	var searchText = decodeURIComponent(queryParams.search);
	var showHidden = (queryParams.showhidden == 1);
	var worldId = queryParams.world;
	var searchType = queryParams.searchtype;
	
	var jsonData = { 
		action: action,
		locations: [],
		locationCount: 0,
		worlds: [],
		worldCount: 0
	};
	
	uesp.gamemap.mergeObjects(jsonData, ugmFindOfflineLocationsByText(searchText, worldId, searchType, showHidden));
	if (worldId == null) uesp.gamemap.mergeObjects(jsonData, ugmFindOfflineWorldsByText(searchText, showHidden));
	
	self.onReceiveSearchResults(jsonData); 
	
	return true;
}