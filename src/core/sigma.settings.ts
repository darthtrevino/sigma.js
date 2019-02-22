/* eslint-disable no-param-reassign */
import DEFAULT_SETTINGS from "./domain/default_settings";

export default function configure(sigma) {
  // Export the previously designed settings:
  sigma.settings = { ...(sigma.settings || {}), ...DEFAULT_SETTINGS };
}
