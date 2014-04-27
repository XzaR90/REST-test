
var configs = [];
configs[0] = require('../configs/database');

var fs        = require('fs')
  , path      = require('path')
  , Sequelize = require('sequelize')
  , lodash    = require('lodash')
  
  , sequelize = new Sequelize(configs[0].sql.DATABASE, configs[0].sql.USERNAME, configs[0].sql.PASSWORD,
		{
			host: configs[0].sql.HOSTNAME,
			port: configs[0].sql.PORT
		}
	)
	
  , db        = {}

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
  })

Object.keys(db).forEach(function(modelName) {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db)
  }
})

module.exports = lodash.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db)
