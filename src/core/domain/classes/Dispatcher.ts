export interface EventHandler {
  handler: Function;
  one?: boolean;
}

/*
 * Dispatcher constructor.
 *
 * @return {dispatcher} The new dispatcher instance.
 */
export default class Dispatcher {
  private handlers: { [key: string]: EventHandler[] } = {};

  constructor() {
    this.bind = this.bind.bind(this);
    this.unbind = this.unbind.bind(this);
    this.dispatchEvent = this.dispatchEvent.bind(this);
  }

  /**
   * Will execute the handler everytime that the indicated event (or the
   * indicated events) will be triggered.
   *
   * @param  {string}           events  The name of the event (or the events
   *                                    separated by spaces).
   * @param  {function(Object)} handler The handler to bind.
   * @return {dispatcher}               Returns the instance itself.
   */
  public bind(
    events: { [key: string]: Function } | string[] | string,
    handler?: Function
  ) {
    /* eslint-disable prefer-rest-params */
    if (arguments.length === 1 && typeof arguments[0] === "object") {
      const argObject = events;
      Object.keys(argObject).forEach(evts => {
        this.bind(evts, argObject[evts]);
      });
    } else if (arguments.length === 2 && typeof handler === "function") {
      const eventArray =
        typeof events === "string" ? events.split(" ") : events;
      eventArray
        .filter(e => !!e)
        .forEach(event => {
          if (!this.handlers[event]) this.handlers[event] = [];

          // Using an object instead of directly the handler will make possible
          // later to add flags
          this.handlers[event].push({
            handler
          });
        });
    } else
      throw new Error(
        `bind: Wrong arguments. eventstype=${typeof events} handlertype=${typeof handler}`
      );

    return this;
  }

  /**
   * Removes the handler from a specified event (or specified events).
   *
   * @param  {?string}           events  The name of the event (or the events
   *                                     separated by spaces). If undefined,
   *                                     then all handlers are removed.
   * @param  {?function(object)} handler The handler to unbind. If undefined,
   *                                     each handler bound to the event or the
   *                                     events will be removed.
   * @return {dispatcher}                Returns the instance itself.
   */
  public unbind(events?: string | string[], handler?: Function) {
    let i;
    let n;
    const eArray = typeof events === "string" ? events.split(" ") : events;

    if (!arguments.length) {
      Object.keys(this.handlers).forEach(key => delete this.handlers[key]);
      return this;
    }

    if (handler) {
      eArray.forEach(event => {
        if (this.handlers[event]) {
          const savedHandlers = [];
          this.handlers[event].forEach(h => {
            if (h.handler !== handler) {
              savedHandlers.push(h);
            }
          });
          this.handlers[event] = savedHandlers;
        }

        if (this.handlers[event] && this.handlers[event].length === 0)
          delete this.handlers[event];
      });
    } else
      for (i = 0, n = eArray.length; i !== n; i += 1)
        delete this.handlers[eArray[i]];

    return this;
  }

  /**
   * Executes each handler bound to the event
   *
   * @param  {string}     events The name of the event (or the events separated
   *                             by spaces).
   * @param  {?object}    data   The content of the event (optional).
   * @return {dispatcher}        Returns the instance itself.
   */
  public dispatchEvent(events: string | string[], data?: any) {
    const self = this;
    const eArray = typeof events === "string" ? events.split(" ") : events;
    data = data === undefined ? {} : data;

    eArray.forEach(eventName => {
      if (this.handlers[eventName]) {
        const event = self.getEvent(eventName, data);
        const savedHandlers = [];

        this.handlers[eventName].forEach(handler => {
          handler.handler(event);
          if (!handler.one) {
            savedHandlers.push(handler);
          }
        });

        this.handlers[eventName] = savedHandlers;
      }
    });

    return this;
  }

  /**
   * Return an event object.
   *
   * @param  {string}  events The name of the event.
   * @param  {?object} data   The content of the event (optional).
   * @return {object}         Returns the instance itself.
   */
  private getEvent = (event: string, data?: any) => {
    return {
      type: event,
      data: data || {},
      target: this
    };
  };

  /**
   * Augments an object with dispatching power
   */
  public static extend(target: any) {
    const instance = new Dispatcher();
    target.__dispatcher = instance;
    ["dispatchEvent", "bind", "unbind"].forEach(method => {
      if (target["method"]) {
        throw new Error(
          `dispatcher method ${method} is already defined on target`
        );
      }
      target[method] = instance[method];
    });
  }
}
