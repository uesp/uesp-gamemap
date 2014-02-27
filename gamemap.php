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
	public $worldName = '';
	public $locationId = 0;
	public $revisionId = 0;
	public $worldHistoryId = 0;
	public $locHistoryId = 0;
	public $newRevisionId = 0;
	
	public $locName = '';
	public $locDescription = '';
	public $locWikiPage = '';
	public $locType = 0;
	public $locIconType = 0;
	public $locDisplayLevel = 0;
	public $locVisible = 1;
	public $locDestId = 0;
	public $locDisplayData = '{}';
	public $locX = 0;
	public $locY = 0;
	
	public $locWidth = 0;
	public $locHeight = 0;
	
	public $worldDisplayName = '';
	public $worldMissingTile = '';
	public $worldParentId = 0;
	public $worldMinZoom = 0;
	public $worldMaxZoom = 20;
	public $worldZoomOffset = 0;
	public $worldPosLeft = 0;
	public $worldPosRight = 10000;
	public $worldPosTop = 10000;
	public $worldPosBottom = 0;
	public $worldEnabled = 1;
	
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
	private $dbReadInitialized  = false;
	private $dbWriteInitialized = false;
	private $startedSession = false;
	private $canEdit = false;
	
	
	function __construct ()
	{
		$this->setInputParams();
		$this->parseInputParams();
		
		session_name('uesp_net_wiki5_session');
		$this->startedSession = session_start();
		
		if (!$this->startedSession) error_log("Failed to start session!");
		
		if (isset($_SESSION['wsUserID'])) $this->canEdit = true;
	}
	
	
	public function addOutputItem ($key, $value)
	{
		$this->outputItems[$key] = $value;
	}
	
	
	private function checkTables()
	{
		$result = $this->db->query('select 1 from `world`;');
		
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
					`parentId` BIGINT NOT NULL,
					`revisionId` BIGINT NOT NULL,
					`name` TINYTEXT NOT NULL,
					`displayName` TINYTEXT NOT NULL,
					`description` TEXT NOT NULL,
					`wikiPage` TEXT NOT NULL,
					`cellSize` INTEGER NOT NULL,
					`minZoom` INTEGER NOT NULL,
					`maxZoom` INTEGER NOT NULL,
					`zoomOffset` INTEGER NOT NULL,
					`posLeft` INTEGER NOT NULL,
					`posTop` INTEGER NOT NULL,
					`posRight` INTEGER NOT NULL,
					`posBottom` INTEGER NOT NULL,
					`enabled` TINYINT NOT NULL,
					PRIMARY KEY ( id )
				);";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to create world table!");
		
		$query = "CREATE TABLE IF NOT EXISTS world_history (
					id BIGINT NOT NULL AUTO_INCREMENT,
					worldId BIGINT NOT NULL,
					revisionId BIGINT NOT NULL,
					parentId BIGINT NOT NULL,
					name TINYTEXT NOT NULL,
					displayName TINYTEXT NOT NULL,
					description TEXT NOT NULL,
					wikiPage TEXT NOT NULL,
					cellSize INTEGER NOT NULL,
					minZoom INTEGER NOT NULL,
					maxZoom INTEGER NOT NULL,
					zoomOffset INTEGER NOT NULL,
					posLeft INTEGER NOT NULL,
					posTop INTEGER NOT NULL,
					posRight INTEGER NOT NULL,
					posBottom INTEGER NOT NULL,
					enabled TINYINT NOT NULL,
					PRIMARY KEY ( id )
				);";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to create world_history table!");
		
		$query = "CREATE TABLE IF NOT EXISTS location (
					id BIGINT NOT NULL AUTO_INCREMENT,
					worldId BIGINT NOT NULL,
					revisionId BIGINT NOT NULL,
					destinationId BIGINT NOT NULL,
					locType TINYINT NOT NULL,
					x INTEGER NOT NULL,
					y INTEGER NOT NULL,
					width INTEGER NOT NULL,
					height INTEGER NOT NULL,
					name TINYTEXT NOT NULL,
					description TEXT NOT NULL,
					iconType TINYINT NOT NULL,
					displayData TEXT NOT NULL,
					wikiPage TEXT NOT NULL,
					displayLevel INTEGER NOT NULL,
					visible TINYINT NOT NULL,
					PRIMARY KEY ( id )
				);";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to create location table!");
		
		$query = "CREATE TABLE IF NOT EXISTS location_history (
					id BIGINT NOT NULL AUTO_INCREMENT,
					locationId BIGINT NOT NULL,
					revisionId BIGINT NOT NULL,
					worldId BIGINT NOT NULL,
					destinationId BIGINT NOT NULL,
					locType TINYINT NOT NULL,
					x INTEGER NOT NULL,
					y INTEGER NOT NULL,
					width INTEGER NOT NULL,
					height INTEGER NOT NULL,
					name TINYTEXT NOT NULL,
					description TEXT NOT NULL,
					iconType TINYINT NOT NULL,
					displayData TEXT NOT NULL,
					wikiPage TEXT NOT NULL,
					displayLevel INTEGER NOT NULL,
					visible TINYINT NOT NULL,
					PRIMARY KEY ( id )
				);";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to create location_history table!");
		
		$query = "CREATE TABLE IF NOT EXISTS revision (
					id BIGINT NOT NULL AUTO_INCREMENT,
					parentId BIGINT,
					worldHistoryId BIGINT,
					locationHistoryId BIGINT,
					editUserId BIGINT NOT NULL,
					editUserText TEXT NOT NULL,
					editTimestamp TIMESTAMP NOT NULL,
					editComment TEXT NOT NULL,
					patrolled TINYINT NOT NULL,
					PRIMARY KEY (id)
				);";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to create revision table!");
		
		$this->addOutputItem("createResult", true);
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
			case 'set_loc':
				return $this->doSetLocation();
			case 'add_loc':
				return $this->doAddLocation();
			case 'set_world':
				return $this->doSetWorld();
			case 'get_perm':
				return $this->doGetPermissions();
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
	
	
	public function doGetPermissions ()
	{
		$this->addOutputItem("canEdit", $this->canEdit);
		return true;
	}
	
	
	public function addWorldRevision ()
	{
		$userName = $_SERVER["REMOTE_ADDR"];
		$userId = 0;
		$revisionId = 0;
		
		if (isset($_SESSION['wsUserID'])) $userId = $_SESSION['wsUserID'];
		if (isset($_SESSION['wsUserName'])) $userName = $_SESSION['wsUserName'];
		
		$userName = $this->db->real_escape_string($userName);
		
		$query  = "INSERT INTO revision(parentId, worldHistoryId, editUserId, editUserText, editComment, patrolled) VALUES(";
		$query .= "{$this->revisionId}, ";		//parentId
		$query .= "{$this->worldHistoryId}, ";	//worldHistoryId
		$query .= "$userId, ";					//editUserId
		$query .= "'$userName', ";				//editUserText
		$query .= "'', ";						//editComment
		$query .= "0 ";							//patrolled
		$query .= ");";
		
		$result = $this->db->query($query);
		
		if ($result === FALSE) {
			error_log($this->db->error);
			return $this->reportError("Failed to create new revision record!");
		}
		
		$revisionId = $this->db->insert_id;
		$this->addOutputItem("newRevisionId", $revisionId);
		
		$this->newRevisionId = $revisionId;
		return true;
	}
	
	
	public function copyToWorldHistory ()
	{
		if ($this->worldId == 0) return $this->reportError("Cannot copy empty world record to history!");
		
		$query = "INSERT INTO world_history(worldId, revisionId, parentId, name, displayName, description, wikiPage, cellSize, minZoom, maxZoom, zoomOffset, posLeft, posRight, posTop, posBottom, enabled)
					SELECT id, revisionId, parentId, name, displayName, description, wikiPage, cellSize, minZoom, maxZoom, zoomOffset, posLeft, posRight, posTop, posBottom, enabled
					FROM world WHERE id={$this->worldId};";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to copy world {$this->worldId} to history table! " . $this->db->error);
		
		$this->worldHistoryId = $this->db->insert_id;
		$this->addOutputItem("newWorldHistoryId", $this->worldHistoryId);
		return true;
	}
	
	
	public function doGetLocations ()
	{
		if (!$this->initDatabase()) return false;
		
		$query  = "SELECT * from location WHERE visible <> 0 AND ";
		
		if ($this->worldName != '')
		{
			$this->worldId = $this->getWorldId($this->worldName);
			if ($this->worldId == 0) return false;
		}

		if ($this->worldId > 0)
			$query .= "worldId=" . $this->worldId . " ";
		else
			return $this->reportError("No world specified to retrieve locations for!");
			
		$query .= "AND x >= " . $this->limitLeft ." AND x <= ". $this->limitRight ." AND y >= ". $this->limitBottom ." AND y <= ". $this->limitTop ." ";
		$query .= " AND displayLevel <= ". $this->limitDisplayLevel ." ";
		$query .= " LIMIT ".$this->limitCount.";";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve location data!");
		
		$locations = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
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
			
			$locations[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("locations", $locations);
		$this->addOutputItem("locationCount", $count);
		
		if ($this->includeWorld != 0) return $this->doGetWorld();
		return true;
	}
	
	
	public function doAddLocation ()
	{
		if (!$this->initDatabaseWrite()) return false;
		
		$query = "INSERT INTO location(worldId, locType, name, description, wikiPage, displayLevel, visible, x, y, width, height, iconType, destinationId, displayData) VALUES (";
		$query .= "{$this->worldId}, ";
		$query .= "{$this->locType}, ";
		$query .= "'{$this->locName}', ";
		$query .= "'{$this->locDescription}', ";
		$query .= "'{$this->locWikiPage}', ";
		$query .= "{$this->locDisplayLevel}, ";
		$query .= "{$this->locVisible}, ";
		$query .= "{$this->locX}, ";
		$query .= "{$this->locY}, ";
		$query .= "{$this->locWidth}, ";
		$query .= "{$this->locHeight}, ";
		$query .= "{$this->locIconType}, ";
		$query .= "{$this->locDestId}, ";
		$query .= "'{$this->locDisplayData}' ";
		$query .= ');';
		
		$result = $this->db->query($query);
		
		if ($result === FALSE) {
			error_log($query);
			error_log($this->db->error);
			return $this->reportError("Failed to save new location data!");
		}
		
		$this->addOutputItem('newLocId', $this->db->insert_id);
		$this->addOutputItem('success', True);
		return true;
	}
	
	
	public function doSetWorld ()
	{
		if ($this->worldId <= 0) return $this->reportError("Cannot create worlds yet!");
		if (!$this->initDatabaseWrite()) return false;
	
		$query  = "UPDATE world SET ";
		$query .= "name='{$this->locName}', ";
		$query .= "displayName='{$this->worldDisplayName}', ";
		$query .= "description='{$this->locDescription}', ";
		$query .= "wikiPage='{$this->locWikiPage}', ";
		//$query .= "missingTile='{$this->worldMissingTile}', ";
		$query .= "parentId={$this->worldParentId}, ";
		$query .= "minZoom={$this->worldMinZoom}, ";
		$query .= "maxZoom={$this->worldMaxZoom}, ";
		$query .= "zoomOffset={$this->worldZoomOffset}, ";
		$query .= "posLeft={$this->worldPosLeft}, ";
		$query .= "posRight={$this->worldPosRight}, ";
		$query .= "posTop={$this->worldPosTop}, ";
		$query .= "posBottom={$this->worldPosBottom}, ";
		$query .= "enabled={$this->worldEnabled} ";
		$query .= " WHERE id={$this->worldId};";
		
		error_log($query);
	
		$result = $this->db->query($query);
	
		if ($result === FALSE) {
			error_log($query);
			error_log($this->db->error);
			return $this->reportError("Failed to save world data!");
		}
		
		if (!$this->addWorldRevision()) return false;
		if (!$this->updateWorldRevision($this->worldId)) return false;
		if (!$this->copyToWorldHistory()) return false;
		if (!$this->updateRevisionWorldHistory($this->newRevisionId)) return false;
		
		$this->addOutputItem('success', True);
		$this->addOutputItem('worldId', $this->worldId);
		return true;
	}
	
	
	public function updateWorldRevision ($worldId)
	{
		$query = "UPDATE world SET revisionId={$this->newRevisionId} WHERE id={$worldId};";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to update the world revision!");
		
		return true;
	}
	
	
	public function updateRevisionWorldHistory ($revisionId)
	{
		$query = "UPDATE revision SET worldHistoryId={$this->worldHistoryId} WHERE id={$revisionId};";
	
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to update the revision world history ID!");
	
		return true;
	}
	
	
	public function doSetLocation ()
	{
		if ($this->locationId <= 0) return $this->doAddLocation();
		if (!$this->initDatabaseWrite()) return false;
		
		$query  = "UPDATE location SET ";
		$query .= "worldId={$this->worldId}, ";
		$query .= "locType={$this->locType}, ";
		$query .= "x={$this->locX}, ";
		$query .= "y={$this->locY}, ";
		$query .= "displayLevel={$this->locDisplayLevel}, ";
		$query .= "iconType={$this->locIconType}, ";
		$query .= "destinationId={$this->locDestId}, ";
		$query .= "visible={$this->locVisible}, ";
		$query .= "name='{$this->locName}', ";
		$query .= "description='{$this->locDescription}', ";
		$query .= "wikiPage='{$this->locWikiPage}', ";
		$query .= "displayData='{$this->locDisplayData}', ";
		$query .= "width={$this->locWidth}, ";
		$query .= "height={$this->locHeight} ";
		$query .= " WHERE id={$this->locationId};";
		
		$result = $this->db->query($query);
		
		if ($result === FALSE) {
			error_log($query);
			error_log($this->db->error);
			return $this->reportError("Failed to save location data!");
		}
		
		$this->addOutputItem('success', True);
		return true;
	}
	
	
	public function doGetLocation ()
	{
		if ($this->locationId === 0) return $this->reportError("No location specified to retrieve data for!");
		if (!$this->initDatabase()) return false;
	
		$query  = "SELECT * from location WHERE visible <> 0 AND id=".$this->locationId." ";
		$query .= " LIMIT 1";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve location data!");
	
		$locations = Array();
		$count = 0;
		$result->data_seek(0);
	
		while ( ($row = $result->fetch_assoc()) )
		{
			settype($row['id'], "integer");
			settype($row['worldId'], "integer");
			settype($row['destinationId'], "integer");
			settype($row['revisionId'], "integer");
			settype($row['locType'], "integer");
			settype($row['iconType'], "integer");
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
	
	
	public function doGetWorld ()
	{
		if (!$this->initDatabase()) return false;
	
		$query = "SELECT * from world WHERE enabled <> 0 AND ";

		if ($this->worldId > 0)
			$query .= "id=". $worldId .";";
		else if ($this->worldName != '')
			$query .= "name='". $worldName ."';";
		else
			return $this->reportError("World ID/name not specified!");
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve world data!");
		
		$worlds = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
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
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve world data!" . $result);
		
		$worlds = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
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
			
			$worlds[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("worlds", $worlds);
		$this->addOutputItem("worldCount", $count);
		return true;
	}
	
	
	public function getWorldId ($worldName)
	{
		if (!$this->initDatabase()) return 0;
	
		$query = "SELECT id from world WHERE name='". $this->db->real_escape_string($worldName) ."' LIMIT 1;";
		$result = $this->db->query($query);
		if ($result === false || $result->num_rows === 0) return $this->reportError("Failed to get the ID for world '". $worldName ."'! ");
		
		$result->data_seek(0);
		$row = $result->fetch_assoc();
		
		settype($row['id'], "integer");
		if ($row['id'] == 0) return $this->reportError("Failed to get the ID for world '". $worldName ."'! " . $result);
		return $row['id'];
	}
	
	
	private function initDatabase ()
	{
		global $uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $uespGameMapDatabase;
		
		if ($this->dbReadInitialized || $this->dbWriteInitialized) return true;
		
		$this->db = new mysqli($uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $uespGameMapDatabase);
		if ($db->connect_error) return $this->reportError("Could not connect to mysql database!");
		
		$this->dbReadInitialized = true;
		$this->dbWriteInitialized = false;
		
		if ($this->skipCheckTables) return true;
		return $this->checkTables();
	}
	
	
	private function initDatabaseWrite ()
	{
		global $uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $uespGameMapDatabase;
		
		if ($this->dbWriteInitialized) return true;
		
		if ($this->dbReadInitialized)
		{
			$this->db->close();
			unset($this->db);
			$this->db = null;
			$this->dbReadInitialized = false;
		}
		
		$this->db = new mysqli($uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $uespGameMapDatabase);
		if ($db->connect_error) return $this->reportError("Could not connect to mysql database!");
		
		$this->dbReadInitialized = true;
		$this->dbWriteInitialized = true;
		
		if ($this->skipCheckTables) return true;
		return $this->checkTables();
	}
	
	
	private function parseInputParams ()
	{
			//TODO: Need to change to write db connection afterwards if required
		if (!$this->initDatabase()) return false;
		
			//TODO: Better parameter handling
		if (array_key_exists('action', $this->inputParams)) $this->action = $this->db->real_escape_string(strtolower($this->inputParams['action']));
		if (array_key_exists('top',    $this->inputParams)) $this->limitTop    = intval($this->db->real_escape_string($this->inputParams['top']));
		if (array_key_exists('left',   $this->inputParams)) $this->limitLeft   = intval($this->db->real_escape_string($this->inputParams['left']));
		if (array_key_exists('bottom', $this->inputParams)) $this->limitBottom = intval($this->db->real_escape_string($this->inputParams['bottom']));
		if (array_key_exists('right',  $this->inputParams)) $this->limitRight  = intval($this->db->real_escape_string($this->inputParams['right']));
		if (array_key_exists('zoom',   $this->inputParams)) $this->limitDisplayLevel = intval($this->db->real_escape_string($this->inputParams['zoom']));
		if (array_key_exists('locid',  $this->inputParams)) $this->locationId = intval($this->db->real_escape_string($this->inputParams['locid']));
		if (array_key_exists('incworld',  $this->inputParams)) $this->includeWorld = intval($this->db->real_escape_string($this->inputParams['incworld']));
		if (array_key_exists('worldid',  $this->inputParams)) $this->worldId = intval($this->db->real_escape_string($this->inputParams['worldid']));
		if (array_key_exists('displaylevel',  $this->inputParams)) $this->locDisplayLevel = intval($this->db->real_escape_string($this->inputParams['displaylevel']));
		if (array_key_exists('visible',  $this->inputParams)) $this->locVisible = intval($this->db->real_escape_string($this->inputParams['visible']));
		if (array_key_exists('destid',  $this->inputParams)) $this->locDestId = intval($this->db->real_escape_string($this->inputParams['destid']));
		if (array_key_exists('x',  $this->inputParams)) $this->locX = intval($this->db->real_escape_string($this->inputParams['x']));
		if (array_key_exists('y',  $this->inputParams)) $this->locY = intval($this->db->real_escape_string($this->inputParams['y']));
		if (array_key_exists('locwidth',  $this->inputParams)) $this->locWidth = intval($this->db->real_escape_string($this->inputParams['locwidth']));
		if (array_key_exists('locheight',  $this->inputParams)) $this->locHeight = intval($this->db->real_escape_string($this->inputParams['locheight']));
		if (array_key_exists('loctype',  $this->inputParams)) $this->locType = intval($this->db->real_escape_string($this->inputParams['loctype']));
		if (array_key_exists('icontype',  $this->inputParams)) $this->locIconType = intval($this->db->real_escape_string($this->inputParams['icontype']));
		if (array_key_exists('name', $this->inputParams)) $this->locName = $this->db->real_escape_string($this->inputParams['name']);
		if (array_key_exists('description', $this->inputParams)) $this->locDescription = $this->db->real_escape_string($this->inputParams['description']);
		if (array_key_exists('wikipage', $this->inputParams)) $this->locWikiPage = $this->db->real_escape_string($this->inputParams['wikipage']);
		if (array_key_exists('displaydata', $this->inputParams)) $this->locDisplayData = $this->db->real_escape_string($this->inputParams['displaydata']);
		if (array_key_exists('displayname', $this->inputParams)) $this->worldDisplayName = $this->db->real_escape_string($this->inputParams['displayname']);
		if (array_key_exists('missingtile', $this->inputParams)) $this->worldMissingTile = $this->db->real_escape_string($this->inputParams['missingtile']);
		if (array_key_exists('enabled',  $this->inputParams)) $this->worldEnabled = intval($this->db->real_escape_string($this->inputParams['enabled']));
		if (array_key_exists('minzoom',  $this->inputParams)) $this->worldMinZoom = intval($this->db->real_escape_string($this->inputParams['minzoom']));
		if (array_key_exists('maxzoom',  $this->inputParams)) $this->worldMaxZoom = intval($this->db->real_escape_string($this->inputParams['maxzoom']));
		if (array_key_exists('zoomoffset',  $this->inputParams)) $this->worldZoomOffset = intval($this->db->real_escape_string($this->inputParams['zoomoffset']));
		if (array_key_exists('posleft',  $this->inputParams)) $this->worldPosLeft = intval($this->db->real_escape_string($this->inputParams['posleft']));
		if (array_key_exists('posright',  $this->inputParams)) $this->worldPosRight = intval($this->db->real_escape_string($this->inputParams['posright']));
		if (array_key_exists('postop',  $this->inputParams)) $this->worldPosTop = intval($this->db->real_escape_string($this->inputParams['postop']));
		if (array_key_exists('posbottom',  $this->inputParams)) $this->worldPosBottom = intval($this->db->real_escape_string($this->inputParams['posbottom']));
		if (array_key_exists('parentid',  $this->inputParams)) $this->worldParentId = intval($this->db->real_escape_string($this->inputParams['parentid']));
		if (array_key_exists('revisionid',  $this->inputParams)) $this->revisionId = intval($this->db->real_escape_string($this->inputParams['revisionid']));
		
		if (array_key_exists('world',  $this->inputParams))
		{
			$worldParam = $this->db->real_escape_string($this->inputParams['world']);
			
			if (is_numeric($worldParam))
				$this->worldId = intval($worldParam);
			else
				$this->worldName = strtolower($worldParam);
	
		}
		
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
		if ($this->db->error) error_log($this->db->error); 
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