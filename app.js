var express = require('express');
var app = express();

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

app.get('/hello', function (req,res) {
  res.render('hello');
  console.log('get request');
});

app.listen(3000, function(){
  console.log('Server on!');
});
