import { Keyed } from "../../interfaces";

type ConfigMap = Keyed<any>;

export interface Settings {
  (a1: string | ConfigMap, a2?: any): any;
  embedObjects(...eoArgs: ConfigMap[]): Settings;
}
/**
 * This utils aims to facilitate the manipulation of each instance setting.
 * Using a function instead of an object brings two main advantages: First,
 * it will be easier in the future to catch settings updates through a
 * function than an object. Second, giving it a full object will "merge" it
 * to the settings object properly, keeping us to have to always add a loop.
 *
 * @return {configurable} The "settings" function.
 */
export default function configurable(...args: any[]): Settings {
  const data: ConfigMap = Object.assign({}, ...args);

  function getData(key: string) {
    if (data[key] !== undefined) {
      return data[key];
    }
    return undefined;
  }
  /**
   * The method to use to set or get any property of this instance.
   *
   * @param  {string|object}    arg1 If it is a string and if a2 is undefined,
   *                               then it will return the corresponding
   *                               property. If it is a string and if a2 is
   *                               set, then it will set a2 as the property
   *                               corresponding to a1, and return this. If
   *                               it is an object, then each pair string +
   *                               object(or any other type) will be set as a
   *                               property.
   * @param  {*?}               arg2 The new property corresponding to a1 if a1
   *                               is a string.
   * @return {*|configurable}      Returns itself or the corresponding
   *                               property.
   *
   * Polymorphism:
   * *************
   * Here are some basic use examples:
   *
   *  > settings = configurable();
   *  > settings('mySetting', 42);
   *  > settings('mySetting'); // Logs: 42
   *  > settings('mySetting', 123);
   *  > settings('mySetting'); // Logs: 123
   *  > settings({mySetting: 456});
   *  > settings('mySetting'); // Logs: 456
   *
   * Also, it is possible to use the function as a fallback:
   *  > settings({mySetting: 'abc'}, 'mySetting');  // Logs: 'abc'
   *  > settings({hisSetting: 'abc'}, 'mySetting'); // Logs: 456
   */
  function settings(arg1: string | ConfigMap, arg2?: any) {
    // single argument, (string) form: access the data item
    if (arguments.length === 1 && typeof arg1 === "string") {
      return getData(arg1);
    }
    // two arguments: (object, string) form: augmented lookup
    if (typeof arg1 === "object" && typeof arg2 === "string") {
      return (arg1 || {})[arg2] !== undefined ? arg1[arg2] : getData(arg2);
    }

    // Extend current sestings
    const o = typeof arg1 === "object" && arg2 === undefined ? arg1 : {};
    if (typeof arg1 === "string") {
      o[arg1] = arg2;
    }

    Object.keys(o).forEach(key => {
      data[key] = o[key];
    });
    return undefined;
  }

  /**
   * This method returns a configurable function, with new objects
   *
   * @param  {object*}  Any number of objects to search in.
   * @return {function} Returns the function. Check its documentation to know
   *                    more about how it works.
   */
  settings.embedObjects = function embedObjects(...extraData: ConfigMap[]) {
    return configurable(data, ...extraData);
  };

  // Initialize
  args.forEach(a => settings(a));
  return settings;
}
