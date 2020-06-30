var express = require('express');
var secured = require('../../middleware/secured');
var router = express.Router();

/* GET user profile. */
router.get('/user', secured(), function (req, res, next) {
  res.locals.user = req.user;
  console.log("user info", res.locals.user);
  res.json(res.locals.user);
});

module.exports = router;
