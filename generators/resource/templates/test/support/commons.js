/**
 * A set of common tools and utils for the shared test steps
 */

// just a long ugly RE
exports.UUID_RE = /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;

// converts a thinky record into a plain object, optionally with some overrides
exports.toObject = (record, options) => Object.assign({}, record, options);

// sorts a list of records by a key and exports them into a list of plain objects
exports.sorted = (records, param = 'id') => records
   .sort((a, b) => (a[param] > b[param] ? 1 : -1))
   .map(exports.toObject);

// conditionally runs the steps, with options to skip/only speicific steps
exports.run = (originalArgs, steps) => {
  const size = originalArgs.length;
  const last = originalArgs[size - 1];
  const args = originalArgs.slice(0, size - (last.skip || last.only ? 1 : 0));
  const keys = Object.keys(steps).filter(key =>
    last.skip ? last.skip.indexOf(key) === -1 :
    last.only ? last.only.indexOf(key) !== -1 : true
  );

  keys.forEach(key => steps[key].apply(null, args));
};
