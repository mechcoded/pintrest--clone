const express = require('express');
const path = require('path');
const expressSession = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const app = express();

// 🔗 Models
const User = require('./routes/users');

// 📦 Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// 📦 Static files
app.use(express.static(path.join(__dirname, 'public')));

// 💾 Session middleware
app.use(expressSession({
  secret: "What the helly",
  resave: false,
  saveUninitialized: false,
}));

// 🔐 Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// 🌍 Views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 🛣️ Routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// 📌 Optional: set nav globally if needed
app.use((req, res, next) => {
  res.locals.nav = false; // You can dynamically toggle based on req.user if needed
  next();
});

// ✅ Final export
module.exports = app;
