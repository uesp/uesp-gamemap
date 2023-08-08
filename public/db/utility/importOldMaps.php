<?php

$INPUT_DATABASE = "tamrielrebuilt";
$OUTPUT_DATABASE = "uesp_gamemap_tr";

$WORLD_NAME = "Tamriel Rebuilt";
$MIN_ZOOM = 10;
$MAX_ZOOM = 17;
$ZOOM_OFFSET = 9;
$CELL_SIZE = 4096;
$POS_LEFT = -43 * 4096;
$POS_TOP = 32 * 4096;
$POS_RIGHT = 50 * 4096;
$POS_BOTTOM = -60 * 4096;

if (php_sapi_name() != "cli") die("Can only be run from command line!");

require '/home/uesp/secrets/gamemap.secrets';

$db = new mysqli($uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $OUTPUT_DATABASE);
if ($db == null || $db->connect_error) die("Could not connect to mysql database!");

$query = "SELECT * FROM $INPUT_DATABASE.mapdata";
$result = $db->query($query);
if (!$result) die("Failed to load map data!\n" . $db->error);

$mapData = array();

while ($row = $result->fetch_assoc())
{
	$mapData[] = $row;
}

$count = count($mapData); 
print("Loaded $count rows of map data!\n");

$result = $db->query("CREATE TABLE IF NOT EXISTS world LIKE uesp_gamemap.world;");
if (!$result) die("Failed to create world table!\n" . $db->error);
$result = $db->query("CREATE TABLE IF NOT EXISTS world_history LIKE uesp_gamemap.world_history;");
if (!$result) die("Failed to create world_history table!\n" . $db->error);
$result = $db->query("CREATE TABLE IF NOT EXISTS location LIKE uesp_gamemap.location;");
if (!$result) die("Failed to create location table!\n" . $db->error);
$result = $db->query("CREATE TABLE IF NOT EXISTS location_history LIKE uesp_gamemap.location_history;");
if (!$result) die("Failed to create location_history table!\n" . $db->error);
$result = $db->query("CREATE TABLE IF NOT EXISTS revision LIKE uesp_gamemap.revision;");
if (!$result) die("Failed to create revision table!\n" . $db->error);
print("Created tables...\n");

$worldData = array(
		"id" => 1,
		"parentId" => -1,
		"revisionId" => -1,
		"name" => $WORLD_NAME,
		"displayName" => $WORLD_NAME,
		"cellSize" => $CELL_SIZE,
		"minZoom" => $MIN_ZOOM,
		"maxZoom" => $MAX_ZOOM,
		"zoomOffset" => $ZOOM_OFFSET,
		"posLeft" => $POS_LEFT,
		"posRight" => $POS_RIGHT,
		"posTop" => $POS_TOP,
		"posBottom" => $POS_BOTTOM,
		"enabled" => 1,
);

$columns = implode(",", array_keys($worldData));
$values = "'" . implode("','", $worldData) . "'";

$query = "INSERT IGNORE INTO world($columns) VALUES($values);";
$result = $db->query($query);
if (!$result) die("Failed to create new world!\n" . $db->error);

//$query = "TRUNCATE TABLE location;";
//$result = $db->query($query);
//if (!$result) die("Failed to empty location data!\n" . $db->error);


foreach ($mapData as $i => $data)
{
	$descriptions = array();
	if ($data['SearchTags'] != "") $descriptions[] = "{$data['SearchTags']}";
	if ($data['EditorID'] != "") $descriptions[] = "editorID={$data['EditorID']}";
	if ($data['FormID'] != "") $descriptions[] = "formID={$data['FormID']}";
	
	if ($WORLD_NAME == "Tamriel Rebuilt" && $data['Namespace'] != "")
	{
		if ($data["Wikipage"] != "") $data["WikiPage"] = $data["Namespace"] . ":" . $data["Wikipage"];
		//print("\t" . $data["WikiPage"] . "\n");
	}
	else if ($data['Namespace'] != "" && $data['Namespace'] != "Skyrim") 
		$descriptions[] = "{$data['Namespace']}";
	
	if ($data['WorldSpace'] != "" && $data['WorldSpace'] != "Skyrim") $descriptions[] = "{$data['WorldSpace']}";
	if ($data['Region'] != "") $descriptions[] = "{$data['Region']}";
	if ($data['ObLocZ'] != "") $descriptions[] = "z={$data['ObLocZ']}";
	if ($data['DestFormID'] > 0) $descriptions[] = "destFormID={$data['DestFormID']}";
	$desc = implode(", ", $descriptions);

	$labelPos = 5;
	
	switch ($data['LabelPosition'])
	{
		case 0: $labelPos = 0; break;
		case 1: $labelPos = 3; break;
		case 2: $labelPos = 2; break;
		case 3: $labelPos = 1; break;
		case 4: $labelPos = 4; break;
		case 5: $labelPos = 7; break;
		case 6: $labelPos = 8; break;
		case 7: $labelPos = 9; break;
		case 8: $labelPos = 6; break;
		case 9: $labelPos = 5; break;
	}
	
	$displayData = '{"labelPos":'. $labelPos .',"points":[' . $data['ObLocX'] . ','. $data['ObLocY'] .']}';
	
	$locData = array(
			"id" => $data['id'],
			"worldId" => 1,
			"revisionId" => -1,
			"destinationId" => 0,
			"locType" => 1,
			"x" => $data['ObLocX'],
			"y" => $data['ObLocY'],
			"width" => 0,
			"height" => 0,
			"name" => $db->real_escape_string($data['Name']),
			"description" => $db->real_escape_string($desc),
			"iconType" => $data['MarkerType'],
			"displayData" => $db->real_escape_string($displayData),
			"wikiPage" => $db->real_escape_string($data["WikiPage"]),
			"displayLevel" => $data["DisplayLevel"],
			"visible" => $data["Enable"],
	);

	$columns = implode(",", array_keys($locData));
	$values = "'" . implode("','", $locData) . "'";
	
	$query = "INSERT IGNORE INTO location($columns) VALUES($values);";
	$result = $db->query($query);
	if (!$result) die("Failed to create new location #{$data['id']}!\n" . $db->error);
}
