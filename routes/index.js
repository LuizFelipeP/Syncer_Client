var express = require('express');
const {join} = require("node:path");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(join(__dirname, '../public/index.html'));
});

module.exports = router;
