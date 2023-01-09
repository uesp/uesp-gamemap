<?php

if (php_sapi_name() != "cli") die("Can only be run from command line!");

require '/home/uesp/secrets/gamemap.secrets';


class CMakeTileSymLinks 
{
	public $deleteLinks = false;	// Only delete links if true
	
	public $REMOVE_ZOOM_LEVEL = true;
	public $ADD_EMPTY_TILES = true;
	
	static $BASE_PATH = '/mnt/uesp/maps';
	
	static $GAME_DATA = [
			/*
			'srmap/color' => [	// This doesn't move them to the correct folder currently (move by hand)
					'basePath' => 'srmap',
					'extraPath' => 'color',
					'prefix' => 'skyrim',
					'newPrefix' => 'skyrim',
			],
			'srmap/night' => [	// Move manually to correct folder afterwards
					'layer' => 'night',
					'extraPath' => 'night',
					'basePath' => 'srmap',
					'prefix' => 'skyrim',
					'newPrefix' => 'skyrim',
			],
			'mwmap' => [
					'prefix' => 'vvardenfell',
					'newPrefix' => 'morrowind',
			],*/
			'dbmap' => [
					'prefix' => 'db',
					'newPrefix' => 'solstheim',
					'minZoom' => 10,
			],/*
			'simap' => [
					'prefix' => 'seworld',
					'newPrefix' => 'shiveringisles',
			],
			'trmap' => [
					'prefix' => 'TR',
					'newPrefix' => 'tamrielrebuilt',
			],
			'obmap' => [
					'prefix' => 'tamriel',
					'newPrefix' => 'oblivion',
			],
			'bsmap' => [
					'prefix' => 'bs',
					'newPrefix' => 'skyrim',
			], */
			/*
			'trmap' => [
					'prefix' => 'TR',
					'newPrefix' => 'tamrielrebuilt',
					'emptyTile' => 'images/troutofrange.jpg',
			],*/ 
	];
	
	
	public function __construct()
	{
	}
	
	
	private function MakeLinksForEmptyTiles($basePath, $outputBasePath, $zoomPath, $zoomLevel, $newZoomPath, $gameData)
	{
		$tileSize = pow(2, intval($zoomLevel));
		$numTiles = $tileSize * $tileSize;
		$numMissingTiles = 0;
		
		print("\t\tZoom $zoomLevel: Checking $numTiles tiles for missing tiles...\n");
		
		$blankTile = $gameData['emptyTile'];
		
		if ($blankTile == null || $blankTile == '') 
		{
			print("\t\tError: Missing empty tile filename in game data!\n");
			return false;
		}
		
		$blankFilename = "../../../../$blankTile";
		
		for ($y = 0; $y < $tileSize; ++$y)
		{
			for ($x = 0; $x < $tileSize; ++$x)
			{
				$layer = 'default';
				if ($gameData['layer']) $layer = $gameData['layer'];
				
				$link = "$outputBasePath/{$gameData['newPrefix']}/leaflet/$layer/$newZoomPath/{$gameData['newPrefix']}-$x-$y.jpg";
				if (file_exists($link)) continue;
				
				//print("\t\t$link => $blankFilename\n");
				
				if (!symlink($blankFilename, $link)) print("\tError: Failed to create symbolic link '$link' to '$target'!\n");
				++$numMissingTiles;
			}
		}
		
		print("\t\tZoom $zoomLevel: Found $numMissingTiles missing tiles!\n");
	}
	
	
	// {tileURL}/{world}/leaflet/{layer}/{zoomLevel}/{world}-{tileX}-{tileY}.jpg
	// Existing File: /mnt/uesp/maps/srmap/zoom10/skyrim-1-0-10.jpg
	// New File:      /mnt/uesp/maps/srmap/skyrim/leaflet/default/zoom0/skyrim-1-0.jpg
	private function MakeLinksForPath($basePath, $outputBasePath, $zoomPath, $zoomLevel, $newZoomPath, $gameData)
	{
		$path = $basePath . '/' . $zoomPath;
		$fileSpec = $path . '/' . $gameData['prefix'] . '-*';
		//print("\tSearching for matching files in $fileSpec...\n");
		
		$files = glob($fileSpec);
		
		if ($files === false)
		{
			print("\tError: Map file specification '$fileSpec' not found!\n");
			return false;
		}
		
		$count = count($files);
		print("\t$path -- Found $count matching files!\n");
		
		$prefix = $gameData['prefix'];
		$newPrefix = $gameData['newPrefix'];
		
		foreach ($files as $file)
		{
			$target = $file;
			
			$file = str_replace($basePath, $outputBasePath, $file);
			
			if ($this->REMOVE_ZOOM_LEVEL)
			{
				$link = preg_replace("/\/$prefix(-[0-9]+-[0-9]+)-[0-9]+\./", '/' . $newPrefix . '$1.', $file);
				if ($link == $file) $link = preg_replace("/\/$prefix-/", '/' . $newPrefix . '-', $file);
			}
			else
			{
				$link = preg_replace("/\/$prefix-/", '/' . $newPrefix . '-', $file);
			}
			
			$layer = 'default';
			if ($gameData['layer']) $layer = $gameData['layer'];
			
			$link = preg_replace("/\/zoom[0-9]+\//", "/$newPrefix/leaflet/$layer/$newZoomPath/", $link);
			
			$extraPath = $gameData['extraPath'];
			
			if ($extraPath)
				$target = str_replace($basePath, "../../../../$extraPath", $target);
			else
				$target = str_replace($basePath, '../../../..', $target);
			
			//print("\t\t$target => $link\n");
			//continue;
			
			$dirname = pathinfo($link, PATHINFO_DIRNAME);
			
			if (!is_dir($dirname) && !mkdir($dirname, 0775, true)) 
			{
				print("\tError: Failed to create directory $dirname!\n");
				continue;
			}
			
			if (file_exists($link))
			{
				if (!unlink($link)) print("\tError: Failed to delete symbolic link '$link'!\n");
			}
			
			if ($this->deleteLinks) continue;
			
			if (!symlink($target, $link)) print("\tError: Failed to create symbolic link '$link' to '$target'!\n");
		}
		
		return true;
	}
	
	
	private function MakeLinksForGame($gamePath, $gameData)
	{
		$basePath = self::$BASE_PATH . '/' . $gamePath;
		$outputBasePath = $basePath;
		if ($gameData['basePath']) $outputBasePath = self::$BASE_PATH . '/' . $gameData['basePath'];
		
		$files = scandir($basePath);
		
		if ($files === false)
		{
			print("\tError: Map path '$basePath' not found!\n");
			return false;
		}
		
		$minZoomLevel = 17;
		
		foreach ($files as $filename)
		{
			if (!preg_match("/zoom([0-9]+)/", $filename, $matches)) continue;
			$zoomLevel = intval($matches[1]);
			if ($zoomLevel > 0 && $zoomLevel < $minZoomLevel) $minZoomLevel = $zoomLevel;
		}
		
		print("\tFound min zoom level of $minZoomLevel!\n");
		
		if ($gameData['minZoom'] != null)
		{
			$minZoomLevel = $gameData['minZoom'];
			print("\tUsing a manual min zoom level of $minZoomLevel!\n");
		}
		
		foreach ($files as $filename)
		{
			if (!preg_match("/zoom([0-9]+)/", $filename, $matches)) continue;
			
			$zoomLevel = intval($matches[1]);
			$newZoomLevel = $zoomLevel - $minZoomLevel;
			
			if ($newZoomLevel < 0)
			{
				print("\tError: New zoom level of $newZoomLevel is not valid ($filename, min zoom of $minZoomLevel)!\n");
				continue;
			}
			
			$newZoomPath = "zoom$newZoomLevel";
			$fullFilename = $basePath . "/" . $filename;
			
			if (!is_dir($fullFilename))
			{
				print("\tError: Map filename '$fullFilename' is not a directory!\n");
				return false;
			}
			
			$this->MakeLinksForPath($basePath, $outputBasePath, $filename, $newZoomLevel, $newZoomPath, $gameData);
			
			if ($this->ADD_EMPTY_TILES)
			{
				$this->MakeLinksForEmptyTiles($basePath, $outputBasePath, $filename, $newZoomLevel, $newZoomPath, $gameData);
			}
		}
		
		return true;
	}
	
	
	public function Run()
	{
		foreach (self::$GAME_DATA as $gamePath => $gameData)
		{
			$this->MakeLinksForGame($gamePath, $gameData);
		}
	}
	
};

$makeLinks = new CMakeTileSymLinks();
$makeLinks->Run();