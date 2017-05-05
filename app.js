var express = require('express');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

//set up db connection
mongoose.connect(process.env.MONGO_DB);
var db = mongoose.connection;
db.once("open",function () {
  console.log("DB connected!");
});
db.on("error",function (err) {
  console.log("DB ERROR :", err);
});

//model setting
var postSchema = mongoose.Schema({
  title: {type:String, required:true},
  body: {type:String, required:true},
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date
});
var Post = mongoose.model('post',postSchema);

var userSchema = mongoose.Schema({
  email: {type:String, required:true, unique:true},
  nickname: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  createdAt: {type:Date, default:Date.now}
});
var User = mongoose.model('user',userSchema);

//view setting
app.set("view engine", "ejs");

//set middleware
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());

app.use(session({secret:'MySecret'}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

var LocalStrategy = require('passport-local').Strategy;
passport.use('local-login',
  new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  },
    function(req, email, password, done) {
      User.findOne({ 'email' : email }, function(err, user) {
        if (err) return done(err);

        if (!user) {
          req.flash("email", req.body.email);
          return done(null, false, req.flash('loginError', 'No user found.'));
        }
        if (user.password != password) {
          req.flash("email", req.body.email);
          return done(null, false, req.flash('loginError', 'Password does not Match.'));
        }
        return done(null, user);
      });
    }
  )
);

//set routes
app.get('/posts', function (req,res) {
  Post.find({}).sort('-createdAt').exec(function (err,posts) {
    if(err) return res.json({success:false, message:err});
    res.render("posts/index", {data:posts});
  });
}); //index
app.get('/posts/new', function (req,res) {
  res.render("posts/new");
}); //new
app.post('/posts', function (req,res) {
  Post.create(req.body.post, function (err,post) {
    if(err) return res.json({success:false, message:err});
    res.redirect('/posts');
  });
}); //create
app.get('/posts/:id', function (req,res) {
  Post.findById(req.params.id, function (err,post) {
    if(err) return res.json({success:false, messsage:err});
    res.render("posts/show", {data:post});
  });
}); //show
app.get('/posts/:id/edit', function (req,res) {
  Post.findById(req.params.id, function (err,post) {
    if(err) return res.json({success:false, messsage:err});
    res.render("posts/edit", {data:post});
  });
}); //edit
app.put('/posts/:id', function (req,res) {
  req.body.post.updatedAt=Date.now();
  Post.findByIdAndUpdate(req.params.id, req.body.post, function (err,post) {
    if(err) return res.json({success:false, message:err});
    res.redirect('/posts/'+req.params.id);
  });
}); //update
app.delete('/posts/:id', function (req,res) {
  Post.findByIdAndRemove(req.params.id, function (err,post){
    if(err) return res.json({success:false, message:err});
    res.redirect('/posts');
  });
}); //destroy

app.get('/', function (req,res) {
  Data.findOne({name:"myData"},function (err,data) {
    if(err) return console.log("Data ERROR:",err);
    data.count++;
    data.save(function (err) {
      if(err) return console.log("Data ERROR:",err);
      res.render('main',data);
    });
  });
});

app.get('/hello', function (req,res) {
  res.render('hello');
  console.log('get request');
});

//start server
app.listen(3000, function () {
  console.log('Server on!');
});
