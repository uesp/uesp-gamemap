<?php

if (php_sapi_name() != "cli") die("Can only be run from command line!");

require '/home/uesp/secrets/gamemap.secrets';



class CUpdateEsoDevLayers
{
	public $MAPS = [
			"angofschambers" => "cathbedraud",
			"banditden1" => "banditden1_main",
			"banditden11" => "banditden11r1",
			"u38_telvannipeninsulatd01" => "u38_telvannipeninsula",
			//"theashenmines" =>
			//"blackvineruinsl" => "",
			//"" => "",
	];
	
	public $BASE_MAP_PATH = "/mnt/uesp/maps/esomap/";
	
	public function __construct()
	{
		$this->InitializeDatabase();
	}
	
	
	protected function InitializeDatabase()
	{
		global $uespGameMapWriteDBHost;
		global $uespGameMapWriteUser;
		global $uespGameMapWritePW;
		global $uespGameMapDatabase;
		
		$this->db = new mysqli($uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $uespGameMapDatabase);
		if ($this->db == null || $this->db->connect_error) die("Error: Could not connect to mysql database!");
	}
	
	
	protected function ReportError($msg)
	{
		print($msg . "\n");
		if ($this->db && $this->db->error) print("\tDB Error: {$this->db->error} \n");
		return false;
	}
	
	
	protected function LoadMap($mapName)
	{
		$safeName = $this->db->real_escape_string($mapName);
		$query = "SELECT * FROM world WHERE name='$safeName';";
		$result = $this->db->query($query);
		if ($result === false) return $this->ReportError("Error: Failed to load map '$mapName'!");
		
		$map = $result->fetch_assoc();
		if ($map == null) return false;
		
		return $map;
	}
	
	
	protected function HasDisplayLayer($displayData, $layerName)
	{
		if ($displayData['layers'] == null) return false;
		
		foreach ($displayData['layers'] as $i => $layer)
		{
			$name = $layer['name'];
			if ($name == $layerName) return true;
		}
		
		return false;
	}
	
	
	protected function CopyZoomLayer($source, $target, $zoom)
	{
		$sourcePath = $this->BASE_MAP_PATH . "$source/leaflet/default/zoom$zoom/";
		$targetPath = $this->BASE_MAP_PATH . "$target/leaflet/beta/zoom$zoom/";
		
		if (!file_exists($targetPath))
		{
			if (!mkdir($targetPath, 0755, true)) return $this->ReportError("\tError: Failed to create directory '$targetPath'!"); 
		}
		
		$dir = new DirectoryIterator($sourcePath);
		
		foreach ($dir as $fileinfo)
		{
			if ($fileinfo->isDot()) continue;
			
			$sourceFile = $sourcePath . $fileinfo->getFilename();
			$targetFile = $targetPath . $fileinfo->getFilename();
			$targetFile = str_replace("$source-", "$target-", $targetFile);
			
			if (!copy($sourceFile, $targetFile))
			{
				$this->ReportError("\tError: Failed to copy '$sourceFile' to '$targetFile'!");
			}
		}
		
		return true;
	}
	
	
	protected function UpdateMapLayers($source, $target)
	{
		print("Addding map beta layer in $source to $target...\n");
		
		$sourceMap = $this->LoadMap($source);
		$targetMap = $this->LoadMap($target);
		
		if (!$sourceMap) return $this->ReportError("Error: Failed to load the source map '$source'!");
		if (!$targetMap) return $this->ReportError("Error: Failed to load the target map '$target'!");
		
		if ($sourceMap['maxTilesX'] != $targetMap['maxTilesX']) return $this->ReportError("Error: Source and target maps have different widths ({$sourceMap['maxTilesX']} <> {$targetMap['maxTilesX']})!");
		if ($sourceMap['maxTilesY'] != $targetMap['maxTilesY']) return $this->ReportError("Error: Source and target maps have different heights ({$sourceMap['maxTilesY']} <> {$targetMap['maxTilesY']})!");
		
		$maxZoom = intval($targetMap['maxZoom']) - intval($targetMap['minZoom']);
		
		for ($zoom = 0; $zoom <= $maxZoom; ++$zoom)
		{
			$this->CopyZoomLayer($source, $target, $zoom);
		}
		
		$displayData = json_decode($targetMap['displayData'], true);
		
		if (!$this->HasDisplayLayer($displayData, 'beta'))
		{
			$displayData['layers'][] = [ 'name' => 'beta' ];
			$jsonData = json_encode($displayData);
			
			$safeName = $this->db->real_escape_string($target);
			$safeData = $this->db->real_escape_string($jsonData);
			
			$query = "UPDATE world SET displayData='$safeData' WHERE name='$safeName';";
			$result = $this->db->query($query);
			
			if (!$result) return $this->ReportError("Error: Failed to update displayData of world $target!");
		}
		
		return true;
	}
	
	
	public function Run()
	{
		foreach ($this->MAPS as $source => $target)
		{
			$this->UpdateMapLayers($source, $target);
		}
	}
};


$update = new CUpdateEsoDevLayers();
$update->Run();