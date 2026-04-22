require("dotenv").config();
var createError = require('http-errors');
var express = require('express');
const cors = require("cors");
const mongoose = require("mongoose");
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan')
const expressSession=require('express-session');
var usersRouter = require('./routes/users');
const passport = require('passport');
const LocalStrategy = require("passport-local");
const Patient = require("./models/patient");


var app = express();
app.use(cors({
      origin: "https://mediverse-sigma.vercel.app"
})); 

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));

app.use(expressSession({
      resave:false,
      saveUninitialized:false,
      secret:"hey hey hey"

}))
/* Passport config */
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Patient.authenticate()));

passport.serializeUser(Patient.serializeUser());
passport.deserializeUser(Patient.deserializeUser());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use("/api/auth",usersRouter);
console.log("Users router loaded");
app.get("/api/test", (req, res) => res.json({ ok: true }));
app.use("/api/hospitals", require("./routes/hospitals"));
app.use("/api/appointments", require("./routes/appointments"));  
app.use("/api/hospital/profile", require("./routes/hospitalProfile"));
app.use("/api/medications", require("./routes/medications"));    
app.use("/api/documents", require("./routes/documents"));  
 app.use("/api/ai", require("./routes/ai"));
app.use("/api/hospital/appointments", require("./routes/hospitalAppointments"));

// mongoose connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

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
