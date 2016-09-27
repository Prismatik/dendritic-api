/**
 * Converts all `null` values in the object to `undefined`
 * so that thinky models would delete the data on records update
 *
 * https://tools.ietf.org/html/rfc7396
 *
 * @param {Object} original data
 * @return {Object} patched data
 */
exports.nullToUndefined = function convert(value) {
  switch (({}).toString.call(value)) {
    case '[object Object]':
      const clone = {};
      Object.keys(value).forEach(key =>
        clone[key] = convert(value[key])
      );
      return clone;
    case '[object Array]':
      return input.map(convert);
    case '[object Null]':
      return undefined;
    default:
      return value;
  }
}
