
/**
 * @name point.js
 * @author Thal-J <thal-j@uesp.net> (23rd Sept 2022)
 * @summary Simple position/point class.
 */

export default class Point {
    constructor(x, y, coordType, zoom) {
        this.x = x ?? 0;
        this.y = y ?? 0;
        this.zoom = zoom ?? 2;
        this.coordType = coordType;
    }

    toArray() {
        return [this.x, this.y];
    }
}