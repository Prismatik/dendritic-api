/**
 * A set of common tools and utils for the shared test steps
 */

// just a long ugly RE
exports.UUID_RE = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

// converts a thinky record into a plain object, optionally with some overrides
exports.toObject = (record, options) => Object.assign({}, record, options);

// makes the data comparable with JSON encoded/parsed blobs
exports.jsonDecode = data => {
  const clone = Object.assign({}, data);

  Object.keys(clone).forEach(key => {
    if (clone[key] instanceof Date) {
      clone[key] = clone[key].toISOString();
    }
  });

  return clone;
};

// sorts a list of records by a key and exports them into a list of plain objects
exports.sorted = (records, param = 'id') => records
   .sort((a, b) => (a[param] > b[param] ? 1 : -1))
   .map(exports.toObject);

// conditionally runs the steps, with options to skip/only speicific steps
exports.run = (originalArgs, steps) => {
  const size = originalArgs.length;
  const last = originalArgs[size - 1];
  const args = originalArgs.slice(0, size - (last.skip || last.only ? 1 : 0));
  const keys = Object.keys(steps).filter(key => {
    if (last.skip) return last.skip.indexOf(key) === -1;
    if (last.only) return last.only.indexOf(key) !== -1;
    return true;
  });

  keys.forEach(key => steps[key].apply(null, args));
};

// merges objects together and cleans up `undefined` values
exports.cleanUpAndMerge = (...args) => {
  const result = Object.assign.apply(null, [{}].concat(args));

  Object.keys(result).forEach(key => {
    if (result[key] === undefined) {
      delete result[key];
    }
  });

  return result;
};
