
var configs = [];

configs[0] = require('../configs/length');
configs[1] = require('../configs/server');

exports.index = function(req, res){
	res.json({length:configs[0].length,name:configs[1].server.NAME});
};