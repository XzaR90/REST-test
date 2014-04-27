
/**
 * Module dependencies.
 */

var configs = [];
configs[0] = require('./configs/server');
configs[1] = require('./configs/session');
 
var express = require('express');
var routes 	= require('./routes');

var rAuthenticate 	= require('./routes/authenticate');
var rConfigs 		= require('./routes/configs');
var rPosts 			= require('./routes/posts');


var http = require('http');
var path = require('path');
var db = require('./models')

var app = express();

// all environments
app.set('port', process.env.PORT || configs[0].server.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.cookieParser());
app.use(express.session({secret: configs[1].session.SECRET}));

app.use(express.favicon());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, '../pub')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/configs', rConfigs.index);

app.get('/authenticate', rAuthenticate.check);
app.get('/authenticate/:id', rAuthenticate.check);
app.post('/authenticate', rAuthenticate.login);
app.put('/authenticate/:id', rAuthenticate.login);
app.delete('/authenticate/:id', rAuthenticate.logout);

app.get('/posts', rPosts.index);
app.get('/posts/:id', rPosts.single);
app.post('/posts', rPosts.create);
app.put('/posts/:id', rPosts.update);
app.delete('/posts/:id', rPosts.destroy);

db
	.sequelize
	.sync()
	.complete(function(err){
	
		if (err){

			throw err
		}
		else
		{
			http.createServer(app).listen(app.get('port'), function(){
			
				console.log('['+ configs[0].server.NAME +']Express server listening on port ' + app.get('port') + '.');
			})
		}
	});
