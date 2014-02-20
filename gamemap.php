<?php 
/*
 * gamemap.php -- Created by Dave Humphrey (dave@uesp.net) on 23 Jan 2014
 * 		Released under the GPL v2
 *		Main server side application for the game map system.
 *
 */


require '/home/uesp/secrets/gamemap.secrets';


class GameMap
{
	
	const LOCTYPE_NONE  = 0;
	const LOCTYPE_POINT = 1;
	const LOCTYPE_PATH  = 2;
	const LOCTYPE_AREA  = 3;
	
	public $inputParams = array();
	
	public $action = 'default';
	public $worldId = 0;
	public $locationId = 0;
	
	public $limitBottom = 0;
	public $limitTop    = 1000;
	public $limitLeft   = 0;
	public $limitRight  = 1000;
	public $limitDisplayLevel = 100;
	public $includeWorld = 0;
	
	public $outputItems = array();
	
	public $limitCount = 100;
	
	private $db = null;
	private $skipCheckTables = true;
	
	
	function __construct ()
	{
		$this->setInputParams();
		$this->parseInputParams();
	}
	
	
	public function addOutputItem ($key, $value)
	{
		$this->outputItems[$key] = $value;
	}
	
	
	private function checkTables()
	{
		$result = mysql_query('select 1 from `world`;');
		
		if ($result === FALSE)
		{
			return $this->createTables();
		}
		
		return true;
	}
	
	
	private function createTables()
	{
		$query = "CREATE TABLE IF NOT EXISTS `world` (
					`id` BIGINT NOT NULL AUTO_INCREMENT,
					`name` TINYTEXT NOT NULL,
					`displayName` TINYTEXT NOT NULL,
					`description` TEXT NOT NULL,
					`wikiPage` TEXT NOT NULL,
					`cellSize` INTEGER NOT NULL,
					`minZoom` INTEGER NOT NULL,
					`maxZoom` INTEGER NOT NULL,
					`posLeft` INTEGER NOT NULL,
					`posTop` INTEGER NOT NULL,
					`posRight` INTEGER NOT NULL,
					`posBottom` INTEGER NOT NULL,
					`enabled` TINYINT NOT NULL,
					PRIMARY KEY ( id )
				);";
		
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to create world table!");
		
