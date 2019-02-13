<?php

$INPUT_HTML_FILENAME = "esomap.html";
$OUTPUT_HTML_FILENAME = "offlineMap.html";

$OFFLINE_JAVASCRIPT = <<<EOL
<script type="text/javascript" src="offlineMaps.js"></script>
	<script type="text/javascript" src="offlineMap.js"></script>
EOL;

$OFFLINE_OPTIONS = <<<EOL
isOffline: true,
				useFakeMaxZoom: true,
EOL;

if (php_sapi_name() != "cli") die("Can only be run from command line!");

$inputHtml = file_get_contents($INPUT_HTML_FILENAME);
$helpBlock = file_get_contents("./template/helpblock.txt");
$groupList = file_get_contents("./template/worldgrouplist.txt");

if ($inputHtml === false) die("Failed to read input HTML file!");
if ($helpBlock === false) die("Failed to read help block file!");
if ($groupList === false) die("Failed to read world group list file!");

$helpBlock = "<div class=\"gmHelpBlock\" style=\"display: none;\">\n" . $helpBlock . "\n</div>\n";

$outputHtml = $inputHtml;

$outputHtml = replaceCommentBlock($outputHtml, "<!--OFFLINE_JAVASCRIPT-->", $OFFLINE_JAVASCRIPT);
$outputHtml = replaceCommentBlock($outputHtml, "<!--OFFLINE_OPTIONS-->", $OFFLINE_OPTIONS);
$outputHtml = replaceCommentBlock($outputHtml, "<!--OFFLINE_HELPBLOCK-->", $helpBlock);
$outputHtml = replaceCommentBlock($outputHtml, "<!--OFFLINE_GROUPLIST-->", $groupList);

$result = file_put_contents($OUTPUT_HTML_FILENAME, $outputHtml);
if ($result === false) die("Failed to write output HTML file!");

print("Successfully output HTML file '$OUTPUT_HTML_FILENAME'!\n");


function replaceCommentBlock($input, $search, $replace)
{
	$count = 0;
	
	$output = str_replace($search, $replace, $input, $count);
	
	if ($count != 1)
	{
		print("Failed to find/replace '$search' in input HTML!\n");
	}
	
	return $output;
}