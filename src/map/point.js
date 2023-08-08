
/**
 * @name point.js
 * @author Thal-J <thal-j@uesp.net> (23rd Sept 2022)
 * @summary Simple position/point class.
 */

const ZERO = 0.0001; // define 0 as not quite 0 to prevent divide by 0 errors

export default class Point {
    constructor(x, y, coordType) {
        this.x = (x) ? isNaN(x) ? ZERO : (x != 0) ? Number(x) : ZERO : ZERO;
        this.y = (y) ? isNaN(y) ? ZERO : (y != 0) ? Number(y) : ZERO : ZERO;
        this.coordType = coordType;
    }

    toArray() {
        return [this.x, this.y];
    }
}