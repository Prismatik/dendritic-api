const { createRouter } = require('../utils/router');
const <%= camelCasePlural %> = require('../controllers/<%= snakeCasePlural %>');

const serialize = <%= camelCase %> => Object.assign({}, <%= camelCase %>);

module.exports = createRouter(<%= camelCasePlural %>, serialize);
