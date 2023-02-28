
/**
 * @name point.js
 * @author Thal-J <thal-j@uesp.net> (23rd Sept 2022)
 * @summary Simple position/point class.
 */

export default class Point {
    constructor(x, y, coordType, zoom) {
        this.x = (typeof x !== 'undefined') ? x : 0;
        this.y = (typeof y !== 'undefined') ? y : 0;
        this.zoom = (typeof zoom !== 'undefined') ? zoom : 2;
        this.coordType = (typeof coordType !== 'undefined') ? coordType : null;
    }

    toArray() {
        return [this.x, this.y];
    }
}