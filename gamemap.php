<?php 
/*
 * gamemap.php -- Created by Dave Humphrey (dave@uesp.net) on 23 Jan 2014
 * 		Released under the GPL v2
 *		Main server side application for the game map system.
 *
 */


class GameMap
{
	
	public $inputParams = array();
	
	function __construct() {
		$this->inputParams = $_REQUEST;
	}
	
	
	public function parseInputParams()
	{
		
	}
	
}

$g_GameMap = GameMap();


?>