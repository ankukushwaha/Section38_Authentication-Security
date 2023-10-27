//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose"; 
// import encryptedChildren from "mongoose-encryption"; 
// import md5 from 'md5'; 
import ejs from "ejs";
// import bcryptjs from 'bcryptjs';
// const saltRounds = 10;
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from "mongoose-findorcreate";
import { Strategy as GitHubStrategy } from 'passport-github2';

const port = 3000;
const app = express();

// console.log(process.env.API_KEY); 

app.use(express.static("public"));
app.set('view engine', ejs);
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userNameDb");

const userSchema = new mongoose.Schema({
    Email: String, 
    Password: String,
    googleId: String,
    githubId: String,
    secret: String
})

// const secret = process.env.SECRET;
// userSchema.plugin(encryptedChildren , {secret: secret, encryptedFields: ["Password"]});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser((user, cb) => {
    process.nextTick(() => {
      return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" 
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile); 
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: "http://localhost:3000/auth/github/secrets"
  },
  function(accessToken, refreshToken, profile, done) {
    // console.log(profile); 
    User.findOrCreate({ githubId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get("/", (req,res) => {
    res.render("home.ejs");
})

app.get("/auth/google", 
    passport.authenticate("google", {scope: ['profile']})
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get('/auth/github',
   passport.authenticate('github', { scope: [ 'user:email' ] })
);

app.get('/auth/github/secrets', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
});

app.get("/register", (req,res) => {
    res.render("register.ejs");
})

app.get("/login", (req,res) => {
    res.render("login.ejs");
})

app.get("/secrets", (req,res) => {
    User.find({"secret": {$ne : null}}).then((foundUser => {
        if(foundUser){
            res.render("secrets.ejs", {userWithSecrets: foundUser});
        }
    })).catch((err) => console.log(err));
})

app.get("/submit", (req,res) => {
    if(req.isAuthenticated()){
        res.render("submit.ejs");
    }
    else{
        res.redirect("/login");
    }
})

app.get("/logout", (req,res) => {
    req.logout(function(err) {
        if (err) { console.log(err); }
        res.redirect('/');
    });
})

app.post("/submit", (req,res) => {
    const secretToSubmit = req.body.secret;
    // console.log(req.user); 
    const id = req.user;
    User.findById(id).then((found) => {
        if(found){
            found.secret = secretToSubmit;
            found.save().then(() => {
                res.redirect("/secrets");
            })
        }
    }).catch((err) => console.log(err));
})

app.post("/register", (req,res) => {
    const userName = req.body.username;
    const password = req.body.password;

        // Store hash in your password DB.

    User.register({username: userName}, password).then((user) => {
        passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
        })
    })
    .catch((err) =>  {
       console.log(err);
       res.redirect("/register");
    });
})

app.post("/login", (req,res) => {
    const userName = req.body.username;
    const password = req.body.password;

    const user = new User({
        username: userName,
        password: password
    });

    req.login(user, function(err){
        if(err) {
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            })
        }
    })
})


app.listen(port, (req,res) => {
    console.log(`Server started on port ${port}`);
})
