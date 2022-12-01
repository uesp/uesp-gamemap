/**
 * leaflet plugin for plain image map projection
 * @copyright 2016 - commenthol
 * @license MIT
 * @link https://github.com/commenthol/leaflet-rastercoords
 */

export default class RasterCoords {
	/**
	 * RasterCoords
	 * @param {L.map} map - the leaflet map object used
	 * @param {Object} mapImage - object representing the whole image of the map & dimensions
	 * @param {Number} [tileSize] - the size of the map tiles in pixels. default is 256.
	 */
	constructor(map, mapImage, tileSize) {

		if (typeof window.L === 'undefined') {
			throw new Error('Leaflet must be loaded first');
		}

		this.map = map;
		this.width = mapImage.width;
		this.height = mapImage.height;
		this.tileSize = tileSize || 256;
		this.zoom = this.getZoomLevel();

		if (this.width && this.height) {
			this.setMaxBounds();
		}
  	}

	/**
     * calculate accurate zoom level for the given image size
     */
	getZoomLevel() {
		return Math.ceil(Math.log(Math.max(this.width, this.height) / this.tileSize ) / Math.log(2));
	}

	/**
     * unproject `coords` to the raster coordinates used by the raster image projection
     * @param {Array} coords - [ x, y ]
     * @return {L.LatLng} - internal coordinates
     */
	unproject(coords) {
		return this.map.unproject(coords, this.zoom);
	}

	/**
     * project `coords` back to image coordinates
     * @param {Array} coords - [ x, y ]
     * @return {L.LatLng} - image coordinates
     */
	project(coords) {
		return this.map.project(coords, this.zoom);
	}

	/**
     * get the max bounds of the image
     */
	getMaxBounds() {
		let southWest = this.unproject([0, this.height]);
		let northEast = this.unproject([this.width, 0]);
		return new L.LatLngBounds(southWest, northEast);
	}

	/**
     * get the max bounds of the image with some additional padding
    */
	getMaxBoundsWithPadding(){

		let bounds = this.getMaxBounds();
		let southWest = bounds._southWest;
		let northEast = bounds._northEast;

		const PADDING = 145;

		log(northEast);

		southWest.lng = southWest.lng - PADDING;
		southWest.lat = southWest.lat - PADDING;
		northEast.lng = northEast.lng + PADDING;
		northEast.lat = northEast.lat + PADDING;

		return new L.LatLngBounds(southWest, northEast);
	}

	/**
     * sets the max bounds on map
     */
	setMaxBounds() {
		let bounds = this.getMaxBounds();
		this.map.setMaxBounds(bounds);
	}
}

