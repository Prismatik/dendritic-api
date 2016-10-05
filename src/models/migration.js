const { thinky } = require(`${process.cwd()}/config`);

module.exports = thinky.createModel('_migrations', {
  hostname: String,
  name: String,
  date: Date
});
