<?php 
/*
 * gamemap.php -- Created by Dave Humphrey (dave@uesp.net) on 23 Jan 2014
 * 		Released under the GPL v2
 *		Main server side application for the game map system.
 *
 */


require '/home/uesp/secrets/gamemap.secrets';
require_once 'UespMemcachedSession.php';


class GameMap
{
	
	const LOCTYPE_NONE  = 0;
	const LOCTYPE_POINT = 1;
	const LOCTYPE_PATH  = 2;
	const LOCTYPE_AREA  = 3;
	
	const USE_MEMCACHED_SESSIONS = true;	//Must be true or session reading will break as of MW 1.27
	
	public $inputParams = array();
	
	public $action = 'default';
	public $worldId = 0;
	public $worldName = '';
	public $world = '';
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
	public $locCenterOn = '';
	public $locX = 0;
	public $locY = 0;
	public $showHidden = 0;
	
	public $search = '';
	public $searchType = 0;
	public $searchWorldId = 0;
	
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
	public $worldDisplayData = null;
	
	public $limitBottom = 0;
	public $limitTop    = 1000;
	public $limitLeft   = 0;
	public $limitRight  = 1000;
	public $hasLimits = false;
	public $hasDisplayLevel = false;
	public $limitDisplayLevel = 100;
	public $includeWorld = 0;
	
	public $outputItems = array();
	
	public $limitCount = 10000;
	public $searchLimitCount = 100;
	
	public $cellResourceEditorId = "";
	
	public $db = null;
	public $dbPrefix = "";
	public $skipCheckTables = true;
	public $dbReadInitialized  = false;
	public $dbWriteInitialized = false;
	public $startedSession = false;
	
