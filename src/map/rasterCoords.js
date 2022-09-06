/**
 * leaflet plugin for plain image map projection
 * @copyright 2016- commenthol
 * @license MIT
 * @link https://github.com/commenthol/leaflet-rastercoords
 */
/* globals define */
/* eslint no-var:off */

export default class RasterCoords {
	/**
	 * RasterCoords
	 * @param {L.map} map - the map used
	 * @param {Array} imgsize - [ width, height ] image dimensions
	 * @param {Number} [tilesize] - tilesize in pixels. Default=256
	 */
	constructor(map, imgsize, tilesize) {
	
		if (typeof window.L === 'undefined') {
			throw new Error('Leaflet must be loaded first')
		}

		this.map = map
		this.width = imgsize[0]
		this.height = imgsize[1]
		this.tilesize = tilesize || 256
		this.zoom = this.getZoomLevel()
		
		if (this.width && this.height) {
			this.setMaxBounds()
		}
  	}

	/**
     * calculate accurate zoom level for the given image size
     */
	getZoomLevel() {
		return Math.ceil(Math.log(Math.max(this.width, this.height) / this.tilesize ) / Math.log(2))
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
		return this.map.project(coords, this.zoom)
	}

	/**
     * get the max bounds of the image
     */
	getMaxBounds() {
		let southWest = this.unproject([0, this.height])
		let northEast = this.unproject([this.width, 0])
		return new L.LatLngBounds(southWest, northEast)
	}

	/**
     * sets the max bounds on map
     */
	setMaxBounds() {
		let bounds = this.getMaxBounds()
		this.map.setMaxBounds(bounds)
	}
}

