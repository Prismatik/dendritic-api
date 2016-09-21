const { createRouter } = require('../utils/router');
const <%= camelCasePlural %> = require('../controllers/<%= snakeCasePlural %>');

module.exports = createRouter(<%= camelCasePlural %>);
