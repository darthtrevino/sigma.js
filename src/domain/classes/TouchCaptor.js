import Dispatcher from "./Dispatcher";
import doubleClick from "../utils/events/doubleClick";
import unbindDoubleClick from "../utils/events/unbindDoubleClick";
import mouseCoords from "../utils/events/mouseCoords";
import getCenter from "../utils/events/getCenter";
import getOffset from "../utils/events/getOffset";
import zoomTo from "../utils/misc/zoomTo";

export default function touchCaptor(sigma) {
  /**
   * The user inputs default captor. It deals with mouse events, keyboards
   * events and touch events.
   *
   * @param  {DOMElement}   target   The DOM element where the listeners will be
   *                                 bound.
   * @param  {camera}       camera   The camera related to the target.
   * @param  {configurable} settings The settings function.
   * @return {captor}          The fresh new captor instance.
   */
  return function TouchCaptor(target, camera, settings) {
    const _self = this;

    const _target = target;

    const _camera = camera;

    const _settings = settings;

    // CAMERA MANAGEMENT:
    // ******************
    // The camera position when the user starts dragging:

    let _startCameraX;

    let _startCameraY;

    let _startCameraAngle;

    let _startCameraRatio;

    // The latest stage position:

    let _lastCameraX;

    let _lastCameraY;

    let _lastCameraAngle;

    let _lastCameraRatio;

    // TOUCH MANAGEMENT:
    // *****************
    // Touches that are down:

    let _downTouches = [];

    let _startTouchX0;

    let _startTouchY0;

    let _startTouchX1;

    let _startTouchY1;

    let _startTouchAngle;

    let _startTouchDistance;

    let _touchMode;

    let _isMoving;

    let _doubleTap;

    let _movingTimeoutId;

    Dispatcher.extend(this);

    doubleClick(_target, "touchstart", _doubleTapHandler);
    _target.addEventListener("touchstart", _handleStart, false);
    _target.addEventListener("touchend", _handleLeave, false);
    _target.addEventListener("touchcancel", _handleLeave, false);
    _target.addEventListener("touchleave", _handleLeave, false);
    _target.addEventListener("touchmove", _handleMove, false);

    function position(e) {
      const offset = getOffset(_target);

      return {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top
      };
    }

    /**
     * This method unbinds every handlers that makes the captor work.
     */
    this.kill = function kill() {
      unbindDoubleClick(_target, "touchstart");
      _target.addEventListener("touchstart", _handleStart);
      _target.addEventListener("touchend", _handleLeave);
      _target.addEventListener("touchcancel", _handleLeave);
      _target.addEventListener("touchleave", _handleLeave);
      _target.addEventListener("touchmove", _handleMove);
    };

    // TOUCH EVENTS:
    // *************
    /**
     * The handler listening to the 'touchstart' event. It will set the touch
     * mode ("_touchMode") and start observing the user touch moves.
     *
     * @param {event} e A touch event.
     */
    function _handleStart(e) {
      if (_settings("touchEnabled")) {
        let x0;
        let x1;
        let y0;
        let y1;
        let pos0;
        let pos1;

        _downTouches = e.touches;

        switch (_downTouches.length) {
          case 1:
            _camera.isMoving = true;
            _touchMode = 1;

            _startCameraX = _camera.x;
            _startCameraY = _camera.y;

            _lastCameraX = _camera.x;
            _lastCameraY = _camera.y;

            pos0 = position(_downTouches[0]);
            _startTouchX0 = pos0.x;
            _startTouchY0 = pos0.y;

            break;
          case 2:
            _camera.isMoving = true;
            _touchMode = 2;

            pos0 = position(_downTouches[0]);
            pos1 = position(_downTouches[1]);
            x0 = pos0.x;
            y0 = pos0.y;
            x1 = pos1.x;
            y1 = pos1.y;

            _lastCameraX = _camera.x;
            _lastCameraY = _camera.y;

            _startCameraAngle = _camera.angle;
            _startCameraRatio = _camera.ratio;

            _startCameraX = _camera.x;
            _startCameraY = _camera.y;

            _startTouchX0 = x0;
            _startTouchY0 = y0;
            _startTouchX1 = x1;
            _startTouchY1 = y1;

            _startTouchAngle = Math.atan2(
              _startTouchY1 - _startTouchY0,
              _startTouchX1 - _startTouchX0
            );
            _startTouchDistance = Math.sqrt(
              (_startTouchY1 - _startTouchY0) *
                (_startTouchY1 - _startTouchY0) +
                (_startTouchX1 - _startTouchX0) *
                  (_startTouchX1 - _startTouchX0)
            );

            e.preventDefault();
            return false;
        }
      }
    }

    /**
     * The handler listening to the 'touchend', 'touchcancel' and 'touchleave'
     * event. It will update the touch mode if there are still at least one
     * finger, and stop dragging else.
     *
     * @param {event} e A touch event.
     */
    function _handleLeave(e) {
      if (_settings("touchEnabled")) {
        _downTouches = e.touches;
        const inertiaRatio = _settings("touchInertiaRatio");

        if (_movingTimeoutId) {
          _isMoving = false;
          clearTimeout(_movingTimeoutId);
        }

        switch (_touchMode) {
          case 2:
            if (e.touches.length === 1) {
              _handleStart(e);

              e.preventDefault();
              break;
            }
          /* falls through */
          case 1:
            _camera.isMoving = false;
            _self.dispatchEvent("stopDrag");

            if (_isMoving) {
              _doubleTap = false;
              sigma.misc.animation.camera(
                _camera,
                {
                  x: _camera.x + inertiaRatio * (_camera.x - _lastCameraX),
                  y: _camera.y + inertiaRatio * (_camera.y - _lastCameraY)
                },
                {
                  easing: "quadraticOut",
                  duration: _settings("touchInertiaDuration")
                }
              );
            }

            _isMoving = false;
            _touchMode = 0;
            break;
        }
      }
    }

    /**
     * The handler listening to the 'touchmove' event. It will effectively drag
     * the graph, and eventually zooms and turn it if the user is using two
     * fingers.
     *
     * @param {event} e A touch event.
     */
    function _handleMove(e) {
      if (!_doubleTap && _settings("touchEnabled")) {
        let x0;

        let x1;

        let y0;

        let y1;

        let cos;

        let sin;

        let end;

        let pos0;

        let pos1;

        let diff;

        let start;

        let dAngle;

        let dRatio;

        let newStageX;

        let newStageY;

        let newStageRatio;

        let newStageAngle;

        _downTouches = e.touches;
        _isMoving = true;

        if (_movingTimeoutId) clearTimeout(_movingTimeoutId);

        _movingTimeoutId = setTimeout(function() {
          _isMoving = false;
        }, _settings("dragTimeout"));

        switch (_touchMode) {
          case 1:
            pos0 = position(_downTouches[0]);
            x0 = pos0.x;
            y0 = pos0.y;

            diff = _camera.cameraPosition(
              x0 - _startTouchX0,
              y0 - _startTouchY0,
              true
            );

            newStageX = _startCameraX - diff.x;
            newStageY = _startCameraY - diff.y;

            if (newStageX !== _camera.x || newStageY !== _camera.y) {
              _lastCameraX = _camera.x;
              _lastCameraY = _camera.y;

              _camera.goTo({
                x: newStageX,
                y: newStageY
              });

              _self.dispatchEvent("mousemove", mouseCoords(e, pos0.x, pos0.y));

              _self.dispatchEvent("drag");
            }
            break;
          case 2:
            pos0 = position(_downTouches[0]);
            pos1 = position(_downTouches[1]);
            x0 = pos0.x;
            y0 = pos0.y;
            x1 = pos1.x;
            y1 = pos1.y;

            start = _camera.cameraPosition(
              (_startTouchX0 + _startTouchX1) / 2 - getCenter(e).x,
              (_startTouchY0 + _startTouchY1) / 2 - getCenter(e).y,
              true
            );
            end = _camera.cameraPosition(
              (x0 + x1) / 2 - getCenter(e).x,
              (y0 + y1) / 2 - getCenter(e).y,
              true
            );

            dAngle = Math.atan2(y1 - y0, x1 - x0) - _startTouchAngle;
            dRatio =
              Math.sqrt((y1 - y0) * (y1 - y0) + (x1 - x0) * (x1 - x0)) /
              _startTouchDistance;

            // Translation:
            x0 = start.x;
            y0 = start.y;

            // Homothetic transformation:
            newStageRatio = _startCameraRatio / dRatio;
            x0 *= dRatio;
            y0 *= dRatio;

            // Rotation:
            newStageAngle = _startCameraAngle - dAngle;
            cos = Math.cos(-dAngle);
            sin = Math.sin(-dAngle);
            x1 = x0 * cos + y0 * sin;
            y1 = y0 * cos - x0 * sin;
            x0 = x1;
            y0 = y1;

            // Finalize:
            newStageX = x0 - end.x + _startCameraX;
            newStageY = y0 - end.y + _startCameraY;

            if (
              newStageRatio !== _camera.ratio ||
              newStageAngle !== _camera.angle ||
              newStageX !== _camera.x ||
              newStageY !== _camera.y
            ) {
              _lastCameraX = _camera.x;
              _lastCameraY = _camera.y;
              _lastCameraAngle = _camera.angle;
              _lastCameraRatio = _camera.ratio;

              _camera.goTo({
                x: newStageX,
                y: newStageY,
                angle: newStageAngle,
                ratio: newStageRatio
              });

              _self.dispatchEvent("drag");
            }

            break;
        }

        e.preventDefault();
        return false;
      }
    }

    /**
     * The handler listening to the double tap custom event. It will
     * basically zoom into the graph.
     *
     * @param {event} e A touch event.
     */
    function _doubleTapHandler(e) {
      let pos;
      let ratio;
      let animation;

      if (e.touches && e.touches.length === 1 && _settings("touchEnabled")) {
        _doubleTap = true;

        ratio = 1 / _settings("doubleClickZoomingRatio");

        pos = position(e.touches[0]);
        _self.dispatchEvent("doubleclick", mouseCoords(e, pos.x, pos.y));

        if (_settings("doubleClickEnabled")) {
          pos = _camera.cameraPosition(
            pos.x - getCenter(e).x,
            pos.y - getCenter(e).y,
            true
          );

          animation = {
            duration: _settings("doubleClickZoomDuration"),
            onComplete() {
              _doubleTap = false;
            }
          };

          zoomTo(_camera, pos.x, pos.y, ratio, animation);
        }

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

        e.stopPropagation();
        return false;
      }
    }
  };
}