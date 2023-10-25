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

const port = 3000;
const app = express();

console.log(process.env.API_KEY);

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
    Password: String
})

// const secret = process.env.SECRET;
// userSchema.plugin(encryptedChildren , {secret: secret, encryptedFields: ["Password"]});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req,res) => {
    res.render("home.ejs");
})

app.get("/register", (req,res) => {
    res.render("register.ejs");
})

app.get("/login", (req,res) => {
    res.render("login.ejs");
})

app.get("/secrets", (req,res) => {
    if(req.isAuthenticated()){
        res.render("secrets.ejs");
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
