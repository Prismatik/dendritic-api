const { router } = require('../../../src');
const coolBananas = require('../controllers/cool_bananas');

module.exports = router.create(coolBananas);
