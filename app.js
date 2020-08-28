//load modules
const express =require ('express');
const exphbs=require('express-handlebars');
//init app
const app=express();

//setup view engine
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// connect client side to serve css and js files
app.use(express.static('public'));

//create port
const port=3000;
//handle home route
app.get('/',(req,res)=>{
    res.render('home',{
        title: 'Home'
    });
});
app.listen(port,()=>{
    console.log(`Server is up on port ${port}`);
});