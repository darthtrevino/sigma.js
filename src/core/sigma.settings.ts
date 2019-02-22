/* eslint-disable no-param-reassign */
import DEFAULT_SETTINGS from "./domain/default_settings";
import { SigmaLibrary } from "./interfaces";

export default function configure(sigma: SigmaLibrary) {
  // Export the previously designed settings:
  sigma.settings = { ...(sigma.settings || {}), ...DEFAULT_SETTINGS };
}
