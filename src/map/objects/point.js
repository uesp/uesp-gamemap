
/**
 * @name point.js
 * @author Thal-J <thal-j@uesp.net> (23rd Sept 2022)
 * @summary Simple position/point class.
 */

export default class Point {
    constructor(x, y) {
        this.x = (typeof x !== 'undefined') ? x : 0;
        this.y = (typeof y !== 'undefined') ? y : 0;
        this.zoom = (typeof z !== 'undefined') ? z : 0;
        this.coordType = null;
    }

    toArray() {
        return [this.x, this.y];
    }
}