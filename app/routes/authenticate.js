
var configs = [];
configs[0] = require('../configs/auth');

exports.login = function(req, res){

	req.session.authorized = false;
	if(req.body.username == configs[0].auth.USERNAME && req.body.password === configs[0].auth.PASSWORD)
	{
		req.session.authorized = true;
		console.log("User have been authorized.");
	}
	
    res.json({id:1,authorized:req.session.authorized});
	
};

exports.logout = function(req, res){
  
	req.session.authorized = false;
    res.json({id:1,loggedOut:true});
	
};

exports.check = function(req, res){
  
	var authorized = false;
	if(req.session.authorized)
		authorized = true;
		
    res.json({id:1,authorized:authorized});
	
};

