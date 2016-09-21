const { Router } = require('express');
const { createRouter } = require('../utils/router');
const users = require('../controllers/users');

const serialize = user => {
  const data = Object.assign({}, user);
  delete data.password;
  return data;
};

const customRouter = new Router()
  .post('/signin', function *(req, res) {
    const { user, token } = yield users.signin(req.body.email, req.body.password);
    res.json({ token, user: serialize(user) });
  })
  .post('/signout', function *(req, res) {
    res.json(yield users.signout(req.body));
  });

const defaultRouter = createRouter(users, serialize);
customRouter.socket = defaultRouter.socket;

customRouter.use(defaultRouter);

module.exports = customRouter;