		$query = "CREATE TABLE IF NOT EXISTS location (
					id BIGINT NOT NULL AUTO_INCREMENT,
					worldId BIGINT NOT NULL,
					revisionId BIGINT NOT NULL,
					destinationId BIGINT NOT NULL,
					locType TINYINT NOT NULL,
					displayData TEXT NOT NULL,
					x INTEGER NOT NULL,
					y INTEGER NOT NULL,
					width INTEGER NOT NULL,
					height INTEGER NOT NULL,
					name TINYTEXT NOT NULL,
					description TEXT NOT NULL,
					wikiPage TEXT NOT NULL,
					displayLevel INTEGER NOT NULL,
					visible TINYINT NOT NULL,
					PRIMARY KEY ( id )
				);";
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to create location table!");
		
		return true;
	}
	
	
	public function doAction ($action = null)
	{
		if ($action == null) $action = $this->action;
		$this->addOutputItem("action", $action);
		
		switch ($action)
		{
			case 'create_tables':
				return $this->doCreateTables();
			case 'get_worlds':
				return $this->doGetWorlds();
			case 'get_locs':
				return $this->doGetLocations();
			case 'get_loc':
					return $this->doGetLocation();
			case 'default':
			default:
				break;
		}
		
		$this->reportError("Unknown action '". $action ."' received!");
		return false;
	}
	
	
	public function doCreateTables ()
	{
		$result = $this->initDatabase();
		if (!$result) return false;
		
		$result = $this->createTables();
		if (!$result) return false;
		
		$this->addOutputItem("result", "Successfully created tables!");
		return true;
	}
	
	
	public function doGetLocations ()
	{
		if ($this->worldId <= 0) return $this->reportError("No world specified to retrieve locations for!");
		if (!$this->initDatabase()) return false;
		
		$query  = "SELECT * from location WHERE visible <> 0 AND worldId=".$this->worldId." ";
		$query .= "AND x >= " . $this->limitLeft ." AND x <= ". $this->limitRight ." AND y >= ". $this->limitBottom ." AND y <= ". $this->limitTop ." ";
		$query .= " AND displayLevel <= ". $this->limitDisplayLevel ." ";
		$query .= " LIMIT ".$this->limitCount.";";
		
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve location data!" . $result);
		
		$locations = Array();
		$count = 0;
		
		while ( ($row = mysql_fetch_assoc($result)) )
		{
			settype($row['id'], "integer");
			settype($row['worldId'], "integer");
			settype($row['revisionId'], "integer");
			settype($row['destinationId'], "integer");
			settype($row['locType'], "integer");
			settype($row['x'], "integer");
			settype($row['y'], "integer");
			settype($row['width'], "integer");
			settype($row['height'], "integer");
			settype($row['displayLevel'], "integer");
			settype($row['visible'], "integer");
			
			$locations[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("locations", $locations);
		$this->addOutputItem("locationCount", $count);
		
		if ($this->includeWorld != 0) return $this->doGetWorld($this->worldId);
		return true;
	}
	
	
	public function doGetLocation ()
	{
		if ($this->locationId === 0) return $this->reportError("No location specified to retrieve data for!");
		if (!$this->initDatabase()) return false;
	
		$query  = "SELECT * from location WHERE visible <> 0 AND id=".$this->locationId." ";
		$query .= " LIMIT 1";
	
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve location data!" . $result);
	
		$locations = Array();
		$count = 0;
	
		while ( ($row = mysql_fetch_assoc($result)) )
		{
			settype($row['id'], "integer");
			settype($row['worldId'], "integer");
			settype($row['destinationId'], "integer");
			settype($row['revisionId'], "integer");
			settype($row['locType'], "integer");
			settype($row['x'], "integer");
			settype($row['y'], "integer");
			settype($row['width'], "integer");
			settype($row['height'], "integer");
			settype($row['displayLevel'], "integer");
			settype($row['visible'], "integer");
				
			$locations[] = $row;
			$count += 1;
			break;
		}
	
		$this->addOutputItem("locations", $locations);
		$this->addOutputItem("locationCount", $count);
		return true;
	}
	
	
	public function doGetWorld ($worldId)
	{
		if (!$this->initDatabase()) return false;
	
		$query = "SELECT * from world WHERE enabled <> 0 AND id=". $worldId .";";
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve world data!" . $result);
	
		$worlds = Array();
		$count = 0;
	
		while ( ($row = mysql_fetch_assoc($result)) )
		{
			settype($row['enabled'], "integer");
			settype($row['posRight'], "integer");
			settype($row['posLeft'], "integer");
			settype($row['posTop'], "integer");
			settype($row['posBottom'], "integer");
			settype($row['cellSize'], "integer");
			settype($row['minZoom'], "integer");
			settype($row['maxZoom'], "integer");
				
			$worlds[] = $row;
			$count += 1;
		}
	
		$this->addOutputItem("worlds", $worlds);
		$this->addOutputItem("worldCount", $count);
		return true;
	}
	
	
	public function doGetWorlds ()
	{
		if (!$this->initDatabase()) return false;
		
		$query = "SELECT * from world WHERE enabled <> 0;";
		$result = mysql_query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve world data!" . $result);
		
		$worlds = Array();
		$count = 0;
		
		while ( ($row = mysql_fetch_assoc($result)) )
		{
			settype($row['enabled'], "integer");
			settype($row['posRight'], "integer");
			settype($row['posLeft'], "integer");
			settype($row['posTop'], "integer");
			settype($row['posBottom'], "integer");
			settype($row['cellSize'], "integer");
			settype($row['minZoom'], "integer");
			settype($row['maxZoom'], "integer");
			
			$worlds[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("worlds", $worlds);
		$this->addOutputItem("worldCount", $count);
		return true;
	}
	
	
	private function initDatabase ()
	{
		global $uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $uespGameMapDatabase;
		
		$this->db = mysql_connect($uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW);
		if (!$this->db) return $this->reportError("Could not connect to mysql database!");
		
		if (!mysql_select_db($uespGameMapDatabase, $this->db)) return $this->reportError("Game map database '".$uespGameMapDatabase."'. not found!");
		
		if ($this->skipCheckTables) return true;
		return $this->checkTables();
	}
	
	
	private function initDatabaseWrite ()
	{
		global $uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $uespGameMapDatabase;
		
		$this->db = mysql_connect($uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW);
		if (!$this->db) return $this->reportError("Could not connect to mysql database!");
		
		if (!mysql_select_db($uespGameMapDatabase, $this->db)) return $this->reportError("Game map database '".$uespGameMapDatabase."'. not found!");
		
		if ($this->skipCheckTables) return true;
		return $this->checkTables();
	}
	
	
	private function parseInputParams ()
	{
		if (array_key_exists('action', $this->inputParams)) $this->action = mysql_real_escape_string(strtolower($this->inputParams['action']));
		if (array_key_exists('world',  $this->inputParams)) $this->worldId  = intval(mysql_real_escape_string($this->inputParams['world']));
		if (array_key_exists('top',    $this->inputParams)) $this->limitTop    = intval(mysql_real_escape_string($this->inputParams['top']));
		if (array_key_exists('left',   $this->inputParams)) $this->limitLeft   = intval(mysql_real_escape_string($this->inputParams['left']));
		if (array_key_exists('bottom', $this->inputParams)) $this->limitBottom = intval(mysql_real_escape_string($this->inputParams['bottom']));
		if (array_key_exists('right',  $this->inputParams)) $this->limitRight  = intval(mysql_real_escape_string($this->inputParams['right']));
		if (array_key_exists('zoom',   $this->inputParams)) $this->limitDisplayLevel = intval(mysql_real_escape_string($this->inputParams['zoom']));
		if (array_key_exists('locid',  $this->inputParams)) $this->locationId = intval(mysql_real_escape_string($this->inputParams['locid']));
		if (array_key_exists('incworld',  $this->inputParams)) $this->includeWorld = intval(mysql_real_escape_string($this->inputParams['incworld']));
		
		if ($this->limitTop < $this->limitBottom)
		{
			$tmp = $this->limitTop;
			$this->limitTop = $this->limitBottom;
			$this->limitBottom = $tmp;
		}
		
		if ($this->limitRight < $this->limitLeft)
		{
			$tmp = $this->limitRight;
			$this->limitRight = $this->limitLeft;
			$this->limitLeft = $tmp;
		}
	}
	
	
	public function reportError ($errorMsg)
	{
		$this->addOutputItem("isError", true);
		$this->addOutputItem("errorMsg", $errorMsg);
		
		error_log("Error: " . $errorMsg);
		return false;
	}
	
	
	private function setInputParams ()
	{
		global $argv;
		$this->inputParams = $_REQUEST;
		
			// Add command line arguments to input parameters for testing
		if ($argv !== null)
		{
			foreach ($argv as $arg)
			{
				$e = explode("=", $arg);
				
				if(count($e) == 2)
					$this->inputParams[$e[0]] = $e[1];
				else
					$this->inputParams[$e[0]] = 0;
			}
		}
	}
	
	
	public function writeHeaders ()
	{
		header("Expires: 0");
		header("Pragma: no-cache");
		header("Cache-Control: no-cache, no-store, must-revalidate");
		header("Pragma: no-cache");
		header("content-type: application/json");
	}
	
	
	public function writeJson ()
	{
		$this->writeHeaders();
		print json_encode($this->outputItems);
		print "\n";
	}
	
}


$g_GameMap = new GameMap();
$g_GameMap->doAction();
$g_GameMap->writeJson();


?>