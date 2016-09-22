const { Router } = require('express');
const { createRouter } = require('../utils/router');
const users = require('../controllers/users');

const serialize = user => {
  const data = Object.assign({}, user);
  delete data.password;
  return data;
};

module.exports = createRouter(users, serialize)
  .post('/signin', function *(req, res) {
    const { user, token } = yield users.signin(req.body.email, req.body.password);
    res.json({ token, user: serialize(user) });
  })
  .post('/signout', function *(req, res) {
    res.json(yield users.signout(req.body));
  });
