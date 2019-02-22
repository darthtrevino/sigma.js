import Sigma from "./domain/classes/Sigma";

export interface Keyed<T> {
  [key: string]: T;
}

export interface SigmaConfiguration {
  renderers?: Array<string | HTMLElement>;
  settings?: Keyed<any>;
  id?: string;
  [key: string]: any;
}

export interface SigmaLibrary {
  new (item?: any): Sigma;

  instances(id?: string): Sigma | { [key: string]: Sigma };
  register(packageName: string, item: any);

  classes: { [key: string]: Function };
  settings: { [key: string]: any };

  renderers: { [key: string]: Function };
  middlewares: { [key: string]: any };
  utils: { [key: string]: any };
  misc: { [key: string]: any };
  captors: { [key: string]: any };
  plugins: { [key: string]: any };

  // Renderer Utils
  canvas: { [key: string]: any };
  svg: { [key: string]: any };
  webgl: { [key: string]: any };
}
