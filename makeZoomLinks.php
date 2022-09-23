<?php

if (php_sapi_name() != "cli") die("Can only be run from command line!");

require '/home/uesp/secrets/gamemap.secrets';


class CMakeMapZoomLinks 
{
	
	public $LINKS_PATH = "leaflet";
	
	public $deleteOldLinks = false;
	public $dryRun = false;
	public $dbPrefix = "";
	public $mapPath = "./";
	
	public $worlds = [];
	
	protected $db = null;
	
	
	public function __construct()
	{
		if (!$this->ParseCommandLineArgs()) die("Error: Failed to parse command line arguments!");
		$this->InitializeDatabase();
	}
	
	
	protected function ParseCommandLineArgs()
	{
		$options = getopt("t", ["deleteold", "dryrun", "dbprefix:", "path:"]);
		
		if ($options['deleteold'] === false) $this->deleteOldLinks = true;
		if ($options['t'] === false) $this->dryRun = true;
		if ($options['dryrun'] === false) $this->dryRun = true;
		
		if ($options['dbprefix'] != null) 
		{
			$this->dbPrefix = preg_replace("/[^A-Za-z0-9_]/", '', $options['dbprefix']);
			if ($this->dbPrefix != "") $this->dbPrefix = "_" + $this->dbPrefix;
		}
		
		if ($options['path'] != null) 
		{
			$this->mapPath = $options['path'];
		}
		
		if ($this->deleteOldLinks) print("\tDeleting old symbolic links.\n");
		if ($this->dryRun) print("\tPerforming dry-run.\n");
		
		print("\tUsing map path {$this->mapPath}\n");
		print("\tUsing database uesp_gamemap{$this->dbPrefix}\n");
		
		return true;
	}
	
	
	protected function InitializeDatabase()
	{
		global $uespGameMapReadDBHost;
		global $uespGameMapReadUser;
		global $uespGameMapReadPW;
		global $uespGameMapDatabase;
		
		$this->db = new mysqli($uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $uespGameMapDatabase);
		if ($this->db == null || $this->db->connect_error) die("Error: Could not connect to mysql database!");
	}
	
	
	protected function ReportError($msg)
	{
		print($msg . "\n");
		return false;
	}
	
	
	protected function LoadWorlds()
	{
		$result = $this->db->query("SELECT * FROM world;");
		if ($result === null) return false;
		
		$this->worlds = [];
		
		while ($row = $result->fetch_assoc())
		{
			$this->worlds[] = $row;
		}
		
		$count = count($this->worlds);
		print("\tLoaded $count worlds from map database uesp_gamemap{$this->dbPrefix}!\n");
		
		return true;
	}
	
	
	protected function MakeLinksForWorldDryRun($path, $world)
	{
		$linksPath = $path;
		if ($this->LINKS_PATH != "") $linksPath .= "/" . $this->LINKS_PATH;
		
		if (!file_exists($linksPath))
		{
			print("\tCreating directory '$linksPath'...\n");
		}
		
		$minZoom = intval($world['minZoom']);
		$maxZoom = intval($world['maxZoom']);
		$zoomLevels = $maxZoom - $minZoom;
		
		for ($i = 0; $i <= $zoomLevels; ++$i)
		{
			$zoom = $i + $minZoom;
			$target = "../zoom$zoom";
			$link = "$linksPath/zoom$i";
			
			print("\tCreating symbolic link '$link' to '$target'...\n");
		}
		
		return true;
	}
	
	
	protected function MakeLinksForWorld($path, $world)
	{
		if ($this->dryRun) return $this->MakeLinksForWorldDryRun($path, $world);
		
		$linksPath = $path;
		if ($this->LINKS_PATH != "") $linksPath .= "/" . $this->LINKS_PATH;
		
		if (!file_exists($linksPath))
		{
			if (!mkdir($linksPath, 0755, true)) return $this->ReportError("\tError: Failed to create directory '$linksPath'!"); 
		}
		
		$minZoom = intval($world['minZoom']);
		$maxZoom = intval($world['maxZoom']);
		$zoomLevels = $maxZoom - $minZoom;
		
		for ($i = 0; $i <= $zoomLevels; ++$i)
		{
			$zoom = $i + $minZoom;
			$target = "../zoom$zoom";
			$link = "$linksPath/zoom$i";
			
			if (file_exists($link))
			{
				if (!unlink($link)) print("\tError: Failed to delete symbolic link '$link'!\n");
			}
			
			if (!symlink($target, $link)) print("\tError: Failed to create symbolic link '$link' to '$target'!\n");
		}
		
		return true;
	}
	
	
	protected function MakeLinks()
	{
		foreach ($this->worlds as $world)
		{
			$path = $this->mapPath . $world['name'];
			
			if (!file_exists($path))
			{
				print("\tError: World path '$path' not found!\n");
				continue;
			}
			
			$this->MakeLinksForWorld($path, $world);
		}
		
		return true;
	}
	
	
	protected function DeleteOldLinksDryRun()
	{
		print("\tDeleting old links in all worlds...\n");
		
		foreach ($this->worlds as $world)
		{
			$path = $this->mapPath . $world['name'];
			
			$files = scandir($path);
			
			if ($files === false)
			{
				print("\tError: World path '$path' not found!\n");
				continue;
			}
			
			foreach ($files as $filename)
			{
				if (!preg_match("/zoom[0-9]+/", $filename)) continue;
				
				$filename = $path . "/" . $filename;
				//print("\t$filename\n");
				
				if (is_link($filename))
				{
					print("\tDeleting old link '$filename'...\n");
				}
			}
		}
		
		return true;
	}
	
	
	protected function DeleteOldLinks()
	{
		if ($this->dryRun) return $this->DeleteOldLinksDryRun();
		
		print("\tDeleting old links in all worlds...\n");
		
		foreach ($this->worlds as $world)
		{
			$path = $this->mapPath . $world['name'];
			
			$files = scandir($path);
			
			if ($files === false)
			{
				print("\tError: World path '$path' not found!\n");
				continue;
			}
			
			foreach ($files as $filename)
			{
				if (!preg_match("/zoom[0-9]+/", $filename)) continue;
				
				$filename = $path . "/" . $filename;
				//print("\t$filename\n");
				
				if (is_link($filename))
				{
					if (!unlink($filename)) 
						print("\tError: Failed to delete old link '$filename'...\n");
					else
						print("\tDeleted old link '$filename'...\n");
				}
			}
		}
		
		return true;
	}
	
	
	public function Run()
	{
		if (!$this->LoadWorlds()) die("Error: Failed to load world data!");
		
		if ($this->deleteOldLinks) return $this->DeleteOldLinks();
		
		return $this->MakeLinks();
	}
	
};

$makeLinks = new CMakeMapZoomLinks();
$makeLinks->Run();


