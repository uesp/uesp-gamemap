
/**
 * @name point.js
 * @author Thal-J <thal-j@uesp.net> (23rd Sept 2022)
 * @summary Simple position/point class.
 */

export default class Point {
    constructor(x, y, coordType) {
        this.x = Number(x) ?? 0;
        this.y = Number(y) ?? 0;
        this.coordType = coordType;
    }

    toArray() {
        return [this.x, this.y];
    }
}