	public $canEdit = false;
	public $canEditESO = false;
	public $canEditTR = false;
	public $canEditOther = false;
	
	
	function __construct ()
	{
		if (self::USE_MEMCACHED_SESSIONS) UespMemcachedSession::install();
		
		$this->setInputParams();
		$this->parseInputParams();
		
		session_name('uesp_net_wiki5_session');
		session_set_cookie_params(3600*24*10, '/', '.uesp.net', false);
		$this->startedSession = session_start();
		
		if (!$this->startedSession) error_log("Failed to start session!");
		
		$userId = UespMemcachedSession::readKey('wsUserID');
		
		if ($userId > 0)
		{
			if (UespMemcachedSession::readKey('UESP_AllMap_canEdit') === 1)
			{
				$this->canEdit = true;
				$this->canEditESO = true;
				$this->canEditTR = true;
				$this->canEditOther = true;
			}
			
			if (UespMemcachedSession::readKey('UESP_EsoMap_canEdit') === 1) $this->canEditESO = true;
			if (UespMemcachedSession::readKey('UESP_TRMap_canEdit') === 1) $this->canEditTR = true;
			if (UespMemcachedSession::readKey('UESP_OtherMap_canEdit') === 1) $this->canEditOther = true;
		}
	}
	
	
	public function canEditMap($dbPrefix)
	{
		if ($dbPrefix === null) return false;
		
		if ($this->canEdit) return true;
		
		if ($dbPrefix == "" || $dbPrefix == "eso") return $this->canEditESO;
		if ($dbPrefix == "tr") return $this->canEditTR;
		
		if ($dbPrefix == "sr" || $dbPrefix == "si" || $dbPrefix == "mw" || $dbPrefix == "ob" || $dbPrefix == "si" || $dbPrefix == "db" || $dbPrefix == "ptmw" || $dbPrefix == "test")
		{
			return $this->canEditOther;
		}
		
		return false;
	}
	
	
	public function CanViewWorldId($id)
	{
		return true;
	}
	
	
	public function addOutputItem ($key, $value)
	{
		$this->outputItems[$key] = $value;
	}
	
	
	public function checkTables()
	{
		$result = $this->db->query('select 1 from `world`;');
		
		if ($result === FALSE)
		{
			return $this->createTables();
		}
		
		return true;
	}
	
	
	public function createTables()
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
					`defaultZoom` INTEGER NOT NULL,
					`zoomOffset` INTEGER NOT NULL,
					`posLeft` INTEGER NOT NULL,
					`posTop` INTEGER NOT NULL,
					`posRight` INTEGER NOT NULL,
					`posBottom` INTEGER NOT NULL,
					`enabled` TINYINT NOT NULL,
					`tilesX` INTEGER NOT NULL
					`tilesY` INTEGER NOT NULL
					`maxTilesX` INTEGER NOT NULL
					`maxTilesY` INTEGER NOT NULL
					`displayData` TEXT NOT NULL,
					PRIMARY KEY ( id ),
					FULLTEXT(displayName, description, wikiPage)
				) ENGINE=MYISAM;";
		
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
					defaultZoom INTEGER NOT NULL,
					zoomOffset INTEGER NOT NULL,
					posLeft INTEGER NOT NULL,
					posTop INTEGER NOT NULL,
					posRight INTEGER NOT NULL,
					posBottom INTEGER NOT NULL,
					enabled TINYINT NOT NULL,
					`tilesX` INTEGER NOT NULL
					`tilesY` INTEGER NOT NULL
					`maxTilesX` INTEGER NOT NULL
					`maxTilesY` INTEGER NOT NULL
					displayData TEXT NOT NULL,
					PRIMARY KEY ( id ),
				) ENGINE=MYISAM;";
		
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
					displayLevel FLOAT NOT NULL,
					visible TINYINT NOT NULL,
					PRIMARY KEY ( id ),
					FULLTEXT(name, description, wikiPage)
				) ENGINE=MYISAM;";
		
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
					displayLevel FLOAT NOT NULL,
					visible TINYINT NOT NULL,
					PRIMARY KEY ( id ),
				) ENGINE=MYISAM;";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to create location_history table!");
		
		$query = "CREATE TABLE IF NOT EXISTS revision (
					id BIGINT NOT NULL AUTO_INCREMENT,
					parentId BIGINT,
					worldId BIGINT,
					locationId BIGINT,
					worldHistoryId BIGINT,
					locationHistoryId BIGINT,
					editUserId BIGINT NOT NULL,
					editUserText TEXT NOT NULL,
					editTimestamp TIMESTAMP NOT NULL,
					editAction TINYTEXT NOT NULL,
					editComment TEXT NOT NULL,
					patrolled TINYINT NOT NULL,
					PRIMARY KEY (id)
				) ENGINE=MYISAM;";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to create revision table!");
		
		$query = "CREATE TABLE IF NOT EXISTS cellResource (
					worldId BIGINT,
					formId BIGINT NOT NULL,
					name TEXT NOT NULL,
					editorId TEXT NOT NULL,
					data TEXT NOT NULL,
					PRIMARY KEY (formId),
					INDEX index_editorid(editorId(24))
				) ENGINE=MYISAM;";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to create cellResource table!");
		
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
			case 'get_centeron':
				return $this->doGetCenterOn();
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
			case 'search':
				return $this->doSearch();
			case 'get_rc':
				return $this->doGetRecentChanges();
			case 'get_cellresource':
				return $this->doGetCellResource();
			case 'get_maps':
				return $this->doGetMaps();
			case 'default':
			default:
				break;
		}
		
		$this->reportError("Unknown action '". $action ."' received!");
		return false;
	}
	
	
	public function doCreateTables ()
	{
		$result = $this->initDatabaseWrite();
		if (!$result) return false;
		
		$result = $this->createTables();
		if (!$result) return false;
		
		$this->addOutputItem("result", "Successfully created tables!");
		return true;
	}
	
	
	public function doGetPermissions ()
	{
		$this->addOutputItem("canEdit", $this->canEditMap($this->dbPrefix));
		return true;
	}
	
	
	public function addRevision ($editAction, $oldRecord = null, $newRecord = null)
	{
		$userName = $_SERVER["REMOTE_ADDR"];
		$userId = 0;
		$revisionId = 0;
		
		$userId = UespMemcachedSession::readKey('wsUserId');
		$userName = UespMemcachedSession::readKey('wsUserName');
		if ($userId == null) $userId = 0;
		if ($userName == null) $userName = $_SERVER["REMOTE_ADDR"];
		
		$userName = $this->db->real_escape_string($userName);
		
		$query  = "INSERT INTO revision(parentId, ";
		if ($this->worldId > 0)    $query .= "worldId, ";
		if ($this->locationId > 0) $query .= "locationId, ";
		if ($this->worldHistoryId    > 0) $query .= "worldHistoryId, ";
		if ($this->locationHistoryId > 0) $query .= "locationHistoryId,";
		$query .= "editUserId, editUserText, editAction, editComment, editTimestamp, patrolled) VALUES(";
		$query .= "{$this->revisionId}, ";			//parentId
		if ($this->worldId > 0)    $query .= "{$this->worldId}, ";
		if ($this->locationId > 0) $query .= "{$this->locationId}, ";
		if ($this->worldHistoryId    > 0) $query .= "{$this->worldHistoryId}, ";
		if ($this->locationHistoryId > 0) $query .= "{$this->locationHistoryId}, ";
		$query .= "$userId, ";						//editUserId
		$query .= "'$userName', ";					//editUserText
		
		$editAction = $this->db->real_escape_string($editAction);
		$query .= "'$editAction', ";				//editAction
		
		$editComment = $this->MakeEditComment($editAction, $oldRecord, $newRecord);
		$editComment = $this->db->real_escape_string($editComment);
		$query .= "'$editComment', ";				//editComment
		
		$query .= "UTC_TIMESTAMP(), ";				//editTimestamp
		$query .= "0 ";								//patrolled
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
	
	
	public function MakeEditComment($editAction, $oldRecord, $newRecord)
	{
		$comments = [];
		
		if ($oldRecord == null || $newRecord == null) return '';
		
		foreach ($oldRecord as $key => $oldValue)
		{
			$newValue = $newRecord[$key];
			if ($newValue != $oldValue) $comments[] = $key;
		}
		
		if (count($comments) == 0) return "Changed nothing";
		$comment = 'Changed ' . implode(', ', $comments);
		return $comment;
	}
	
	
	public function copyToWorldHistory ()
	{
		if ($this->worldId == 0) return $this->reportError("Cannot copy empty world record to history!");
		
		$query = "INSERT INTO world_history(worldId, revisionId, parentId, name, displayName, description, wikiPage, cellSize, minZoom, maxZoom, defaultZoom, zoomOffset, posLeft, posRight, posTop, posBottom, enabled, displayData, tilesX, tilesY, maxTilesX, maxTilesY)
					SELECT id, revisionId, parentId, name, displayName, description, wikiPage, cellSize, minZoom, maxZoom, defaultZoom, zoomOffset, posLeft, posRight, posTop, posBottom, enabled, displayData, tilesX, tilesY, maxTilesX, maxTilesY
					FROM world WHERE id={$this->worldId};";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to copy world {$this->worldId} to history table!");
		
		$this->worldHistoryId = $this->db->insert_id;
		$this->addOutputItem("newWorldHistoryId", $this->worldHistoryId);
		return true;
	}
	
	
	public function copyToLocationHistory ()
	{
		if ($this->locationId == 0) return $this->reportError("Cannot copy empty location record to history!");
		
		$query = "INSERT INTO location_history(locationId, revisionId, worldId, locType, x, y, displayLevel, iconType, destinationId, visible, name, description, wikiPage, displayData, width, height)
		SELECT id, revisionId, worldId, locType, x, y, displayLevel, iconType, destinationId, visible, name, description, wikiPage, displayData, width, height 
		FROM location WHERE id={$this->locationId};";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to copy location {$this->locationId} to history table!");
		
		$this->locationHistoryId = $this->db->insert_id;
		$this->addOutputItem("newLocationHistoryId", $this->locationHistoryId);
		return true;
	}
	
	
	public function doTypeSearch ()
	{
		
		if ($this->searchWorldId != 0)
			$query = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND worldId={$this->searchWorldId} AND iconType={$this->searchType} ORDER BY name, worldId LIMIT {$this->searchLimitCount};";
		else
			$query = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND iconType={$this->searchType} ORDER BY name, worldId LIMIT {$this->searchLimitCount};";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed searching for locations by type!");
		
		$locations = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['worldId'])) continue;
			
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
			settype($row['displayLevel'], "float");
			settype($row['visible'], "integer");
		
			$locations[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("locations", $locations);
		$this->addOutputItem("locationCount", $count);
		
		return true;
	}
	
	
	public function doSearch ()
	{
		if ($this->searchType > 0)
		{
			return $this->doTypeSearch();
		}
		
		$matches = array();
		preg_match_all('#([A-Za-z0-9_]+)([[:punct:]]+[A-Za-z0-9_]+)?\s*#', $this->unsafeSearch, $matches);
		$this->searchWords = $matches[1];
		$this->searchWordWildcard = implode('*', $this->searchWords);
		
		if ($this->searchWordWildcard != '') $this->searchWordWildcard .= '*';
		
		$this->safeSearchWordWildcard = $this->db->real_escape_string($this->searchWordWildcard);
		$this->safeSearchWord = $this->db->real_escape_string($this->unsafeSearch);
		
		if ($this->worldId > 0)
			$this->searchWorldId = $this->worldId;
		else
			$this->searchWorldId = $this->FindWorld($this->world, false);
		
			/* Try an exact match first */
		$worldCount = $this->doWorldSearch(true);
		$locCount = $this->doLocationSearch(true);
		
		if ($locCount == 0)
		{
			$worldCount = $this->doWorldSearch(false);
			$locCount = $this->doLocationSearch(false);
		}
		
		return true;
	}
	
	
	public function doWorldSearch ($doExactSearch)
	{
		if ($this->world != '')
		{
			//$this->searchWorldId = $this->FindWorld($this->world);
			//if ($this->searchWorldId == 0) return $this->reportError("Invalid world '{$this->world}' for search!");
			return 0;
		}
		
		$query  = "SELECT * from world WHERE " . $this->getEnabledQueryParam("enabled") ." AND (";
		if (!$doExactSearch) $query .= "MATCH(displayName, description, wikiPage) AGAINST ('{$this->safeSearchWordWildcard}' IN BOOLEAN MODE) OR ";
		$query .= "displayName LIKE '%{$this->safeSearchWord}%' or description LIKE '%{$this->safeSearchWord}%' or wikiPage LIKE '%{$this->safeSearchWord}%') ";
		$query .= "ORDER BY displayName LIMIT {$this->searchLimitCount};";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed searching for worlds!");
		
		$worlds = array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['id'])) continue;
			
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
			settype($row['defaultZoom'], "integer");
			settype($row['zoomOffset'], "float");
			settype($row['tilesX'], "integer");
			settype($row['tilesY'], "integer");
			settype($row['maxTilesX'], "integer");
			settype($row['maxTilesY'], "integer");
			
			$worlds[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("worlds", $worlds);
		$this->addOutputItem("worldCount", $count);
		
		return $count;
	}
	
	
	public function FindWorld ($world, $saveData = true)
	{
		
		if (is_numeric($world))
		{
			$worldId = intval($world);
			$query = "SELECT * from world WHERE " . $this->getEnabledQueryParam("enabled") ." AND id={$worldId} LIMIT 1;";
		}
		else
		{
			$worldName = strtolower($world);
			$query = "SELECT * from world WHERE " . $this->getEnabledQueryParam("enabled") ." AND displayName='{$world}' or name='{$worldName}' LIMIT 1;";
		}
		
		$result = $this->db->query($query);
		if ($result === FALSE) return 0;
		
		$worlds = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['id'])) continue;
			
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
			settype($row['defaultZoom'], "integer");
			settype($row['zoomOffset'], "float");
			settype($row['tilesX'], "integer");
			settype($row['tilesY'], "integer");
			settype($row['maxTilesX'], "integer");
			settype($row['maxTilesY'], "integer");
			
			$worlds[] = $row;
			$count += 1;
		}
		
		if ($saveData)
		{
			$this->addOutputItem("worlds", $worlds);
			$this->addOutputItem("worldCount", $count);
		}
		
		return $worlds[0]['id'];
	}
	
	
	public function doLocationSearch ($doWordSearch)
	{
		$query  = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND ";
		if ($this->searchWorldId != 0) $query .= " worldId={$this->searchWorldId} AND ";
		$query .= " (";
		
			// Word search will be much faster than the string search
		if ($doWordSearch) 
			$query .= "MATCH(name, description, wikiPage) AGAINST ('{$this->safeSearchWordWildcard}' IN BOOLEAN MODE) ";
		else
			$query .= "name LIKE '%{$this->safeSearchWord}%' OR description LIKE '%{$this->safeSearchWord}%' or wikiPage LIKE '%{$this->safeSearchWord}%' ";
		
		$query .= ") ORDER BY name, worldId LIMIT {$this->searchLimitCount};";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed searching for locations!");
		
		$locations = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['worldId'])) continue;
			
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
			settype($row['displayLevel'], "float");
			settype($row['visible'], "integer");
			
			$locations[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("locations", $locations);
		$this->addOutputItem("locationCount", $count);
		
		return $count;
	}
	
	
	public function FindLocationCenterOn ($centerOn, &$worldId)
	{
		if ($worldId > 0)
		{
			$worldId = intval($worldId);
			
			if (is_numeric($centerOn))
			{
				$locId = intval($centerOn);
				$query = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND worldId='$worldId' AND id={$locId} LIMIT {$this->searchLimitCount};";
			}
			else
			{
				$query = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND worldId='$worldId' AND name='{$centerOn}' LIMIT {$this->searchLimitCount};";
			}
		}
		else
		{
			if (is_numeric($centerOn))
			{
				$locId = intval($centerOn);
				$query = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND id={$locId} LIMIT {$this->searchLimitCount};";
			}
			else
			{
				$query = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND name='{$centerOn}' LIMIT {$this->searchLimitCount};";
			}
		}
		
		$result = $this->db->query($query);
		if ($result === FALSE) return 0;
	
		$locations = Array();
		$count = 0;
		$result->data_seek(0);
	
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['worldId'])) continue;
			
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
			settype($row['displayLevel'], "float");
			settype($row['visible'], "integer");
	
			$locations[] = $row;
			$count += 1;
		}
	
		$this->addOutputItem("locations", $locations);
		$this->addOutputItem("locationCount", $count);
		
		if ($worldId === 0 && $count > 0)
		{
			$worldId = $locations[0]['worldId'];
			$this->worldId = $worldId;
			$this->doGetWorld();
		}
		
		return $locations[0]['id'];
	}
	
	
	public function doGetCenterOn ()
	{
		$worldId = 0;
		
		if ($this->locCenterOn === '') return $this->reportError("Missing 'centeron' query parameter!");
		//if ($this->world       === '') return $this->reportError("Missing 'world' query parameter!");
		
		if ($this->world !== '')
		{
			$worldId = $this->FindWorld($this->world);
			//error_log("doGetCenterOn: $worldId");
			//if ($worldId === 0) return $this->reportError("Could not find world '{$this->world}'!");
		}
		else
		{
			$worldId = 0;
		}
		
		$locId = $this->FindLocationCenterOn($this->locCenterOn, $worldId);
		if ($locId === 0) return $this->reportError("Could not find location matching '{$this->locCenterOn}'!");
		
		$this->addOutputItem("worldId", $worldId);
		$this->addOutputItem("locationId", $locId);
		
		return true;
	}
	
	
	public function doGetMaps() {
		$path = '../assets/maps';
		
		$dirs = array();
		
		// directory handle
		$dir = dir($path);
		
		while (false !== ($entry = $dir->read())) {
			if ($entry != '.' && $entry != '..') {
				if (is_dir($path . '/' .$entry)) {
					$dirs[] = $entry;
				}
			}
		}
		
		$this->addOutputItem("maps", $dirs);
		return true;
	}
	
	
	public function doGetCellResource()
	{
		if (!$this->initDatabase()) return false;
		
		if ($this->worldId <= 0) return $this->reportError("No world specified to retrieve cell resources for!");
		
		$query  = "SELECT * from cellResource WHERE worldId='{$this->worldId}' AND editorId='{$this->cellResourceEditorId}';";
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve cell resource data!");
		
		$resources = array();
		$count = 0;
		
		while ( ($row = $result->fetch_assoc()) )
		{
			settype($row['formId'], "integer");
			settype($row['worldId'], "integer");
			
			$row['data'] = json_decode($row['data']);
			
			$resources[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("resources", $resources);
		$this->addOutputItem("resourceCount", $count);
		
		return true;
	}
	
	
	public function doGetLocations ()
	{
		if (!$this->initDatabase()) return $this->reportError("Failed to initialize database!");
		
		$query  = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND ";
		
		if ($this->worldName != '')
		{
			$this->worldId = $this->getWorldId($this->worldName);
			if ($this->worldId == 0) return $this->reportError("Failed to find world matching '{$this->worldName}!");
		}
		
		if ($this->worldId > 0)
			$query .= "worldId=" . $this->worldId . " ";
		else
			return $this->reportError("No world specified to retrieve locations for!");
		
		if ($this->hasLimits)
		{
			$query .= "AND (";
			$query .= "(x >= " . $this->limitLeft ." AND x <= ". $this->limitRight ." AND y >= ". $this->limitBottom ." AND y <= ". $this->limitTop .") ";
			$query .= " OR ";
			$query .= "(x + width >= " . $this->limitLeft ." AND x + width <= ". $this->limitRight ." AND y - height >= ". $this->limitBottom ." AND y - height <= ". $this->limitTop .") ";
			$query .= ") ";
		}
		
		if ($this->hasDisplayLevel)
		{
			$query .= " AND displayLevel <= ". $this->limitDisplayLevel ." ";
		}
		
		$query .= " LIMIT ".$this->limitCount.";";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve location data!");
		
		$locations = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['worldId'])) continue;
			
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
			settype($row['displayLevel'], "float");
			settype($row['visible'], "integer");
			
			$locations[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("locations", $locations);
		$this->addOutputItem("locationCount", $count);
		
		if ($this->includeWorld != 0) return $this->doGetWorld();
		return true;
	}
	
	
	public function doGetRecentChanges ()
	{
		if (!$this->initDatabase()) return false;
		
		//select * from revision join location on location.id=revision.locationId join world on world.id=revision.worldId limit 10;
		$query  = "SELECT revision.*, world.name as worldName, world.displayName as worldDisplayName, location.iconType as iconType, location.name as locationName from revision LEFT JOIN location ON location.id=revision.locationId LEFT JOIN world ON world.id=revision.worldId ORDER BY editTimestamp DESC LIMIT {$this->limitCount};";
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve recent changes data!");
		
		$recentChanges = Array();
		$count = 0;
		$result->data_seek(0);
		/*
		 * id BIGINT NOT NULL AUTO_INCREMENT,
					parentId BIGINT,
					worldId BIGINT,
					locationId BIGINT,
					worldHistoryId BIGINT,
					locationHistoryId BIGINT,
					editUserId BIGINT NOT NULL,
					editUserText TEXT NOT NULL,
					editTimestamp TIMESTAMP NOT NULL,
					editComment TEXT NOT NULL,
					patrolled TINYINT NOT NULL,
					PRIMARY KEY (id)
		*/
		
		while ( ($row = $result->fetch_assoc()) )
		{
			settype($row['id'], "integer");
			settype($row['worldId'], "integer");
			settype($row['locationId'], "integer");
			settype($row['destinationId'], "integer");
			settype($row['worldHistoryId'], "integer");
			settype($row['locationHistoryId'], "integer");
			settype($row['editUserId'], "integer");
			
			$recentChanges[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("recentChanges", $recentChanges);
		$this->addOutputItem("recentChangeCount", $count);
		
		return true;
	}
	
	
	public function doAddLocation ()
	{
		if (!$this->initDatabaseWrite()) return false;
		
		if (!$this->CanViewWorldId($this->worldId)) return false;
		
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
		
		$this->locationId = $this->db->insert_id;
		
		if (!$this->addRevision('add location')) return false;
		if (!$this->updateLocationRevision($this->locationId)) return false;
		if (!$this->copyToLocationHistory()) return false;
		if (!$this->updateRevisionLocationHistory($this->newRevisionId)) return false;
		
		$this->addOutputItem('newLocId', $this->locationId);
		$this->addOutputItem('success', True);
		return true;
	}
	
	
	public function doSetWorld ()
	{
		if ($this->worldId <= 0) return $this->reportError("Cannot create worlds yet!");
		if (!$this->initDatabaseWrite()) return false;
		
		if (!$this->CanViewWorldId($this->worldId)) return false;
		
		$query = "SELECT * FROM world WHERE id='{$this->worldId}'";
		$result = $this->db->query($query);
		$oldWorld = null;
		if ($result) $oldWorld = $result->fetch_assoc();
		
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
			//TODO: tilesX/Y, maxTilesX/Y, defaultZoom
		
			// Should enable this when editing for it is added on the client side
		//if ($this->worldDisplayData) $query .= ", displayData='{$this->worldDisplayData}' ";
		
		$query .= " WHERE id={$this->worldId};";
		
		$result = $this->db->query($query);
		
		if ($result === FALSE) {
			error_log($query);
			error_log($this->db->error);
			return $this->reportError("Failed to save world data!");
		}
		
		$query = "SELECT * FROM world WHERE id='{$this->worldId}'";
		$result = $this->db->query($query);
		$newWorld = null;
		if ($result) $newWorld = $result->fetch_assoc();
		
		$editAction = "edit world";
		if ($this->worldEnabled == 0) $editAction = "delete world";
		
		if (!$this->addRevision($editAction, $oldWorld, $newWorld)) return false;
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
	
	
	public function updateLocationRevision ($worldId)
	{
		$query = "UPDATE location SET revisionId={$this->newRevisionId} WHERE id={$worldId};";
	
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to update the location revision!");
	
		return true;
	}
	
	
	public function updateRevisionLocationHistory ($revisionId)
	{
		$query = "UPDATE revision SET locationHistoryId={$this->locationHistoryId} WHERE id={$revisionId};";
	
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to update the revision location history ID!");
	
		return true;
	}
	
	
	public function doSetLocation ()
	{
		if ($this->locationId <= 0) return $this->doAddLocation();
		if (!$this->initDatabaseWrite()) return false;
		
		if (!$this->CanViewWorldId($this->worldId)) return false;
		
		$query = "SELECT * FROM location WHERE id='{$this->locationId}';";
		$result = $this->db->query($query);
		$oldLocation = null;
		if ($result) $oldLocation = $result->fetch_assoc();
		
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
		
		$query = "SELECT * FROM location WHERE id='{$this->locationId}';";
		$result = $this->db->query($query);
		$newLocation = null;
		if ($result) $newLocation = $result->fetch_assoc();
		
		$editAction = "edit location";
		if ($this->locVisible == 0) $editAction = "delete location";
		
		if (!$this->addRevision($editAction, $oldLocation, $newLocation)) return false;
		if (!$this->updateLocationRevision($this->locationId)) return false;
		if (!$this->copyToLocationHistory()) return false;
		if (!$this->updateRevisionLocationHistory($this->newRevisionId)) return false;
		
		$this->addOutputItem('success', True);
		$this->addOutputItem('locationId', $this->locationId);
		return true;
	}
	
	
	public function doGetLocation ()
	{
		if ($this->locationId === 0) return $this->reportError("No location specified to retrieve data for!");
		if (!$this->initDatabase()) return false;
	
		$query  = "SELECT * from location WHERE " . $this->getEnabledQueryParam("visible") ." AND id=".$this->locationId." ";
		$query .= " LIMIT 1";
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve location data!");
	
		$locations = Array();
		$count = 0;
		$result->data_seek(0);
	
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['worldId'])) continue;
			
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
			settype($row['displayLevel'], "float");
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
		
		$query = "SELECT * from world WHERE " . $this->getEnabledQueryParam("enabled") . " AND ";
		
		if ($this->worldId > 0)
			$query .= "id=". $this->worldId .";";
		else if ($this->worldName != '')
			$query .= "name='". $this->worldName ."';";
		else
			return $this->reportError("World ID/name not specified!");
		
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve world data!");
		
		$worlds = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['id'])) continue;
				
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
			settype($row['defaultZoom'], "integer");
			settype($row['zoomOffset'], "float");
			settype($row['tilesX'], "integer");
			settype($row['tilesY'], "integer");
			settype($row['maxTilesX'], "integer");
			settype($row['maxTilesY'], "integer");
			
			$worlds[] = $row;
			$count += 1;
		}
	
		$this->addOutputItem("worlds", $worlds);
		$this->addOutputItem("worldCount", $count);
		return true;
	}
	
	
	public function getEnabledQueryParam ($label)
	{
		$result = "";
		
		if ($this->showHidden)
			$result = " 1 ";
		else
			$result = " $label <> 0";
			
		return $result;
	}
	
	
	public function doGetWorlds ()
	{
		if (!$this->initDatabase()) return false;
		
		$query = "SELECT * from world WHERE " . $this->getEnabledQueryParam("enabled") . ";";
		$result = $this->db->query($query);
		if ($result === FALSE) return $this->reportError("Failed to retrieve world data!" . $result);
		
		$worlds = Array();
		$count = 0;
		$result->data_seek(0);
		
		while ( ($row = $result->fetch_assoc()) )
		{
			if (!$this->CanViewWorldId($row['id'])) continue;
			
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
			settype($row['defaultZoom'], "integer");
			settype($row['zoomOffset'], "float");
			settype($row['tilesX'], "integer");
			settype($row['tilesY'], "integer");
			settype($row['maxTilesX'], "integer");
			settype($row['maxTilesY'], "integer");
			
			$worlds[] = $row;
			$count += 1;
		}
		
		$this->addOutputItem("worlds", $worlds);
		$this->addOutputItem("dbPrefix", $this->dbPrefix);
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
		
		if (!$this->CanViewWorldId($row['id'])) return $this->reportError("Permission Denied!");
		
		return $row['id'];
	}
	
	
	private function initDatabase ()
	{
		global $uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $uespGameMapDatabase;
		
		if ($this->dbReadInitialized || $this->dbWriteInitialized) return true;
		
		$database = $uespGameMapDatabase;
		if ($this->dbPrefix != "") $database = $uespGameMapDatabase . "_" . $this->dbPrefix;
		
		$this->db = new mysqli($uespGameMapReadDBHost, $uespGameMapReadUser, $uespGameMapReadPW, $database);
		if ($this->db->connect_error) return $this->reportError("Could not connect to mysql database!");
		
		$this->dbReadInitialized = true;
		$this->dbWriteInitialized = false;
		
		$this->db->set_charset("utf8");
		
		if ($this->skipCheckTables) return true;
		return $this->checkTables();
	}
	
	
	private function initDatabaseWrite ()
	{
		global $uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $uespGameMapDatabase;
		
		if (!$this->canEditMap($this->dbPrefix)) return $this->reportError('You do not have sufficient permissions!');
		
		if ($this->dbWriteInitialized) return true;
		
		if ($this->dbReadInitialized)
		{
			$this->db->close();
			unset($this->db);
			$this->db = null;
			$this->dbReadInitialized = false;
		}
		
		$database = $uespGameMapDatabase;
		if ($this->dbPrefix != "") $database = $uespGameMapDatabase . "_" . $this->dbPrefix; 
		
		$this->db = new mysqli($uespGameMapWriteDBHost, $uespGameMapWriteUser, $uespGameMapWritePW, $database);
		if ($this->db->connect_error) return $this->reportError("Could not connect to mysql database!");
		
		$this->dbReadInitialized = true;
		$this->dbWriteInitialized = true;
		
		$this->db->set_charset("utf8");
		
		if ($this->skipCheckTables) return true;
		return $this->checkTables();
	}
	
	
	private function parseInputParams ()
	{
		
		if (array_key_exists("db", $this->inputParams))
		{
			$dbPrefix = $this->inputParams['db'];
			
			switch ($dbPrefix)
			{
				case 'sr':
					$this->dbPrefix = "sr";
					break;
				case 'beyond':
					$this->dbPrefix = "beyond";
					break;
				case 'tr':
					$this->dbPrefix = "tr";
					break;
				case 'ob':
					$this->dbPrefix = "ob";
					break;
				case 'db':
					$this->dbPrefix = "db";
					break;
				case 'mw':
					$this->dbPrefix = "mw";
					break;
				case 'ptmw':
					$this->dbPrefix = "ptmw";
					break;
				case 'si':
					$this->dbPrefix = "si";
					break;
				case 'test':
					$this->dbPrefix = "test";
					break;
			}
		}
		
			//TODO: Need to change to write db connection afterwards if required
		if (!$this->initDatabase()) return false;
		
			//TODO: Better parameter handling
		if (array_key_exists('action', $this->inputParams)) $this->action = $this->db->real_escape_string(strtolower($this->inputParams['action']));
		
		$limitCount = 0;
		
		if (array_key_exists('top', $this->inputParams))
		{
			$this->limitTop = intval($this->inputParams['top']);
			if (!is_nan($this->limitTop)) ++$limitCount;
		}
		
		if (array_key_exists('left',$this->inputParams))
		{
			$this->limitLeft = intval($this->inputParams['left']);
			if (!is_nan($this->limitLeft)) ++$limitCount;
		}
		
		if (array_key_exists('bottom', $this->inputParams))
		{
			$this->limitBottom = intval($this->inputParams['bottom']);
			if (!is_nan($this->limitBottom)) ++$limitCount;
		}
		
		if (array_key_exists('right',$this->inputParams))
		{
			$this->limitRight = intval($this->inputParams['right']);
			if (!is_nan($this->limitRight)) ++$limitCount;
		}
		
		if ($limitCount == 4) $this->hasLimits = true;
		
		if (array_key_exists('zoom', $this->inputParams))
		{
			$this->limitDisplayLevel = intval($this->inputParams['zoom']);
			$this->hasDisplayLevel = $this->limitDisplayLevel > 0 && !is_nan($this->limitDisplayLevel);
		}
		
		if (array_key_exists('locid',  $this->inputParams)) $this->locationId = intval($this->inputParams['locid']);
		if (array_key_exists('incworld',  $this->inputParams)) $this->includeWorld = intval($this->inputParams['incworld']);
		if (array_key_exists('worldid',  $this->inputParams)) $this->worldId = intval($this->inputParams['worldid']);
		
		if (array_key_exists('displaylevel',  $this->inputParams)) 
		{
			$this->locDisplayLevel = floatval($this->inputParams['displaylevel']);
			if ($this->locDisplayLevel <  0) $this->locDisplayLevel = 0;
			if ($this->locDisplayLevel > 17) $this->locDisplayLevel = 17;
		}
		
		if (array_key_exists('visible',  $this->inputParams)) $this->locVisible = intval($this->inputParams['visible']);
		if (array_key_exists('destid',  $this->inputParams)) $this->locDestId = intval($this->inputParams['destid']);
		if (array_key_exists('x',  $this->inputParams)) $this->locX = intval($this->inputParams['x']);
		if (array_key_exists('y',  $this->inputParams)) $this->locY = intval($this->inputParams['y']);
		if (array_key_exists('locwidth',  $this->inputParams)) $this->locWidth = intval($this->inputParams['locwidth']);
		if (array_key_exists('locheight',  $this->inputParams)) $this->locHeight = intval($this->inputParams['locheight']);
		if (array_key_exists('loctype',  $this->inputParams)) $this->locType = intval($this->inputParams['loctype']);
		if (array_key_exists('icontype',  $this->inputParams)) $this->locIconType = intval($this->inputParams['icontype']);
		if (array_key_exists('name', $this->inputParams)) $this->locName = $this->db->real_escape_string($this->inputParams['name']);
		if (array_key_exists('description', $this->inputParams)) $this->locDescription = $this->db->real_escape_string($this->inputParams['description']);
		if (array_key_exists('wikipage', $this->inputParams)) $this->locWikiPage = $this->db->real_escape_string($this->inputParams['wikipage']);
		
		if (array_key_exists('displaydata', $this->inputParams)) 
		{
			$this->locDisplayData = $this->db->real_escape_string($this->inputParams['displaydata']);
			$this->worldDisplayData = $this->db->real_escape_string($this->inputParams['displaydata']);
		}
		
		if (array_key_exists('displayname', $this->inputParams)) $this->worldDisplayName = $this->db->real_escape_string($this->inputParams['displayname']);
		if (array_key_exists('missingtile', $this->inputParams)) $this->worldMissingTile = $this->db->real_escape_string($this->inputParams['missingtile']);
		if (array_key_exists('enabled',  $this->inputParams)) $this->worldEnabled = intval($this->inputParams['enabled']);
		if (array_key_exists('minzoom',  $this->inputParams)) $this->worldMinZoom = intval($this->inputParams['minzoom']);
		if (array_key_exists('maxzoom',  $this->inputParams)) $this->worldMaxZoom = intval($this->inputParams['maxzoom']);
		if (array_key_exists('zoomoffset',  $this->inputParams)) $this->worldZoomOffset = intval($this->inputParams['zoomoffset']);
		if (array_key_exists('posleft',  $this->inputParams)) $this->worldPosLeft = intval($this->inputParams['posleft']);
		if (array_key_exists('posright',  $this->inputParams)) $this->worldPosRight = intval($this->inputParams['posright']);
		if (array_key_exists('postop',  $this->inputParams)) $this->worldPosTop = intval($this->inputParams['postop']);
		if (array_key_exists('posbottom',  $this->inputParams)) $this->worldPosBottom = intval($this->inputParams['posbottom']);
		if (array_key_exists('parentid',  $this->inputParams)) $this->worldParentId = intval($this->inputParams['parentid']);
		if (array_key_exists('revisionid',  $this->inputParams)) $this->revisionId = intval($this->inputParams['revisionid']);
		
		if (array_key_exists('search',  $this->inputParams))
		{
			$this->unsafeSearch = urldecode($this->inputParams['search']);
			$this->search = $this->db->real_escape_string($this->unsafeSearch);
		}
		
		if (array_key_exists('searchtype',  $this->inputParams))
		{
			$this->unsafeSearchType = urldecode($this->inputParams['searchtype']);
			$this->searchType = intval($this->unsafeSearchType);
		}
		
		if (array_key_exists('centeron',  $this->inputParams)) $this->locCenterOn = $this->inputParams['centeron'];
		if (array_key_exists('showhidden',  $this->inputParams)) $this->showHidden = intval($$this->inputParams['showhidden']);
		if (array_key_exists('editorid',  $this->inputParams)) $this->cellResourceEditorId = $this->db->real_escape_string($this->inputParams['editorid']);
		
			// Unsure why these are not being replaced automatically
		$this->locCenterOn = urldecode($this->locCenterOn);
		//error_log("locCenterOn: {$this->locCenterOn}");
		//$this->locCenterOn = str_replace('+', ' ', $this->locCenterOn);
		//$this->locCenterOn = str_replace('%20', ' ', $this->locCenterOn);
		//$this->locCenterOn = str_replace('%27', "'", $this->locCenterOn);
		$this->locCenterOnRaw = $this->locCenterOn;
		$this->locCenterOn = $this->db->real_escape_string($this->locCenterOn);
		
		if (array_key_exists('world',  $this->inputParams))
		{
			$worldParam = $this->db->real_escape_string($this->inputParams['world']);
			$this->world = $worldParam;
			
			if (is_numeric($worldParam))
			{
				$this->worldId = intval($worldParam);
			}
			else
			{
				$this->worldName = $worldParam;
				$this->worldName = str_replace('+', ' ', $this->worldName);
				$this->worldName = str_replace('%20', ' ', $this->worldName);
				$this->worldName = str_replace('%27', "\'", $this->worldName);
				$this->world = $this->worldName;
				$this->worldName = strtolower($this->worldName);
			}
	
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
		
		if ($this->action == 'default' && $this->search != '') $this->action = 'search';
		
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
		ob_start("ob_gzhandler");
		
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

