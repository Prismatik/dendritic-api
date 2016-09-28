const { createRouter } = require('../utils/router');
const users = require('../controllers/users');

const serialize = user => {
  const data = Object.assign({}, user);
  delete data.password;
  return data;
};

module.exports = createRouter(users, serialize)
  .post('/signin', function *(req, res) {
    const { email, password } = req.body;
    const { user, token } = yield users.signin(email, password);
    res.json({ token, user: serialize(user) });
  })
  .post('/signout', function *(req, res) {
    res.json(yield users.signout(req.body));
  });
