import Dispatcher from "./Dispatcher";
import unbindDoubleClick from "../utils/events/unbindDoubleClick";
import mouseCoords from "../utils/events/mouseCoords";
import getCenter from "../utils/events/getCenter";
import getOffset from "../utils/events/getOffset";
import Camera from "./Camera";

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
  return class TouchCaptor extends Dispatcher {
    // CAMERA MANAGEMENT:
    // ******************
    // The camera position when the user starts dragging:
    public startCameraX = 0;
    public startCameraY = 0;
    public startCameraAngle = 0;
    public startCameraRatio = 0;

    // The latest stage position:
    public lastCameraX = 0;
    public lastCameraY = 0;

    // TOUCH MANAGEMENT:
    // *****************
    // Touches that are down:
    private downTouches: TouchList | undefined;
    private startTouchX0 = 0;
    private startTouchY0 = 0;
    private startTouchX1 = 0;
    private startTouchY1 = 0;
    private startTouchAngle = 0;
    private startTouchDistance = 0;
    private touchMode = 0;
    private isMoving = false;
    private doubleTap = false;
    private movingTimeout = 0;

    constructor(
      public target: HTMLElement,
      public camera: Camera,
      public settings: any
    ) {
      super();

      sigma.utils.events.doubleClick(
        target,
        "touchstart",
        this.doubleTapHandler
      );
      target.addEventListener("touchstart", this.handleStart, false);
      target.addEventListener("touchend", this.handleLeave, false);
      target.addEventListener("touchcancel", this.handleLeave, false);
      target.addEventListener("touchleave", this.handleLeave, false);
      target.addEventListener("touchmove", this.handleMove, false);
    }

    /**
     * This method unbinds every handlers that makes the captor work.
     */
    public kill = () => {
      unbindDoubleClick(this.target, "touchstart");
      this.target.addEventListener("touchstart", this.handleStart);
      this.target.addEventListener("touchend", this.handleLeave);
      this.target.addEventListener("touchcancel", this.handleLeave);
      this.target.addEventListener("touchleave", this.handleLeave);
      this.target.addEventListener("touchmove", this.handleMove);
    };

    private position(e: Touch) {
      const offset = getOffset(this.target);
      return {
        x: e.pageX - offset.left,
        y: e.pageY - offset.top
      };
    }

    // TOUCH EVENTS:
    // *************
    /**
     * The handler listening to the 'touchstart' event. It will set the touch
     * mode ("this.touchMode") and start observing the user touch moves.
     *
     * @param {event} e A touch event.
     */
    private handleStart = (e: TouchEvent) => {
      if (this.settings("touchEnabled")) {
        let x0;
        let x1;
        let y0;
        let y1;
        let pos0;
        let pos1;

        this.downTouches = e.touches;

        switch (this.downTouches.length) {
          case 1:
            this.camera.isMoving = true;
            this.touchMode = 1;

            this.startCameraX = this.camera.x;
            this.startCameraY = this.camera.y;

            this.lastCameraX = this.camera.x;
            this.lastCameraY = this.camera.y;

            pos0 = this.position(this.downTouches[0]);
            this.startTouchX0 = pos0.x;
            this.startTouchY0 = pos0.y;

            break;
          case 2:
            this.camera.isMoving = true;
            this.touchMode = 2;

            pos0 = this.position(this.downTouches[0]);
            pos1 = this.position(this.downTouches[1]);
            x0 = pos0.x;
            y0 = pos0.y;
            x1 = pos1.x;
            y1 = pos1.y;

            this.lastCameraX = this.camera.x;
            this.lastCameraY = this.camera.y;

            this.startCameraAngle = this.camera.angle;
            this.startCameraRatio = this.camera.ratio;

            this.startCameraX = this.camera.x;
            this.startCameraY = this.camera.y;

            this.startTouchX0 = x0;
            this.startTouchY0 = y0;
            this.startTouchX1 = x1;
            this.startTouchY1 = y1;

            this.startTouchAngle = Math.atan2(
              this.startTouchY1 - this.startTouchY0,
              this.startTouchX1 - this.startTouchX0
            );
            this.startTouchDistance = Math.sqrt(
              (this.startTouchY1 - this.startTouchY0) *
                (this.startTouchY1 - this.startTouchY0) +
                (this.startTouchX1 - this.startTouchX0) *
                  (this.startTouchX1 - this.startTouchX0)
            );

            e.preventDefault();
            return false;
          default:
            console.log(`Unhandled downtouches ${this.downTouches.length}`);
        }
      }
      return undefined;
    };

    /**
     * The handler listening to the 'touchend', 'touchcancel' and 'touchleave'
     * event. It will update the touch mode if there are still at least one
     * finger, and stop dragging else.
     *
     * @param {event} e A touch event.
     */
    private handleLeave = (e: TouchEvent) => {
      if (this.settings("touchEnabled")) {
        this.downTouches = e.touches;
        const inertiaRatio = this.settings("touchInertiaRatio");

        if (this.movingTimeout) {
          this.isMoving = false;
          clearTimeout(this.movingTimeout);
        }

        switch (this.touchMode) {
          case 2:
            if (e.touches.length === 1) {
              this.handleStart(e);
              e.preventDefault();
              break;
            }
          /* falls through */
          case 1:
            this.camera.isMoving = false;
            this.dispatchEvent("stopDrag");

            if (this.isMoving) {
              this.doubleTap = false;
              sigma.misc.animation.camera(
                this.camera,
                {
                  x:
                    this.camera.x +
                    inertiaRatio * (this.camera.x - this.lastCameraX),
                  y:
                    this.camera.y +
                    inertiaRatio * (this.camera.y - this.lastCameraY)
                },
                {
                  easing: "quadraticOut",
                  duration: this.settings("touchInertiaDuration")
                }
              );
            }

            this.isMoving = false;
            this.touchMode = 0;
            break;
          default:
            console.log(`Unhandled touchMode ${this.touchMode}`);
        }
      }
    };

    /**
     * The handler listening to the 'touchmove' event. It will effectively drag
     * the graph, and eventually zooms and turn it if the user is using two
     * fingers.
     *
     * @param {event} e A touch event.
     */
    private handleMove = e => {
      if (!this.doubleTap && this.settings("touchEnabled")) {
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
        this.downTouches = e.touches;
        this.isMoving = true;

        if (this.movingTimeout) clearTimeout(this.movingTimeout);

        this.movingTimeout = setTimeout(() => {
          this.isMoving = false;
        }, this.settings("dragTimeout")) as any;

        switch (this.touchMode) {
          case 1:
            pos0 = this.position(this.downTouches[0]);
            x0 = pos0.x;
            y0 = pos0.y;

            diff = this.camera.cameraPosition(
              x0 - this.startTouchX0,
              y0 - this.startTouchY0,
              true
            );

            newStageX = this.startCameraX - diff.x;
            newStageY = this.startCameraY - diff.y;

            if (newStageX !== this.camera.x || newStageY !== this.camera.y) {
              this.lastCameraX = this.camera.x;
              this.lastCameraY = this.camera.y;

              this.camera.goTo({
                x: newStageX,
                y: newStageY
              });

              this.dispatchEvent("mousemove", mouseCoords(e, pos0.x, pos0.y));

              this.dispatchEvent("drag");
            }
            break;
          case 2:
            pos0 = this.position(this.downTouches[0]);
            pos1 = this.position(this.downTouches[1]);
            x0 = pos0.x;
            y0 = pos0.y;
            x1 = pos1.x;
            y1 = pos1.y;

            start = this.camera.cameraPosition(
              (this.startTouchX0 + this.startTouchX1) / 2 - getCenter(e).x,
              (this.startTouchY0 + this.startTouchY1) / 2 - getCenter(e).y,
              true
            );
            end = this.camera.cameraPosition(
              (x0 + x1) / 2 - getCenter(e).x,
              (y0 + y1) / 2 - getCenter(e).y,
              true
            );

            dAngle = Math.atan2(y1 - y0, x1 - x0) - this.startTouchAngle;
            dRatio =
              Math.sqrt((y1 - y0) * (y1 - y0) + (x1 - x0) * (x1 - x0)) /
              this.startTouchDistance;

            // Translation:
            x0 = start.x;
            y0 = start.y;

            // Homothetic transformation:
            newStageRatio = this.startCameraRatio / dRatio;
            x0 *= dRatio;
            y0 *= dRatio;

            // Rotation:
            newStageAngle = this.startCameraAngle - dAngle;
            cos = Math.cos(-dAngle);
            sin = Math.sin(-dAngle);
            x1 = x0 * cos + y0 * sin;
            y1 = y0 * cos - x0 * sin;
            x0 = x1;
            y0 = y1;

            // Finalize:
            newStageX = x0 - end.x + this.startCameraX;
            newStageY = y0 - end.y + this.startCameraY;

            if (
              newStageRatio !== this.camera.ratio ||
              newStageAngle !== this.camera.angle ||
              newStageX !== this.camera.x ||
              newStageY !== this.camera.y
            ) {
              this.lastCameraX = this.camera.x;
              this.lastCameraY = this.camera.y;

              this.camera.goTo({
                x: newStageX,
                y: newStageY,
                angle: newStageAngle,
                ratio: newStageRatio
              });

              this.dispatchEvent("drag");
            }

            break;
          default:
            console.log(`Unhandled touchMode ${this.touchMode}`);
        }

        e.preventDefault();
        return false;
      }
      return undefined;
    };

    /**
     * The handler listening to the double tap custom event. It will
     * basically zoom into the graph.
     *
     * @param {event} e A touch event.
     */
    private doubleTapHandler = e => {
      let pos;
      let ratio;
      let animation;

      if (
        e.touches &&
        e.touches.length === 1 &&
        this.settings("touchEnabled")
      ) {
        this.doubleTap = true;

        ratio = 1 / this.settings("doubleClickZoomingRatio");

        pos = this.position(e.touches[0]);
        this.dispatchEvent("doubleclick", mouseCoords(e, pos.x, pos.y));

        if (this.settings("doubleClickEnabled")) {
          pos = this.camera.cameraPosition(
            pos.x - getCenter(e).x,
            pos.y - getCenter(e).y,
            true
          );

          animation = {
            duration: this.settings("doubleClickZoomDuration"),
            onComplete() {
              this.doubleTap = false;
            }
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
  } as any;
}
