/**
 * @name mapPosition.js
 * @author Thal-J <thal-j@uesp.net> (2nd Sept 2022)
 * @summary Simple position/point class.
 */

export default class Position {
    constructor(x, y) {
        this.x = (typeof x !== 'undefined') ? x : 0;
        this.y = (typeof y !== 'undefined') ? y : 0;
    }
}