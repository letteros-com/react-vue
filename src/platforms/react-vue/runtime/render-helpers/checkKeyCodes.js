/* @flow */

/**
 * Runtime helper for checking keyCodes.
 */
export function checkKeyCodes (
  eventKeyCode: number,
  key: string,
  builtInAlias: number | Array<number> | void
): boolean {
  const keyCodes = builtInAlias
  if (Array.isArray(keyCodes)) {
    return keyCodes.indexOf(eventKeyCode) === -1
  } else {
    return keyCodes !== eventKeyCode
  }
}
