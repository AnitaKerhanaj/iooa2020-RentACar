//load modules
const express =require ('express');
const exphbs=require('express-handlebars');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const session=require('express-session');
const cookieParser=require('cookie-parser');
const passport=require('passport');
const bcrypt=require('bcryptjs');
//init app
const app=express();
//setup body parser middleware
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//configuration for Authentication
app.use(cookieParser());
app.use(session({
    secret:'mysecret',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
//load helpers
const{requireLogin,ensureGuest}=require('./helpers/authHelper');
//load passport
require('./passport/local');
//make user as a global object
app.use((req,res, next)=>{
    res.locals.user=req.user || null;
    next();
})

//load Files
const keys=require('./config/keys');
//load collections
const User=require('./models/user');
const Contact=require('./models/contact');

//connect to MongoDB
mongoose.connect(keys.MongoDB,{
    useUnifiedTopology: true,
    useNewUrlParser: true
},() =>{
    console.log('MongoDB is connected...');
});

//setup view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// connect client side to serve css and js files
app.use(express.static('public'));

//create port
const port= process.env.PORT || 3000;
//handle home route
app.get('/',ensureGuest,(req,res)=>{
    res.render('home');
});
app.get('/about',ensureGuest,(req,res)=>{
    res.render('about',{
        title: 'About'
    });
});
app.get('/contact',requireLogin, (req,res)=>{
    res.render('contact', {
        title: 'Contact Us'
    });
});
//save contact form data
app.post('/contact',requireLogin, (req,res)=>{
    console.log(req.body);
    const newContact={
        name: req.user._id,
        message: req.body.message
    }
    new Contact (newContact).save((err,user)=>{
        if(err){
            throw err;
        }else{
            console.log('We received message from user', user);
        }
    });
});
app.get('/signup',ensureGuest,(req,res)=>{
    res.render('signupForm', {
        title: 'Register'
    });
});
app.post('/signup',ensureGuest, (req,res)=>{
    console.log(req.body);
    let errors=[];
    if(req.body.password !== req.body.password2){
        errors.push({text: 'Passport does not match'});
    }
    if(req.body.password.length <5){
        errors.push({text:'Password must be at least 5 characters'});
    }
    if(errors.length>0){
        res.render('signupForm', {
            errors:errors,
            firstname:req.body.firstname,
            lastname: req.body.lastname,
            password: req.body.password,
            password2: req.body.password2,
            email: req.body.email
        })
    }else{
        User.findOne({email:req.body.email})
        .then((user)=>{
            if(user){
                let errors=[];
                errors.push({text: 'Email already exist!'});
                res.render('signupForm',{
                    errors:errors,
                    firstname:req.body.firstname,
                    lastname: req.body.lastname,
                    password: req.body.password,
                    password2: req.body.password2,
                    email: req.body.email
                });
            }else{
                //encrypt pass
                let salt=bcrypt.genSaltSync(10);
                let hash=bcrypt.hashSync(req.body.password,salt);

                const newUser={
                    firstname: req.body.firstname,
                    lastname:req.body.lastname,
                    email: req.body.email,
                    password: hash
                }
                new User(newUser).save((err,user)=>{
                    if(err){
                        throw err;
                    }
                    if(user){
                        let success=[];
                        success.push({text: 'You successfully created an account! You can login now'});
                        res.render('loginForm', {
                            success:success
                        })
                    }
                })
            }
        })
    }
});
app.get('/displayLoginForm',ensureGuest, (req,res)=> {
    res.render('loginForm',{
        title: 'Login'
    });
});
app.post('/login', passport.authenticate('local',{
    successRedirect:'/profile',
    failureRedirect: '/loginErrors'
}));
//display profile
app.get('/profile',requireLogin, (req,res)=>{
    User.findById({_id:req.user._id})
    .then((user)=>{
        res.render('profile', {
            user:user.toObject(),
            title: 'Profile'
        });
    });
});
// Error kod prijave
app.get('/loginErrors', (req,res)=>{
    let errors=[];
    errors.push({text:'User not found or password incorrect'});
    res.render('loginForm',{
        errors:errors.toObject,
        title: 'Error'
    });
});

//list a car route
app.get('/listCar',requireLogin, (req,res)=>{
    res.render('listCar', {
        title: 'Listing'
    });
});
app.post('/listCar', requireLogin, (req,res)=>{
    console.log(req.body);
    res.render('listCar2', {
        title: 'Finish'
    });
});
//logout
app.get('/logout', (req,res)=>{
    User.findById({_id:req.user._id})
    .then((user)=>{
        user.online=false;
        user.save((err,user)=> {
            if(err){
                throw err;
            }
            if(user){
                req.logout();
                res.redirect('/');
            }
        });
    });
});

app.listen(port,()=>{
    console.log(`Server is up on port ${port}`);
});