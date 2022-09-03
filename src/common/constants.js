/**
 * @name constants.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Contains general constants to be re-used throughout the gamemap.
 */

 import * as Utils from "./utils.js";

 export const ASSETS_DIR = "assets/";
 export const CONFIG_DIR = ASSETS_DIR + "configs/";
 export const TEMPLATES_DIR = ASSETS_DIR + "templates/";
 export const ICONS_DIR = ASSETS_DIR + "icons/";
 export const IMAGES_DIR = ASSETS_DIR + "images/";

 export const CSS_OVERRIDE_FILENAME = "override.css"
 export const MAP_CONFIG_FILENAME = "config.json"
 export const DEFAULT_MAP_CONFIG_DIR = CONFIG_DIR + "default_" + MAP_CONFIG_FILENAME;

 export const GAME_DATA_SCRIPT = "gamemap.php";

// get default map config
 Utils.getJSON(DEFAULT_MAP_CONFIG_DIR, function(error, mapConfig) {
    if (error == null) {
        window.DEFAULT_MAP_CONFIG = mapConfig;
    } else {
        print("There was an error setting the default map config constant. " + error);
    }
})

export const GAMEMAP_ROOT_NAME = "gmMapRoot";

