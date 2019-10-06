const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const passport = require('passport');
const rateLimit = require("express-rate-limit");

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const readmeRouter = require('./routes/readme');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Handle Sessions
app.use(session({
  secret:'idc herzliya',
  saveUninitialized: true,
  resave: true,
  cookie: {maxAge: 1000 * 60 * 5, httpOnly: true}
}));

// DDos Protection
// Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
// see https://expressjs.com/en/guide/behind-proxies.html
// app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use(limiter);

// Passport
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));

// express-messages
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// alternate between logged in and logged out
app.get('*', function(req, res, next){
  res.locals.user = req.user || null;
  res.locals.session = req.session;
  res.locals.session.selectedItem = req.query.selectedItem;
  next();
});

// Routers
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/readme', readmeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
