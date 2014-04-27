
var configs = [];
configs[0] = require('../configs/length');

module.exports = function(sequelize, DataTypes) {
  var Post = sequelize.define('Post', {
  
		title 		: {type: DataTypes.STRING, validate: {len: [configs[0].length.TITLE_MIN,configs[0].length.TITLE_MAX]}},
		textContent : {type: DataTypes.TEXT, validate: {len: [configs[0].length.CONTENT_MIN,configs[0].length.CONTENT_MAX]}}
	},
	{timestamps: true}
  );
  
  return Post
}


