
var db = require('../models')

exports.index = function(req, res){

	db.Post.findAll().success(function(posts) {
	
		res.json(posts);
	})
};

exports.single = function(req, res){

	db.Post.find(req.params.id).success(function(post) {
	
		res.json(post);
	});
};

exports.create = function(req, res){

	if(!req.session.authorized) return;

	db.Post.create(req.body).complete(function(err, post){
	
		res.json(post);
	});
};

exports.update = function(req, res){

	if(!req.session.authorized) return;

	var tempPost = db.Post.build(req.body);
	var tempPostErrors = tempPost.validate();
  
	if(!tempPostErrors){
	
		  db.Post.find(req.params.id).success(function(post){
		  
			post.updateAttributes(req.body).success(function(post){
			
				res.json(post);
			})
		});
	}
};

exports.destroy = function(req, res){

	if(!req.session.authorized) return;

	db.Post.find(req.params.id).success(function(post){

		post.destroy().success(function(){
			res.json({deleted:true});
		})
	});
};

