const migration = require('../../migrations/<%= migrationName %>');

describe('migrations <%= migrationName %>', () => {
  it('should migrate up', function *() {
    yield migration.up();

    // FIXME write a test to ensure the up function works as expected
  });

  it('should migrate down', function *() {
    yield migration.down();

    // FIXME write a test to ensure the down function works as expected
  });
});
