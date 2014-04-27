
var configs = [];
configs[0] = require('../configs/server');

exports.index = function(req, res){
  res.render('index', { title: configs[0].server.NAME });
};