import Dispatcher from "./DispatcherClass";
import unbindDoubleClick from "../utils/events/unbindDoubleClick";
import mouseCoords from "../utils/events/mouseCoords";
import getX from "../utils/events/getX";
import getY from "../utils/events/getY";
import getCenter from "../utils/events/getCenter";
import getDelta from "../utils/events/getDelta";
import Camera from "./Camera";

export default sigma => {
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
  return class MouseCaptor extends Dispatcher {
    // CAMERA MANAGEMENT:
    // ******************
    // The camera position when the user starts dragging:
    private startCameraX = 0;
    private startCameraY = 0;

    // The latest stage position:
    private lastCameraX = 0;
    private lastCameraY = 0;

    // MOUSE MANAGEMENT:
    // *****************
    // The mouse position when the user starts dragging:
    private startMouseX = 0;
    private startMouseY = 0;
    private isMouseDown = false;
    private isMoving = false;
    private hasDragged = false;
    private downStartTime = 0;
    private movingTimeoutId = null;

    constructor(
      private target: HTMLElement,
      private camera: Camera,
      private settings: any
    ) {
      super();

      sigma.utils.events.doubleClick(target, "click", this.doubleClickHandler);
      target.addEventListener(
        "DOMMouseScroll",
        this.wheelHandler.bind(this),
        false
      );
      target.addEventListener(
        "mousewheel",
        this.wheelHandler.bind(this),
        false
      );
      target.addEventListener("mousemove", this.moveHandler, false);
      target.addEventListener("mousedown", this.downHandler, false);
      target.addEventListener("click", this.clickHandler, false);
      target.addEventListener("mouseout", this.outHandler, false);
      document.addEventListener("mouseup", this.upHandler, false);
    }

    /**
     * The handler listening to the 'move' mouse event. It will effectively
     * drag the graph.
     *
     * @param {event} e A mouse event.
     */
    private moveHandler = e => {
      let x;
      let y;
      let pos;

      // Dispatch event:
      if (this.settings("mouseEnabled")) {
        this.dispatchEvent("mousemove", mouseCoords(e));

        if (this.isMouseDown) {
          this.isMoving = true;
          this.hasDragged = true;

          if (this.movingTimeoutId) clearTimeout(this.movingTimeoutId);

          this.movingTimeoutId = setTimeout(function stopMoving() {
            this.isMoving = false;
          }, this.settings("dragTimeout"));

          sigma.misc.animation.killAll(this.camera);

          this.camera.isMoving = true;
          pos = this.camera.cameraPosition(
            getX(e) - this.startMouseX,
            getY(e) - this.startMouseY,
            true
          );

          x = this.startCameraX - pos.x;
          y = this.startCameraY - pos.y;

          if (x !== this.camera.x || y !== this.camera.y) {
            this.lastCameraX = this.camera.x;
            this.lastCameraY = this.camera.y;

            this.camera.goTo({
              x,
              y
            });
          }

          if (e.preventDefault) e.preventDefault();
          else e.returnValue = false;

          e.stopPropagation();
          return false;
        }
      }
      return undefined;
    };

    /**
     * The handler listening to the 'up' mouse event. It will stop dragging the
     * graph.
     *
     * @param {event} e A mouse event.
     */
    private upHandler = e => {
      if (this.settings("mouseEnabled") && this.isMouseDown) {
        this.isMouseDown = false;
        if (this.movingTimeoutId) clearTimeout(this.movingTimeoutId);

        this.camera.isMoving = false;

        const x = getX(e);
        const y = getY(e);

        if (this.isMoving) {
          sigma.misc.animation.killAll(this.camera);
          sigma.misc.animation.camera(
            this.camera,
            {
              x:
                this.camera.x +
                this.settings("mouseInertiaRatio") *
                  (this.camera.x - this.lastCameraX),
              y:
                this.camera.y +
                this.settings("mouseInertiaRatio") *
                  (this.camera.y - this.lastCameraY)
            },
            {
              easing: "quadraticOut",
              duration: this.settings("mouseInertiaDuration")
            }
          );
        } else if (this.startMouseX !== x || this.startMouseY !== y)
          this.camera.goTo({
            x: this.camera.x,
            y: this.camera.y
          });

        this.dispatchEvent("mouseup", mouseCoords(e));

        // Update this.isMoving flag:
        this.isMoving = false;
      }
    };

    /**
     * The handler listening to the 'down' mouse event. It will start observing
     * the mouse position for dragging the graph.
     *
     * @param {event} e A mouse event.
     */
    private downHandler = e => {
      if (this.settings("mouseEnabled")) {
        this.startCameraX = this.camera.x;
        this.startCameraY = this.camera.y;

        this.lastCameraX = this.camera.x;
        this.lastCameraY = this.camera.y;

        this.startMouseX = getX(e);
        this.startMouseY = getY(e);

        this.hasDragged = false;
        this.downStartTime = new Date().getTime();

        switch (e.which) {
          case 2:
            // Middle mouse button pressed
            // Do nothing.
            break;
          case 3:
            // Right mouse button pressed
            this.dispatchEvent(
              "rightclick",
              mouseCoords(e, this.startMouseX, this.startMouseY)
            );
            break;
          // case 1:
          default:
            // Left mouse button pressed
            this.isMouseDown = true;

            this.dispatchEvent(
              "mousedown",
              mouseCoords(e, this.startMouseX, this.startMouseY)
            );
        }
      }
    };

    /**
     * The handler listening to the 'out' mouse event. It will just redispatch
     * the event.
     *
     * @param {event} e A mouse event.
     */
    private outHandler = () => {
      if (this.settings("mouseEnabled")) this.dispatchEvent("mouseout");
    };

    /**
     * The handler listening to the 'click' mouse event. It will redispatch the
     * click event, but with normalized X and Y coordinates.
     *
     * @param {event} e A mouse event.
     */
    private clickHandler = e => {
      if (this.settings("mouseEnabled")) {
        const event = mouseCoords(e);
        (event as any).isDragging =
          new Date().getTime() - this.downStartTime > 100 && this.hasDragged;
        this.dispatchEvent("click", event);
      }

      if (e.preventDefault) e.preventDefault();
      else e.returnValue = false;

      e.stopPropagation();
      return false;
    };

    /**
     * The handler listening to the double click custom event. It will
     * basically zoom into the graph.
     *
     * @param {event} e A mouse event.
     */
    private doubleClickHandler = e => {
      let pos;
      let ratio;
      let animation;

      if (this.settings("mouseEnabled")) {
        ratio = 1 / this.settings("doubleClickZoomingRatio");

        this.dispatchEvent(
          "doubleclick",
          mouseCoords(e, this.startMouseX, this.startMouseY)
        );

        if (this.settings("doubleClickEnabled")) {
          pos = this.camera.cameraPosition(
            getX(e) - getCenter(e).x,
            getY(e) - getCenter(e).y,
            true
          );

          animation = {
            duration: this.settings("doubleClickZoomDuration")
          };

          sigma.utils.zoomTo(this.camera, pos.x, pos.y, ratio, animation);
        }

        if (e.preventDefault) e.preventDefault();
        else e.returnValue = false;

        e.stopPropagation();
        return false;
      }
      return undefined;
    };

    /**
     * The handler listening to the 'wheel' mouse event. It will basically zoom
     * in or not into the graph.
     *
     * @param {event} e A mouse event.
     */
    private wheelHandler = e => {
      let pos;
      let ratio;
      let animation;
      const wheelDelta = getDelta(e);

      if (
        this.settings("mouseEnabled") &&
        this.settings("mouseWheelEnabled") &&
        wheelDelta !== 0
      ) {
        ratio =
          wheelDelta > 0
            ? 1 / this.settings("zoomingRatio")
            : this.settings("zoomingRatio");

        pos = this.camera.cameraPosition(
          getX(e) - getCenter(e).x,
          getY(e) - getCenter(e).y,
          true
        );

        animation = {
          duration: this.settings("mouseZoomDuration")
        };

        sigma.utils.zoomTo(this.camera, pos.x, pos.y, ratio, animation);

        if (e.preventDefault) {
          e.preventDefault();
        } else {
          e.returnValue = false;
        }

        e.stopPropagation();
        return false;
      }
      return undefined;
    };

    /**
     * This method unbinds every handlers that makes the captor work.
     */
    public kill = () => {
      const { target } = this;
      unbindDoubleClick(target, "click");
      target.removeEventListener("DOMMouseScroll", this.wheelHandler);
      target.removeEventListener("mousewheel", this.wheelHandler);
      target.removeEventListener("mousemove", this.moveHandler);
      target.removeEventListener("mousedown", this.downHandler);
      target.removeEventListener("click", this.clickHandler);
      target.removeEventListener("mouseout", this.outHandler);
      document.removeEventListener("mouseup", this.upHandler);
    };
  };
};
