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
	
	public $inputParams = array();
	public $action = 'default';
	public $outputItems = array();
	
	private $db      = null;
	private $dbwrite = null;
	
	
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
		$query = "
				CREATE TABLE IF NOT EXISTS  `world` (
					`id` BIGINT NOT NULL AUTO_INCREMENT,
					`name` TEXT NOT NULL,
					`display_name` TEXT NOT NULL,
					`description` TEXT NOT NULL,
					`wiki_page` TEXT NOT NULL,
					`cell_size` INTEGER NOT NULL,
					`min_zoom` INTEGER NOT NULL,
					`max_zoom` INTEGER NOT NULL,
					`pos_left` INTEGER NOT NULL,
					`pos_top` INTEGER NOT NULL,
					`pos_right` INTEGER NOT NULL,
					`pos_bottom` INTEGER NOT NULL,
					PRIMARY KEY ( id )
				);";
		
		$result = mysql_query($query);
		if ($result !== TRUE) return $this->reportError("Failed to create table!");
		
		return true;
	}
	
	
	public function doAction ($action = null)
	{
		if ($action == null) $action = $this->action;
		$this->addOutputItem("action", $action);
		
		switch ($action)
		{
			case 'create_tables':
				return $this->initDatabaseWrite();
			case 'get_worlds':
				if (!$this->initDatabase()) return false;
				return $this->doGetWorlds();
			case 'default':
			default:
				break;
		}
		
		$this->reportError("Unknown action '". $action ."' received!");
		return false;
	}
	
	
	public function doGetWorlds ()
	{
		
		return true;
	}
	
	
	private function initDatabase ()
	{
		global $uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $uespGameMapDatabase;
		
		$this->db = mysql_connect($uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW);
		if (!$this->db) return $this->reportError("Could not connect to mysql database!");
		
		if (!mysql_select_db($uespGameMapDatabase, $this->db)) return $this->reportError("Game map database '".$uespGameMapDatabase."'. not found!");
		
		return $this->checkTables();
	}
	
	
	private function initDatabaseWrite ()
	{
		global $uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $uespGameMapDatabase;
		
		$this->dbwrite = mysql_connect($uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW);
		if (!$this->dbwrite) return $this->reportError("Could not connect to mysql database!");
		
		if (!mysql_select_db($uespGameMapDatabase, $this->dbwrite)) return $this->reportError("Game map database '".$uespGameMapDatabase."'. not found!");
		
		return $this->checkTables();
	}
	
	
	private function parseInputParams ()
	{
		$this->action = strtolower($this->inputParams['action']);
	}
	
	
	public function reportError ($errorMsg)
	{
		$this->addOutputItem("isError", true);
		$this->addOutputItem("errorMsg", $errorMsg);
		
		error_log("Error: " . $errorMsg);
		return false;
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
	
}


$g_GameMap = new GameMap();
$g_GameMap->doAction();
$g_GameMap->writeJson();


?>