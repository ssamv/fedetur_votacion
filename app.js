const express = require('express'),
      morgan = require('morgan'),
      mysql = require('mysql'),
      myConnection = require('express-myconnection'),
      session = require('express-session'),
      ejs = require('ejs');

var app = express();
var port = 3001;
var path = require('path');

app.set('views', __dirname + '/views')
app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');

// importing routes
const mainRoutes = require('./routes/main');

// middlewares
app.use(morgan('dev'));
app.use(myConnection(mysql, {
  host: '209.182.205.179',
  user: 'n796545_votacion',
  password: 'Swaper2021$$',
  database: 'n796545_votacion',
  port: 3306
}, 'request'));
app.use(express.urlencoded({extended: true}));

//session
app.use(session({
  secret: 'Fedetur$Swaper$2021',
  resave: true,
  saveUninitialized: true
}));

// routes
app.use('/', mainRoutes);

// archivos estaticos img/css/js
app.use(express.static('public'));


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});