/* eslint global-require: 'off', no-console: 'off' */

const _ = require('lodash');
const os = require('os');
const Migration = require('../models/migration');
const { slurp } = require('./module');

const { thinky: { r } } = require(`${process.cwd()}/config`);

const MUTEX_MIGRATION_NAME = 'migrations_running_mutex';

let migrationFiles = [];
try { migrationFiles = slurp('migrations'); } catch (e) { console.log('no migrations found'); }
const existingMigrations = Object.keys(migrationFiles).sort().map(name => {
  const { up, down } = migrationFiles[name];
  return { up, down, name: _.snakeCase(name) };
});

exports.list = function *() {
  yield Migration.ready();
  const records = yield Migration.run();

  return existingMigrations.map(migration => {
    const { name, up, down } = migration;
    const [applied] = records.filter(r => r.name === name);
    return { up, down, name, applied: !!applied };
  });
};

exports.queryMutex = function *() {
  yield Migration.ready();
  const [mutex] = yield Migration.filter({ name: MUTEX_MIGRATION_NAME }).run();
  return mutex;
};

exports.acquireMutex = function *() {
  yield Migration.ready();
  /* eslint no-underscore-dangle: 'off' */
  return yield r.branch(
    Migration.filter({ name: MUTEX_MIGRATION_NAME }).count().gt(0)._query,
    r.error('mutex locked'),
    Migration.insert({
      hostname: os.hostname(),
      name: MUTEX_MIGRATION_NAME,
      date: new Date()
    })._query
  ).run();
};

exports.releaseMutex = function *() {
  const mutex = yield exports.queryMutex();

  if (!mutex) throw new Error('Mutex was not found');

  return yield mutex.delete();
};

exports.up = function *(name) {
  yield exports.acquireMutex();

  const migrations = yield exports.list();
  const pendingMigrations = migrations.filter(m =>
    !m.applied && (name ? m.name === name : true)
  );

  if (pendingMigrations.length < 1) throw new Error('No migration files found');

  for (let i = 0; i < pendingMigrations.length; i++) {
    const { up, name } = pendingMigrations[i];
    console.log('migrating', name);
    yield up();
    yield Migration.save({ name, date: new Date() });
  }

  yield exports.releaseMutex();
};

exports.down = function *(name) {
  yield exports.acquireMutex();

  const migrations = yield exports.list();
  const [migration] = migrations.filter(m => m.name === name);

  if (!migration) throw new Error('Could not find the migration');
  if (!migration.applied) throw new Error('This migration was never applied');
  if (!migration.down) throw new Error('This migration does not have a `down` option');

  console.log('rolling back', name);
  yield migration.down();

  const [record] = yield Migration.filter({ name }).run();
  if (record) yield record.delete();

  yield exports.releaseMutex();
};
