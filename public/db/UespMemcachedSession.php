<?php
/*
 * A very basic class that lets code access MediaWiki's SESSION variables saved in UESP's memcached.
 *
 */



// return local secrets file if debug or hosted version if release
if (in_array($_SERVER['REMOTE_ADDR'], array('127.0.0.1', '::1', "localhost"))) {
    require '../../../secrets/uespservers.secrets';
} else {
	require_once("/home/uesp/secrets/uespservers.secrets");
}

//error_reporting(-1);

if (!class_exists("UespMemcachedSession"))
{

class UespMemcachedSession
{
		/* Should match the MediaWiki settings */
	public static $UESP_DBNAME = 'uesp_net_wiki5';
	public static $UESP_MEMCACHED_HOST =  "10.12.222.22";	//Reset in install() to global
	public static $UESP_MEMCACHED_PORT = 11000;
	
	public static $MEMCACHE = null;
	
	public static $DEBUG = false;
	public static $RESTORE_SESSION = false;
	
	public static $SESSION_ID = '';
	
	
	static function install($dbname)
	{
		global $UESP_SERVER_MEMCACHED;
		
		if (self::$DEBUG) error_log("UespMemcachedSession::install");
		
		if ($dbname) self::$UESP_DBNAME = $dbname;
		
		self::$UESP_MEMCACHED_HOST = $UESP_SERVER_MEMCACHED;
		
		session_set_save_handler(
			array( __CLASS__, 'open' ),
			array( __CLASS__, 'close' ),
			array( __CLASS__, 'read' ),
			array( __CLASS__, 'write' ),
			array( __CLASS__, 'destroy' ),
			array( __CLASS__, 'gc' ) );
		
		register_shutdown_function( 'session_write_close' );
	}
	
	
	static function connect()
	{
		if (self::$DEBUG) error_log("UespMemcachedSession::connect");
		self::$MEMCACHE = new Memcache;
		self::$MEMCACHE->connect(self::$UESP_MEMCACHED_HOST, self::$UESP_MEMCACHED_PORT);
	}
	
	
	static function getKey( /* ... */ )
	{
		$args = func_get_args();
		$key = self::$UESP_DBNAME;
		
		foreach ( $args as $arg ) {
			$arg = str_replace( ':', '%3A', $arg );
			$key = $key . ':' . $arg;
		}
		
		$key = str_replace( ' ', '_', $key );
		
		if (self::$DEBUG) error_log("UespMemcachedSession::getKey = $key");
		return $key;
	}
	
	
	static function open( $save_path, $session_name )
	{
		if (self::$DEBUG) error_log("UespMemcachedSession::open '$save_path' '$session_name'");
		return true;
	}
	
	
	static function close()
	{
		if (self::$DEBUG) error_log("UespMemcachedSession::close");
		return true;
	}
	
	
	static function readKey($key)
	{
		if (self::$DEBUG) error_log("UespMemcachedSession::readKey $key");
		
		$data = UespMemcachedSession::read(session_id());
		
		if (!array_key_exists($key, $data))
		{
			if (self::$DEBUG) error_log("UespMemcachedSession::readKey = NULL");
			return null;
		}
		
		$data = $data[$key];
		if (self::$DEBUG) error_log("UespMemcachedSession::readKey = $data");
		return $data;
	}
	
	
	static function read( $id )
	{
		if (self::$DEBUG) error_log("UespMemcachedSession::read $id");
		if (self::$MEMCACHE == null) self::connect();
		
			//Restore lost session in PHP 7.4 if needed
		if ($id != "")
		{
			if (self::$DEBUG) error_log("UespMemcachedSession::saving session id");
			self::$SESSION_ID = $id;
		}
		elseif (self::$RESTORE_SESSION && self::$SESSION_ID != "")
		{
			$id = self::$SESSION_ID;
			if (self::$DEBUG) error_log("UespMemcachedSession::read Restoring session $id");
			session_id($id);
		}
		
		//$key = self::getKey( 'session', $id );	//Pre MW 1.27
		$key = self::getKey( 'MWSession', $id );
		
		$data = self::$MEMCACHE->get($key);
		
		if ( $data === false ) {
			if (self::$DEBUG) error_log("UespMemcachedSession::read = NULL1");
			return array();
		}
		
		if ( $data['data'] == null) {
			if (self::$DEBUG) error_log("UespMemcachedSession::read = NULL2");
			return array();
		}
		
		$d = print_r( $data['data'], true);
		if (self::$DEBUG) error_log("UespMemcachedSession::read = " . $d);
		
		return $data['data'];
	}
	
	
	static function write( $id, $data )
	{
		if (self::$DEBUG) error_log("UespMemcachedSession::write");
		//Not implemented
		return false;
	}


	static function destroy( $id )
	{
		if (self::$DEBUG) error_log("UespMemcachedSession::destroy");
		//Not implemented
		return true;
	}


	static function gc( $maxlifetime )
	{
		if (self::$DEBUG) error_log("UespMemcachedSession::gc");
		return true;
	}

};

}
