var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var Comment = require("./models/comment.js");
var Article = require("./models/article.js");
var request = require("request");
var cheerio = require("cheerio");

var Promise = require("bluebird");

var PORT = process.env.PORT || 3000;

mongoose.Promise = Promise;

var app = express();


app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));


app.engine("handlebars", exphbs({
	defaultLayout: "main"
}));
app.set("view engine", "handlebars");

app.use(express.static("public"));

mongoose.connect("mongodb://heroku_jjhpmd04:v8v92rufumnqmfni7qqnmcg9s1@ds039880.mlab.com:39880/heroku_jjhpmd04");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

app.get("/", function(req, res) {  
  request("https://tytnetwork.com/", function(error, response, html) {   

    var $ = cheerio.load(html);  

    $(".rpwe-title").each(function(i, element) {      
      var result = {};      
      result.title = $(this).text();
      result.link = $(this).children("a").attr("href"); 

Article.count({title: result.title}, function (err, count) {
     	if (count == 0) {
		    var entry = new Article(result);	  
		    entry.save(function(err, doc) {
		       
		      if (err) {
		        console.log(err);
		      }
		      else {
		        console.log(doc);
		      }
		    });
	  	}
    });

    });
  });
  res.redirect("/articles");
});

app.get("/articles", function(req, res) {
 
  	Article.find({})
	.populate("comment")
    
    .exec(function(error, doc) {
     
      if (error) {
        res.send(error);
      }
    }).then(function(data) {
		
		var articleObj = {articles: data};
		console.log(articleObj);
		
		res.render("articles", articleObj);
	});
});


app.post("/submit/:id", function(req, res) {  
	var addComment = new Comment(req.body);  
  addComment.save(function(error, doc) {
   
    if (error) {
      console.log(error);
    }
    
    else {
     
      Article.findOneAndUpdate({"_id": req.params.id}, { $push: { "comment": doc._id } }, { new: true }, function(err, newdoc) {
        if (err) {
          res.send(err);
        }
        else {
          res.redirect("/articles");
        }
      });
    }
  });
});

app.post("/delete/:id", function(req, res) {
  Comment.findOneAndRemove({"_id": req.params.id}, function(error, removed) {
       if (error) {
      res.send(error);
    }
     else {
      res.redirect("/articles");
    }
  });
});

app.listen(PORT, function() {
  console.log("App running on port 3000!");
});