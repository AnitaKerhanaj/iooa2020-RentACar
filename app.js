//load modules
const express =require ('express');
const exphbs=require('express-handlebars');
const mongoose=require('mongoose');
//init app
const app=express();
//load Files
const keys=require('./config/keys');
const User=require('./models/user');

//connect to MongoDB
mongoose.connect(keys.MongoDB,{
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
app.get('/',(req,res)=>{
    res.render('home');
});
app.get('/about',(req,res)=>{
    res.render('about',{
        title: 'About'
    });
});
app.get('/contact', (req,res)=>{
    res.render('contact', {
        title: 'Contact Us'
    });
});
app.get('/signup', (req,res)=>{
    res.render('signupForm', {
        title: 'Register'
    });
});
app.listen(port,()=>{
    console.log(`Server is up on port ${port}`);
});