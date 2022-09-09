<?php
/*
 * A very basic class that lets code access MediaWiki's SESSION variables saved in UESP's memcached.
 * 
 */

require_once("/home/uesp/secrets/uespservers.secrets");

if (!class_exists("UespMemcachedSession"))
{

class UespMemcachedSession
{
	
		/* Should match the MediaWiki settings */
	public static $UESP_DBNAME = 'uesp_net_wiki5';
	public static $UESP_MEMCACHED_HOST = '10.12.222.22';
	public static $UESP_MEMCACHED_PORT = 11000;
	
	public static $MEMCACHE = null;
	
		
	static function install()
	{
		global $UESP_SERVER_MEMCACHED;
		
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
		return $key;
	}
	
	
	static function open( $save_path, $session_name )
	{
		return true;
	}
	
	
	static function close()
	{
		return true;
	}
	
	
	static function readKey($key) 
	{
		$data = UespMemcachedSession::read(session_id());
		return $data[$key];
	}
	
	
	static function read( $id )
	{
		if (self::$MEMCACHE == null) self::connect();
		
		//$key = self::getKey( 'session', $id );	//Pre MW 1.27
		$key = self::getKey( 'MWSession', $id );
		
		$data = self::$MEMCACHE->get($key);
		
		if ( $data === false ) return array();
		if ( $data['data'] == null) return array();
		return $data['data'];
	}
	
	static function write( $id, $data )
	{
		//Not implemented
		return false;
	}
	
	
	static function destroy( $id ) 
	{
		//Not implemented
		return true;
	}
	
	
	static function gc( $maxlifetime )
	{
		return true;
	}
	
};

}
