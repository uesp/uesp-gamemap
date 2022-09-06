/**
 * @name bounds.js
 * @author Thal-J <thal-j@uesp.net> (3rd Sept 2022)
 * @summary Class that defines the boundaries of the gamemap.
 */

export default class Bounds {
    constructor(left, top, right, bottom) {
	this.left   = (typeof left   === 'undefined' || left   === null) ? 0 : left;
	this.right  = (typeof right  === 'undefined' || right  === null) ? 0 : right;
	this.top    = (typeof top    === 'undefined' || top    === null) ? 0 : top;
	this.bottom = (typeof bottom === 'undefined' || bottom === null) ? 0 : bottom;
    }
}

