(function (factory, window) {
    if (typeof define === 'function' && define.amd) {
      define(['leaflet'], factory);
    } else if (typeof exports === 'object') {
      module.exports = factory(require('leaflet'));
    }
    if (typeof window !== 'undefined' && window.L) {
      window.L.DoubleTouchDragZoom = factory(L);
    }
  }(function (L) {
    var Map = L.Map;
    var Handler = L.Handler;
    var DomEvent = L.DomEvent;
    var DomUtil = L.DomUtil;
    var Util = L.Util;
    var Point = L.Point;
  
    /*
     * L.Handler.DoubleTouchDragZoom is used by L.Map to add one finger zoom on supported browsers.
     */
  
    // @namespace L.Map
    // @section Interaction Options
    Map.mergeOptions({
      // @section Touch interaction options
      // @option doubleTouchDragZoom: Boolean|String = *
      // Whether the map can be zoomed in by double touch dragging down or
      // zoomed out by double touch dragging up with one finger. If
      // passed `'center'`, it will zoom to the center of the view regardless of
      // where the touch event was. Enabled for touch-capable web
      // browsers except for old Androids.
      doubleTouchDragZoom: false,
      // @option doubleTouchDragZoomDelay: Number = 300
      // Maximum delay between touches to trigger double touch.
      doubleTouchDragZoomDelay: 300,
      // @option doubleTouchDragZoomInvert: Boolean = false
      // Invert dragging directions for zoom in/out.
      doubleTouchDragZoomInvert: false,
      // @option doubleTouchDragZoomScaleFactor: Number = 100
      // Zooming sensitivity to vertical dragging (high < 100 < low).
      doubleTouchDragZoomScaleFactor: 100
    });
  
    var DoubleTouchDragZoom = Handler.extend({
      addHooks: function () {
        DomUtil.addClass(this._map._container, 'leaflet-double-touch-drag-zoom');
        DomEvent.on(this._map._container, 'touchstart', this._onTouchStart, this);
      },
  
      removeHooks: function () {
        DomUtil.removeClass(this._map._container, 'leaflet-double-touch-drag-zoom');
        DomEvent.off(this._map._container, 'touchstart', this._onTouchStart, this);
      },
  
      _disableHandlers: function () {
        var map = this._map;
  
        if (map.dragging.enabled()) {
          map.dragging.disable();
          this._draggingDisabled = true;
        }
  
        if (map.doubleClickZoom.enabled()) {
          map.doubleClickZoom.disable();
          this._doubleClickZoomDisabled = true;
        }
      },
  
      _enableHandlers: function () {
        var map = this._map;
  
        if (this._draggingDisabled === true) {
          map.dragging.enable();
        }
  
        if (this._doubleClickZoomDisabled === true) {
          map.doubleClickZoom.enable();
        }
      },
  
      _onTouchStart: function (e) {
        if (!e.touches || e.touches.length !== 1 || this._map._animatingZoom || this._zooming) { return; }
  
        this._touch = true;
        var now = Date.now();
        this._doubleTouch = this._lastTouchTime && ((now - this._lastTouchTime) <= this._map.options.doubleTouchDragZoomDelay);
  
        if (this._doubleTouch) {
          DomUtil.addClass(this._map._container, 'leaflet-double-touch');
  
          this._startPoint = this._map.mouseEventToContainerPoint(e.touches[0]);
          this._startTouch = e.touches[0];
          this._centerPoint = this._map.getSize()._divideBy(2);
          this._startLatLng = this._map.containerPointToLatLng(this._centerPoint);
  
          if (this._map.options.doubleTouchDragZoom !== 'center') {
            this._doubleTouchStartLatLng = this._map.containerPointToLatLng(this._startPoint);
          }
  
          this._startZoom = this._map.getZoom();
  
          this._moved = false;
          this._zooming = true;
  
          this._map._stop();
  
          DomEvent.on(document, 'touchmove', this._onTouchMove, this);
          DomEvent.on(document, 'touchend', this._onTouchEnd, this);
        }
  
        this._lastTouchTime = now;
      },
  
      _onTouchMove: function (e) {
        if (!e.touches || e.touches.length !== 1 || !this._zooming) { return; }
  
        if (this._doubleTouch) {
  
          if (!this._moved) {
            this._disableHandlers();
            DomUtil.addClass(this._map._container, 'leaflet-double-touch-drag');
          }
  
          var map = this._map;
          var p = map.mouseEventToContainerPoint(e.touches[0]);
          var py = this._map.options.doubleTouchDragZoomInvert ? this._startPoint.y - p.y : p.y - this._startPoint.y;
          var scale = Math.exp(py / this._map.options.doubleTouchDragZoomScaleFactor);
          this._zoom = map.getScaleZoom(scale, this._startZoom);
  
          if (!map.options.bounceAtZoomLimits && (
              (this._zoom < map.getMinZoom() && scale < 1) ||
              (this._zoom > map.getMaxZoom() && scale > 1))) {
            this._zoom = map._limitZoom(this._zoom);
          }
  
          if (map.options.doubleTouchDragZoom === 'center') {
            this._center = this._startLatLng;
            if (scale === 1) { return; }
          } else {
            var delta = (new Point(this._startPoint.x, this._startPoint.y))._subtract(this._centerPoint);
            if (scale === 1 && delta.x === 0 && delta.y === 0) { return; }
            this._center = map.unproject(map.project(this._doubleTouchStartLatLng, this._zoom).subtract(delta), this._zoom);
          }
  
          if (!this._moved) {
            map._moveStart(true, false);
            this._moved = true;
          }
  
          Util.cancelAnimFrame(this._animRequest);
          var moveFn = Util.bind(map._move, map, this._center, this._zoom, {pinch: true, round: false});
          this._animRequest = Util.requestAnimFrame(moveFn, this, true);
        }
      },
  
      _onTouchEnd: function () {
        if (!this._touch) { return; }
  
        var map = this._map;
  
        if (this._doubleTouch) {
          DomUtil.removeClass(this._map._container, 'leaflet-double-touch-drag');
          DomUtil.removeClass(this._map._container, 'leaflet-double-touch');
          DomEvent.off(document, 'touchmove', this._onTouchMove, this);
          DomEvent.off(document, 'touchend', this._onTouchEnd, this);
  
          if (!this._moved || !this._zooming) {
            this._zooming = false;
            return;
          }
  
          this._doubleTouch = false;
          this._moved = false;
          this._zooming = false;
          Util.cancelAnimFrame(this._animRequest);
  
          if (!this._center) { return; }
  
          var zoomend = function () {
            this._enableHandlers();
            DomEvent.off(map, 'zoomend', zoomend, this);
          };
          DomEvent.on(map, 'zoomend', zoomend, this);
  
          if (map.options.doubleTouchDragZoom === 'center') {
            map.setZoom(map._limitZoom(this._zoom));
          } else {
            map.setZoomAround(this._startPoint, map._limitZoom(this._zoom));
          }
          this._center = null;
        }
        this._touch = false;
        this._map.setZoom(this._map.getZoom(), {animate: false}); // fix bug with pan being stuck on mobile
      }
    });
  
    // @section Handlers
    // @property doubleTouchDragZoom: Handler
    // Double touch zoom handler.
    Map.addInitHook('addHandler', 'doubleTouchDragZoom', DoubleTouchDragZoom);
  
    return DoubleTouchDragZoom;
  }, window));
  