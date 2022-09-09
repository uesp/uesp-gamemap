<?php

$OUTPUT_JSON_FILENAME = "offlineMaps.js";

if (php_sapi_name() != "cli") die("Can only be run from command line!");

require '/home/uesp/secrets/gamemap.secrets';

$db = new mysqli($uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $uespGameMapDatabase);
if ($db == null || $db->connect_error) die("Could not connect to mysql database!");

$worlds = array();
$locations = array();

$result = $db->query("SELECT * FROM world;");

while (($row = $result->fetch_assoc()))
{
	settype($row['id'], "integer");
	settype($row['parentId'], "integer");
	settype($row['revisionId'], "integer");
	settype($row['enabled'], "integer");
	settype($row['posRight'], "integer");
	settype($row['posLeft'], "integer");
	settype($row['posTop'], "integer");
	settype($row['posBottom'], "integer");
	settype($row['cellSize'], "integer");
	settype($row['minZoom'], "integer");
	settype($row['maxZoom'], "integer");
	settype($row['zoomOffset'], "integer");
	
	$id = $row['id'];
			
	$worlds[$id] = $row;
}

$result = $db->query("SELECT * FROM location;");

while (($row = $result->fetch_assoc()))
{
	settype($row['id'], "integer");
	settype($row['worldId'], "integer");
	settype($row['revisionId'], "integer");
	settype($row['destinationId'], "integer");
	settype($row['locType'], "integer");
	settype($row['iconType'], "integer");
	settype($row['x'], "integer");
	settype($row['y'], "integer");
	settype($row['width'], "integer");
	settype($row['height'], "integer");
	settype($row['displayLevel'], "integer");
	settype($row['visible'], "integer");
			
	$id = $row['id'];
	$locations[$id] = $row;
}


$data = array(
		"worlds" => $worlds,
		"locations" => $locations,
);

$jsonData = "window.g_UespOfflineMapData = " . json_encode($data) . ";";

$result = file_put_contents($OUTPUT_JSON_FILENAME, $jsonData);
$filesize = filesize($OUTPUT_JSON_FILENAME);

$worldCount = count($worlds);
$locCount = count($locations);
$filesize = filesize($OUTPUT_JSON_FILENAME) / 1000000;

if ($result) 
	print("Wrote $worldCount worlds and $locCount locations to file '$OUTPUT_JSON_FILENAME' in $filesize MB!\n");
else
	print("ERROR: Failed to output file '$OUTPUT_JSON_FILENAME'!\n");