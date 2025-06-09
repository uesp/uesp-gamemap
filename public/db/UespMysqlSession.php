<?php
/*
 * A very basic class that lets code access MediaWiki's SESSION variables saved in UESP's wiki MySQL database.
 *
 */


// return local secrets file if debug or hosted version if release
if (in_array($_SERVER['REMOTE_ADDR'], array('127.0.0.1', '::1', "localhost")))
{
	require_once('../../../secrets/uespservers.secrets');
	require_once('../../../secrets/wiki.secrets');
} else
{
	require_once("/home/uesp/secrets/uespservers.secrets");
	require_once("/home/uesp/secrets/wiki.secrets");
}

//error_reporting(-1);

if (!class_exists("UespMysqlSession"))
{
	class UespMysqlSession implements SessionHandlerInterface
	{
			//sfwiki:MWSession:...........................
		public static $SESSION_PREFIX = "uesp_net_wiki5";
		public static $SESSION = null;
		public $db = null;
		
		
		static function install($dbname = "uesp_net_wiki5")
		{
			global $UESP_SERVER_MEMCACHED;
			
			if ($dbname) self::$SESSION_PREFIX = $dbname;
			//error_log("UespMysqlSession::install($dbname)");
			
			self::$SESSION = new UespMysqlSession();
			session_set_save_handler(self::$SESSION, true );
		}
		
		
		public static function readKey($key)
		{
			if (self::$SESSION == null) 
			{
				//error_log("UespMysqlSession::readKey($key) - No Session Handler Installed!");
				return "";
			}
			
			$SESSION = self::$SESSION;
			$data = $SESSION->read(session_id());
			
			if ($data == "" || $data == null || $data['data'] == null)
			{
				//error_log("UespMysqlSession::readKey($key) - No session data read!");
				return "";
			}
			
			$data = $data['data'];
			
			if ($data[$key] == null) 
			{
				//error_log("UespMysqlSession::readKey($key) - Session data does not have key!");
				return "";
			}
			
			return $data[$key];
		}
		
		
		public function open($savePath, $sessionName): bool
		{
			global $UESP_SERVER_DB1;
			global $uespWikiDB;
			global $uespWikiUser;
			global $uespWikiPW;
			
			//error_log("UespMysqlSession::open($savePath, $sessionName)");
			
			$this->db = new mysqli($UESP_SERVER_DB1, $uespWikiUser, $uespWikiPW, $uespWikiDB);
			
			if ($this->db->connect_errno)
			{
				return false;
			}
			
			return true;
		}
		
		
		public function close(): bool
		{
			return true;
		}
		
		
		public function read($id)
		{
			//error_log("UespMysqlSession::read($id)");
			
			$cleanId = str_replace( ':', '%3A', $id );
			$fullId = self::$SESSION_PREFIX . ":MWSession:" . $cleanId;
			$safeId = $this->db->real_escape_string($fullId);
			
			$query = "SELECT * FROM objectcache WHERE keyname='$safeId';";
			$result = $this->db->query($query);
			
			if ($result === false)
			{
				//error_log("UespMysqlSession::read($id) = MySQL Error : $query");
				return "";
			}
			
			$row = $result->fetch_assoc();
			
			if ($row == null) 
			{
				//error_log("UespMysqlSession::read($id) = No Rows : $query");
				return "";
			}
			
			$rawValue = $row['value']; 
			
			if ( function_exists( 'gzinflate' ) )
			{
				$decomp = gzinflate( $rawValue );
				if ( false !== $decomp ) $rawValue = $decomp;
			}
			
			//error_log("UespMysqlSession::read($id) = $rawValue");
			
			$value = unserialize( $rawValue);
			return $value;
		}
		
		
		public function write($id, $data): bool
		{
			//Not implemented
			return true;
		}
		
		
		public function destroy($id): bool
		{
			//Not implemented
			return true;
		}
		
		
		public function gc($maxlifetime)
		{
			//Not implemented
			return true;
		}
		
		
		public static function test()
		{
			global $UESP_SERVER_DB1;
			global $uespWikiDB;
			global $uespWikiUser;
			global $uespWikiPW;
			
			$db = new mysqli($UESP_SERVER_DB1, $uespWikiUser, $uespWikiPW, $uespWikiDB);
			
			if ($db->connect_errno)
			{
				print("DB connection error!\n");
				return false;
			}
			
			//$result = $db->query("SELECT * FROM objectcache WHERE keyname='mw-tor-list-status';");
			$result = $db->query("SELECT * FROM objectcache WHERE keyname='uesp_net_wiki5:abusefilter:stats:total:default';");
			
			if ($result === false)
			{
				print("Test Query Error!\n");
				return false;
			}
			
			$row = $result->fetch_assoc();
			
			if ($row == null)
			{
				print("No Row Data!\n");
				return false;
			}
			
			$rawValue = $row['value']; 
			
			if ( function_exists( 'gzinflate' ) )
			{
				$decomp = gzinflate( $rawValue );
				if ( false !== $decomp ) $rawValue = $decomp;
			}
			
			$value = unserialize( $rawValue);
			$r = print_r($value, true);
			print("Value = $r\n");
			
			$db->close();
			return true;
		}
	};
};

