/*
  Generic Canvas Overlay for leaflet.

  ** Requires **
  - Leaflet 1.0.0rc1 or later

  ** Copyright **
  (C) 2014 Stanislav Sumbera
  - http://blog.sumbera.com/2014/04/20/leaflet-canvas/

  ** Maintained by **
  (C) 2015-16 Alexander Schoedon <schoedon@uni-potsdam.de>

  All rights reserved.

  ** Credits **

  Inspired by Stanislav Sumbera's Leaflet Canvas Overlay.
  - http://blog.sumbera.com/2014/04/20/leaflet-canvas/

  Inspired and portions taken from Leaflet Heat.
  - https://github.com/Leaflet/Leaflet.heat

*/

/**
 * Leaflet canvas overlay class
 */
 L.CanvasOverlay = L.Layer.extend({

    initialize: function(userDrawFunc, options) {
      this._userDrawFunc = userDrawFunc;
      L.setOptions(this, options);
    },

    params:function(options){
      L.setOptions(this, options);
      return this;
    },

    drawing: function(userDrawFunc) {
      this._userDrawFunc = userDrawFunc;
      return this;
    },

    canvas: function() {
      return this._canvas;
    },

    redraw: function() {
      if (!this._frame) {
        this._frame = L.Util.requestAnimFrame(this._redraw, this);
      }
      return this;
    },

    onAdd: function(map) {
      this._map = map;
      this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-overlay cellGrid');

      var size = this._map.getSize();
      this._canvas.width = size.x;
      this._canvas.height = size.y;

      var animated = this._map.options.zoomAnimation;
      L.DomUtil.addClass(this._canvas, 'leaflet-zoom-'
        + (animated ? 'animated' : 'hide'));

      map._panes.overlayPane.appendChild(this._canvas);

      map.on('zoom', this._reset, this);
      map.on('resize', this._reset, this);


      this._reset();
    },

    onRemove: function(map) {
      map.getPanes().overlayPane.removeChild(this._canvas);

      map.off('zoom', this._reset, this);
      map.off('resize', this._reset, this);

      this_canvas = null;
    },

    addTo: function(map) {
      map.addLayer(this);
      return this;
    },

    _reset: function() {
      var topLeft = this._map.latLngToLayerPoint([0, 0]);
      L.DomUtil.setPosition(this._canvas, topLeft);
      this._redraw();
    },

    _redraw: function () {
      let map = this._map;
      var bounds = this.options.bounds || this._map.getBounds();

      let minX = map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthWest())).x;
      let maxX = map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthEast())).x;
      let minY = map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getNorthEast())).y;
      let maxY = map.layerPointToContainerPoint(map.latLngToLayerPoint(bounds.getSouthEast())).y;
      this._canvas.width = maxX - minX;
      this._canvas.height = maxY - minY;

      var size = { x: this._canvas.width, y: this._canvas.height };

      var zoomScale = (size.x * 180) / (20037508.34 * (bounds.getEast()
        - bounds.getWest())); // resolution = 1/zoomScale
      var zoom = this._map.getZoom();

      if (this._userDrawFunc) {
        this._userDrawFunc(this, {
          canvas: this._canvas,
          bounds: bounds,
          size: size,
          zoomScale: zoomScale,
          zoom: zoom,
          options: this.options
        });
      }

      this._frame = null;
    },

    _animateZoom: function (e) {
      var scale = this._map.getZoomScale(e.zoom),
        offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale)
          .subtract(this._map._getMapPanePos());

      this._canvas.style[L.DomUtil.TRANSFORM]
        = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
    },
  });


  /**
   * A wrapper function to create a canvas overlay object.
   *
   * @param {String} userDrawFunc the custom draw callback
   * @param {Array} options an array of options for the overlay
   * @return {Object} a canvas overlay object
   */
  L.canvasOverlay = function (userDrawFunc, options) {
    return new L.CanvasOverlay(userDrawFunc, options);
  };


