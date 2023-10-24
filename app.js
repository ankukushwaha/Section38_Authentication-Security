//jshint esversion:6
import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose"; 
import encryptedChildren from "mongoose-encryption";
import ejs from "ejs";

const port = 3000;
const app = express();

console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userNameDb");

const userSchema = new mongoose.Schema({
    Email: String, 
    Password: String
})

const secret = process.env.SECRET;
userSchema.plugin(encryptedChildren , {secret: secret, encryptedFields: ["Password"]});

const User = mongoose.model('User', userSchema);

app.get("/", (req,res) => {
    res.render("home.ejs");
})

app.get("/register", (req,res) => {
    res.render("register.ejs");
})

app.get("/login", (req,res) => {
    res.render("login.ejs");
})

app.post("/register", (req,res) => {
    const userName = req.body.username;
    const password = req.body.password;

    const userData = new User({
        Email: userName,
        Password: password
    })

    userData.save().then(() => res.render("secrets.ejs"))
    .catch((err) => console.log(err));
})

app.post("/login", (req,res) => {
    const userName = req.body.username;
    const password = req.body.password;

    User.findOne({Email: userName}).then((found) => {
        if(found){
            if(found.Password === password){
                res.render("secrets.ejs");
            }
            else{
                console.log("Your password is wrong.Please correct it!");
            }
        }
        else{
            console.log("Register first!");
        }
    })
    .catch((err) => console.log(err));
})


app.listen(port, (req,res) => {
    console.log(`Server started on port ${port}`);
})
