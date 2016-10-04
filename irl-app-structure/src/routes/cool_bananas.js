const { createRouter } = require('../utils/router');
const coolBananas = require('../controllers/cool_bananas');

module.exports = createRouter(coolBananas);
