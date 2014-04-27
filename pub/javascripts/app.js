
var BlogConfigs = Backbone.Model.extend({
	urlRoot: '/configs',
	elementID:'#blogapp'
});

var bConfig = new BlogConfigs();
bConfig.fetch({
error: function(configs){

	var errorMessage = "Could not load the configs from the server.";
	$blogapp = $(configs.elementID);
	if($blogapp)
	{
		$blogapp.html(errorMessage);
		return;
	}
	
	alert(errorMessage);
	
},

success: function(configs){

	var confs = configs.toJSON();
	
	var BlogAuth = Backbone.Model.extend({
		urlRoot: '/authenticate',
		defaults: {
			authorized:false
		}
	});
	
	var bAuth = new BlogAuth();
	bAuth.fetch();

	var BlogPost = Backbone.Model.extend({
		validate: function( attributes )
		{
			var confs = configs.toJSON();
		
			if(attributes.title == 'undefined' || attributes.title == '')
			{
				return "Please enter a blog title.";
			}
			
			if(attributes.title.length < confs.length.TITLE_MIN)
			{
				return "The blog title is too short. Minimum characters is " + confs.length.TITLE_MIN + ".";
			}

			if(attributes.title.length > confs.length.TITLE_MAX)
			{
				return "The blog title is too long. Maximum characters is " + confs.length.TITLE_MAX + ".";
			}
			
			if(attributes.textContent == 'undefined' || attributes.textContent == '')
			{
				return "Please write some content for your blog post.";
			}
			
			if(attributes.textContent.length < confs.length.CONTENT_MIN)
			{
				return "The blog content is too short. Minimum characters is " + confs.length.CONTENT_MIN + ".";
			}
			
			if(attributes.textContent.length > confs.length.CONTENT_MAX)
			{
				return "The blog content is too long. Maximum characters is " + confs.length.CONTENT_MAX + ".";
			}
		}
	});

	var BlogPostCollection = Backbone.Collection.extend({
		model: BlogPost,
		url: "/posts",
		
		initialize: function(){
		
			this.selectedSortBy = 'createdAt';
			this.orderByDESC = true;
			this.fetch();
		},
		
		sortWith:function(orderBy,orderByDESC,a,b)
		{
			if(!a || !b || typeof a.get(orderBy) == 'undefined' || typeof b.get(orderBy) == 'undefined') return 0;
			
			switch(orderBy)
			{
				case 'textContent':
				case 'title':
					var aCase = a.get(orderBy).toUpperCase();
					var bCase = b.get(orderBy).toUpperCase();
					
					if(aCase == bCase)
						return 0;
					
					if(orderByDESC)
						return (aCase < bCase) ? 1 : -1;
						
					return (aCase > bCase) ? 1 : -1;
					break;
				default:
				
					var aCase = a.get(orderBy);
					var bCase = b.get(orderBy);
					
					if(orderBy == 'createdAt' || orderBy == 'updatedAt')
					{
						aCase = moment(aCase);
						bCase = moment(bCase);
					}
					
					if(orderByDESC)
						return bCase - aCase;
						
					return aCase - bCase;
					break;
			}
			
			return 0;
		},
		
		comparator:function(a,b)
		{
			return this.sortWith(this.selectedSortBy,this.orderByDESC,a,b);
		},
		
		sortPosts:function(property,desc)
		{
			this.selectedSortBy = property || this.selectedSortBy;
			this.orderByDESC = desc || this.orderByDESC;
			this.sort();
		},
		
		deletePost:function(id)
		{
			var model = this.get(id);
			if(model)
			{
				if(model.destroy())
					return true;
			}
			
			return false;
		},
		
		createPost:function(title,content)
		{
			if(this.create
			(
				{
					title 		: title,
					textContent : content
				}, 
			
				{
					validate: true,
					success: $.proxy(function(model, data){
						this.sortPosts();
					}, this)
				}
			)) return true;
			
			return false;
		},
		
		editPost:function(id,title,content)
		{
			var model = this.get(id);
			if(model){
			
				if(model.save({
				
					title 		: title,
					textContent : content
					
				})) return true;
			}
			
			return false;
		}
	});

	var BlogView = Backbone.View.extend({
		initialize: function(){
		
			this.collection.on("add remove change sort", _.bind(this.renderPosts, this));
			this.collection.on("remove", _.bind(this.renderRecentUpdates, this));
			this.collection.on("invalid", _.bind(this.renderStatusFormError, this));
			
			this.menu = 
			[
				{link:'#',title:'Home'},
				{link:'#posts',title:'Posts'}
			];
			
			this.single = -1;
			
			bAuth.on("add remove change reset",_.bind(this.renderMenu, this));
			
			this.renderFormCreate();
			this.renderFormLogin();
			
			Handlebars.registerHelper("dateFormated", function (dateString) {
			
				return moment(dateString).format('YYYY-MM-DD, HH:mm:ss, Z');
			});
			
			Handlebars.registerHelper("timeAgo", function (dateString) {
			
				return moment(dateString).fromNow();
			});
		},
		
		templateMenu: Handlebars.compile(($("#menu-tpl").html())),
		templatePosts: Handlebars.compile(($("#post-tpl").html())),
		templateRecentUpdates: Handlebars.compile(($("#recent-updates-tpl").html())),
		templateFormCreate: Handlebars.compile(($("#form-create-tpl").html())),
		templateFormEdit: Handlebars.compile(($("#form-edit-tpl").html())),
		templateFormLogin: Handlebars.compile(($("#form-login-tpl").html())),
		
		events:{
		
			'submit form.formLogin' 		: 'login',
			'submit form.formPostCreate' 	: 'postCreate',
			'submit form.formPostEdit' 		: 'postEdit',
			'click a.delete' 				: 'postDelete'
		},
		
		login : function(e)
		{
			e.preventDefault();
			var t = e.target;
			
			bAuth.save({username:e.target.username.value,password:e.target.password.value},
				{
					success: $.proxy(function(auth){
					
						if(auth.get('authorized'))
						{
							t.reset();
							Backbone.history.navigate('#create',{trigger:true});
						}
							
					}, this)
				}
			);
			
			bAuth.unset("password");
			
		},
		
		postCreate: function(e){
		
			e.preventDefault();
			var t = e.target;
			
			if(this.collection.createPost(t.title.value,t.content.value))
			{
				this.printStatusForm('Successfully created a new entry.');
				t.reset();
			}
		},
		
		postEdit: function(e){
		
			e.preventDefault();
			var t = e.target;
			
			if(this.collection.editPost(t.id.value,t.title.value,t.content.value))
			{
				this.printStatusForm('Successfully edited the entry.');
			}
		},
		
		postDelete: function(e){
		
			e.preventDefault();
			if(!bAuth.get('authorized')) return;
			
			var id = e.target.getAttribute('data-id');
			if(id)
			{
				var bDelete = window.confirm("Do you really want to delete this entry?");
				if(bDelete)
				{
					var navigate = (id == this.single) ? true : false;
					if(this.collection.deletePost(id))
					{
						this.printStatusHeader('Successfully deleted the entry.');
						if(navigate)
							Backbone.history.navigate('posts',{trigger:true});
					}
				}
			}
		},
		
		renderMenu: function()
		{
			if(bAuth.get('authorized'))
			{
				this.menu[2] = {link:'#create',title:'Add'};
				this.menu[3] = {link:'#logout',title:'Logout',class:'logout'};
			}
			else
			{
				if(this.menu[2] && this.menu[3])
					this.menu.splice(2,2);
			}
		
			var html = this.templateMenu({items: this.menu});
			this.$el.find(".blogMenu").html(html);
		},
		
		renderPosts: function(){
		
			var posts = [];
			if(this.single != -1){
			
				var post = this.collection.get(this.single);
				if(post)
				{
					post = post.toJSON();
					posts = [post];
					
					var html = this.templateFormEdit(post);
					this.$el.find(".containerFormEdit").html(html);
				}
				else
					this.single = -1;
			}
			
			if(posts.length == 0)
			{
				posts = this.collection.toJSON();
			}
			
			var html = this.templatePosts({items: posts, authorized:bAuth.get('authorized')});
			this.$el.find(".containerArticles").html(html);
		},
		
		renderStatusFormError: function(model,message)
		{
			this.printStatusForm(message,1);
		},
		
		printStatusHeader: function(message,error){
			
			var $el = this.$el.find("p.blogStatusHeader");
			this.renderStatus(message,error,$el);
			
		},
		
		printStatusForm: function(message,error){
		
			var $el = this.$el.find("p.blogStatusForm");
			this.renderStatus(message,error,$el);
		},
		
		renderStatus: function(message,error,$el){
		
			var message = message || "";
			
			if(error == 1){
			
				$el.removeClass("success");
				$el.addClass("failure");
			}
			else if(error == -1){
				$el.removeClass("failure");
				$el.removeClass("success");
			}
			else
			{
				$el.removeClass("failure");
				$el.addClass("success");
			}
		
			$el.html(message);
		
		},
		
		renderFormCreate: function(){
		
			var html = this.templateFormCreate({items: {}});
			this.$el.find(".containerFormCreate").html(html);
		},
		
		renderFormLogin: function(){
		
			var html = this.templateFormLogin({items: {}});
			this.$el.find(".containerFormLogin").html(html);
		},
		
		renderRecentUpdates: function(){
		
			posts = _.sortBy(this.collection.toJSON(),function(m){
			
				return -(moment(m.updatedAt));
			
			});
			
			var html = this.templateRecentUpdates({items: posts.slice(0,5)});
			this.$el.find(".containerRecentUpdates").html(html);
		},
		
		hideSidebar: function(widgets){
		
			var $sidebar = this.$el.find(".containerPanel");
			if($sidebar)
			{
				this.$el.find(".containerArticles").addClass('responsive');
				
				$sidebar.hide();
				$sidebar.children().each(function(){
					  $(this).hide();
				});
				
				if(widgets)
				{
					$.each(widgets,function(key,value){
					
						$sidebar.find(value).show();
					
					});
				}
				
				return $sidebar;
			}
			
			return false;
		},
		
		showSidebar: function(widgets){
		
			var $sidebar = this.$el.find(".containerPanel");
			if($sidebar)
			{
				this.$el.find(".containerArticles").removeClass('responsive');
				
				$sidebar.show();
				$sidebar.children().each(function(){
					  $(this).show();
				});
				
				if(widgets)
				{
					$.each(widgets,function(key,value){
					
						$sidebar.find(value).hide();
					
					});
				}
				
				return $sidebar;
			}
			
			return false;
		}
	});

	var BlogRouter = Backbone.Router.extend({
		routes:
		{
			"edit(/:id)" 	: "editView",
			"single(/:id)" 	: "postView",
			"create" 		: "createView",
			"logout" 		: "logoutView",
			"posts" 		: "postsView",
			"" 				: "homeView"
		},
		
		initialize: function(){
		
			this.on("all",_.bind(this.resetView, this));
			
			this.collection = new BlogPostCollection();
			this.collection.once("sync",function(){Backbone.history.start();});
			
			this.view = new BlogView({el: configs.elementID,collection: this.collection, router: this });
		},
		
		postsView:function(){
		
			this.defaultRoute();
			this.view.hideSidebar();
		},
		
		homeView:function(){
		
			this.defaultRoute();
			
			var hide = ['.containerFormCreate','.containerFormEdit'];
			if(bAuth.get('authorized'))
				hide.push('.containerFormLogin');
			
			this.view.showSidebar(hide);
			this.view.renderRecentUpdates();
		},
		
		defaultRoute:function(){
		
			this.view.single = -1;
			this.view.renderPosts();
		},
		
		postView:function(id){
		
			this.view.single = id;
			this.view.renderPosts();
			this.view.hideSidebar();
		},
		
		editView:function(id){
		
			if(!bAuth.get('authorized')) return;
			
			this.view.single = id;
			this.view.renderPosts();
			
			var hide = ['.containerFormCreate','.containerRecentUpdates','.containerFormLogin'];
			this.view.showSidebar(hide);
			
		},
		
		createView:function(){
		
			if(!bAuth.get('authorized')) return;
			
			this.view.renderPosts();
			var hide = ['.containerFormEdit','.containerRecentUpdates','.containerFormLogin'];
			this.view.showSidebar(hide);
		},
		
		resetView:function(){
		
			this.view.printStatusHeader();
			this.view.printStatusForm();
		},
		
		logoutView : function(){
		
			bAuth.destroy({success: $.proxy(function(auth){
			
				bAuth.fetch({success:function(model){
					
					Backbone.history.navigate('',{trigger:true});
				
				}});
			
			},this)});
		}
		
	});

	(function(){

		var router = new BlogRouter();

	})();
	
}});

