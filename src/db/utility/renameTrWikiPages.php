<?php

if (php_sapi_name() != "cli") die("Can only be run from command line!");

print("Updating Tamriel Rebuilt map locations with new wikiPage roots...\n");

require '/home/uesp/secrets/gamemap.secrets';
require '/home/uesp/secrets/tamrielrebuilt.secrets';

$db = new mysqli($uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $uespGameMapDatabase."_tr");
if ($db == null || $db->connect_error) die("Could not connect to mysql database!");

$result = $db->query("SELECT * FROM location WHERE wikiPage !='';");
if ($result === false) die("Failed to load locations!");

$updateCount = 0;

while ($row = $result->fetch_assoc())
{
	$wikiPage = $row['wikiPage'];
	
	if (strpos($wikiPage, 'Tes3Mod:Tamriel Rebuilt/') === false) continue;
	
	$newWikiPage = str_replace('Tes3Mod:Tamriel Rebuilt/', 'Tamriel Rebuilt:', $wikiPage);
	
	$id = $row['id'];
	$safePage = $db->real_escape_string($newWikiPage);
	$writeResult = $db->query("UPDATE location SET wikiPage='$safePage' where id='$id';");
	if ($writeResult === false) print("\t$id: Error updating wiki page!\n");
	
	//print("\tReplaced: $wikiPage with $newWikiPage\n");
	++$updateCount;
}

print("Updated $updateCount records!\n");

