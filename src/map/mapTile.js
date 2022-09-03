/**
 * @name mapTile.js
 * @author Thal-J <thal-j@uesp.net> (3rd Sept 2022)
 * @summary Simple map tile class.
 */

 export default class MapTile {
    constructor(x, y) {
        this.element = null;
        this.deltaTileX = (typeof x !== 'undefined') ? x : 0;
        this.deltaTileY = (typeof y !== 'undefined') ? y : 0;
    }
}
