
const express =require ('express');
const exphbs=require('express-handlebars');
const {allowInsecurePrototypeAccess}=require('@handlebars/allow-prototype-access');
const handlebars=require('handlebars');
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const session=require('express-session');
const cookieParser=require('cookie-parser');
const passport=require('passport');
const bcrypt=require('bcryptjs');
const formidable=require('formidable');
const socketIO=require('socket.io');
const http=require('http');

//init app
const app=express();
//setup body parser middleware
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//konfiguracija za autentikaciju
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
const {upload}=require('./helpers/aws');
//load passport
require('./passport/local');
//user kao globalni objekt
app.use((req,res, next)=>{
    res.locals.user=req.user || null;
    next();
})

//load datoteka
const keys=require('./config/keys');
//load stripe
const stripe=require('stripe')(keys.StripeSecretKey);
//load kolekcije
const User=require('./models/user');
const Contact=require('./models/contact');
const Car=require('./models/car');
const car = require('./models/car');
const Chat=require('./models/chat');
const Rezervacija=require('./models/rezervacija');
const { parse } = require('path');

//povezivanje s bazom MongoDB
mongoose.connect(keys.MongoDB,{
    useUnifiedTopology: true,
    useNewUrlParser: true
},() =>{
    console.log('MongoDB is connected...');
});

//prikaz
app.engine('handlebars', exphbs({
    handlebars: allowInsecurePrototypeAccess(handlebars)
}));
app.set('view engine', 'handlebars');

//spajanje klijentske strane za css i js
app.use(express.static('public'));

//kreiranje porta
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
//spremanje kontakta
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
            console.log('Zaprimili smo poruku od korisnika', user);
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
        errors.push({text: 'Lozinke se ne podudaraju'});
    }
    if(req.body.password.length <5){
        errors.push({text:'Lozinka mora sadržavati najmanje 5 znakova'});
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
                //encrypt lozinku
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
                        success.push({text: 'Uspješno ste se registrirali! Prijavite se'});
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
//profil
app.get('/profile',requireLogin, (req,res)=>{
    User.findById({_id:req.user._id})
    .then((user)=>{
        res.render('profile', {
            user:user,
            title: 'Profile'
        });
    });
});
// Error kod prijave
app.get('/loginErrors', (req,res)=>{
    let errors=[];
    errors.push({text:'Korisnik nije pronađen ili je lozinka netočna'});
    res.render('loginForm',{
        errors:errors,
        title: 'Error'
    });
});

//list a car
app.get('/listCar',requireLogin, (req,res)=>{
    res.render('listCar', {
        title: 'Listing'
    });
});
app.post('/listCar', requireLogin, (req,res)=>{
    const newCar={
        owner: req.user._id,
        make: req.body.make,
        model: req.body.model,
        year: req.body.year,
        type: req.body.type
    }
    new Car(newCar).save((err,car)=>{
        if(err){
            throw err;
        }
        if (car){
            res.render('listCar2', {
                title: 'Finish',
                car:car
            });
        }
    })
});
app.post('/listCar2',requireLogin, (req,res)=>{
    Car.findOne({_id:req.body.carID,owner:req.user._id})
    .then((car)=>{
        let imageUrl={
            imageUrl:`https://rentt-app.s3.amazonaws.com/${req.body.image}`
        };
        car.cijenaPoDanu=req.body.cijenaPoDanu;
        car.location=req.body.location;
        car.slikainfo= `https://rentt-app.s3.amazonaws.com/${req.body.image}`;
        car.image.push(imageUrl);
        car.save((err,car)=>{
            if(err){
                throw err;
            }
            if(car){
                res.redirect('/showCars');
            }
        })
    })
});
app.get('/showCars', requireLogin, (req,res)=>{
    Car.find({})
    .populate('owner')
    .sort({date:'desc'})
    .then((cars)=>{
        res.render('showCars', {
            cars:cars
        })
    })
})

//receive image
app.post('/uploadImage', requireLogin, upload.any(), (req,res) => {
    const form = new formidable.IncomingForm();
    form.on('file', (field,file)=>{
        console.log(file);
    });
    form.on('error', (err) => {
        console.log(err);
    });
    form.on('end', () => {
        console.log('Slika uspješno primljena');
    });
    form.parse(req);
});

//Odjava
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

//google mapa
app.get('/openGoogleMap', (req,res)=>{
    res.render('googlemap');
});
//prikazi informacije o autu na infowindow
app.get('/prikaziAuto/:id', (req,res)=>{
    Car.findOne({_id:req.params.id}).then((car)=>{
        res.render('prikaziAuto',{
            car:car
        });
    }).catch((err)=>{console.log(err)});
})
//stranica profila vlasnika auta
app.get('/kontaktOwner/:id',(req,res)=>{
    User.findOne({_id:req.params.id})
    .then((owner)=>{
        res.render('vlasnikProfil',{
            owner:owner
        })
    }).catch((err)=>{
        console.log(err)});
})
//Iznajmiti auto
app.get('/RentCar/:id', (req,res)=>{
    Car.findOne({_id:req.params.id})
    .then((car)=>{
        res.render('izracunaj', {
            car:car
        })
    }).catch((err)=>{console.log(err)});
})
// Izracunat ukupno POST 
app.post('/izracunajUkupno/:id', (req,res)=>{
    Car.findOne({_id:req.params.id})
    .then((car)=>{
        console.log(req.body);
        var dan=parseInt(req.body.dan);
        var sat=parseInt(req.body.sat);
        var tjedan=parseInt(req.body.tjedan);
        //console.log('Tip sat je ', typeof(hour));
        var ukupnoDana=dan*car.cijenaPoDanu;
        var ukupno=ukupnoDana;
        console.log('Ukupno: ', ukupno);
        //KREIRANJE REZERVACIJE
        const rezervacija={
            carID: req.params.id,
            ukupno:ukupno,
            renter: req.user._id,
            date:new Date()
        }
        new Rezervacija(rezervacija).save((err,rezervacija)=>{
            if(err){
                console.log(err);
            }
            if(rezervacija){
                Car.findOne({_id:req.params.id})
                .then((car)=>{
                    //ukupno racunanje za stripe
                    var stripeUkupno=rezervacija.ukupno*100;
                    res.render('checkout',{
                        rezervacija:rezervacija,
                        car:car,
                        StripePublishableKey:keys.StripePublishableKey,
                        stripeUkupno:stripeUkupno
                    })
                }).catch((err)=>{console.log(err)});
            }
        })
    })
})
//naplacivanje kupcu
app.post('/placanje/:id', (req,res)=>{
    Rezervacija.findOne({_id:req.params.id})
    .populate('renter')
    .then((rezervacija)=>{
        const amount=rezervacija.ukupno*100;
        stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken
        })
        .then((customer)=>{
            stripe.charges.create({
                amount:amount,
                description:`${rezervacija.ukupno}kn za iznajmljivanje auta`,
                currency: 'usd',
                customer:customer.id,
                receipt_email: customer.email
            },(err,charge)=>{
                if(err){
                    console.log(err);
                }
                if(charge){
                    console.log(charge);
                    res.render('uspjesno', {
                        charge:charge,
                        rezervacija:rezervacija
                    })
                }
            })
        }).catch((err)=>{console.log(err)});
    }).catch((err)=>{console.log(err)});
})

//soket konekcija
const server=http.createServer(app);
const io=socketIO(server);
//spajanje na kljenta
io.on('connection', (socket)=> {
    console.log('Povezan s klijentom');
    //handle chat room route
    app.get('/chatVlasnik/:id', (req,res)=>{
       Chat.findOne({posiljatelj:req.params.id, primatelj:req.user._id})
       .then((chat)=>{
           if(chat){
               chat.date=new Date(),
               chat.posiljateljProcitao= false;
               chat.primateljProcitao=true;
               chat.save()
               .then((chat)=>{
                   res.redirect(`/chat/${chat._id}`);
               }).catch((err)=>{
                   console.log(err)});
           }else{
               Chat.findOne({posiljatelj:req.user._id,primatelj:req.params.id})
               .then((chat)=>{
                        if(chat){
                            chat.posiljateljProcitao=true;
                            chat.primateljProcitao=false;
                            chat.date=new Date()
                            chat.save()
                            .then((chat)=>{
                                res.redirect(`/chat/${chat._id}`);
                            }).catch((err)=>{console.log(err)});
                        }else{
                            const newChat={
                                posiljatelj: req.user._id,
                                primatelj: req.params.id,
                                date: new Date()
                            }
                            new Chat(newChat).save().then((chat)=>{
                                res.redirect(`/chat/${chat._id}`);
                            }).catch((err)=>{ console.log(err)});
                    }
               }).catch((err)=>{console.log(err)});
           }
       }).catch((err)=>{console.log(err)});
    });
    //chat-id ruta
    app.get('/chat/:id', (req,res)=>{
        Chat.findOne({_id:req.params.id})
        .populate('posiljatelj')
        .populate('primatelj')
        .populate('dialogue.posiljatelj')
        .populate('dialogue.primatelj')
        .then((chat)=>{
            res.render('chatRoom',{
                chat:chat
            })
        }).catch((err)=>{console.log(err)});
    })
    //POST zahtjev za /chat/id
    app.post('/chat/:id', (req,res)=>{
        Chat.findById({_id:req.params.id})
        .populate('posiljatelj')
        .populate('primatelj')
        .populate('dialogue.posiljatelj')
        .populate('dialogue.primatelj')
        .then((chat)=>{
            const newDialogue={
                posiljatelj: req.user._id,
                date: new Date(),
                posiljateljPoruka: req.body.poruka
            }
            chat.dialogue.push(newDialogue)
            chat.save((err,chat)=>{
                if(err){
                    console.log(err);
                }
                if(chat){
                    Chat.findOne({_id:chat._id})
                    .populate('posiljatelj')
                    .populate('primatelj')
                    .populate('dialogue.posiljatelj')
                    .populate('dialogue.primatelj')
                    .then((chat)=>{
                        res.render('chatRoom',{chat:chat});
                    }).catch((err)=>{console.log(err)});
                }
            })

        }).catch((err)=>{console.log(err)});
     })
    //object id event
    socket.on('ObjectID',(oneCar)=>{
        console.log('Jedan auto: ', oneCar);
        Car.findOne({
            owner: oneCar.userID,
            _id: oneCar.carID
        })
        .then((car)=>{
            socket.emit('car',car);
        }).catch((err)=>{console.log(err)});
    });
    //pronalazak auta i slanje na mapu
    Car.find({}).then((cars)=>{
        socket.emit('allcars',{cars:cars});
    }).catch((err)=>{
        console.log(err);
    });
    //slušat event da uzme lat i lng
    socket.on('LatLng', (data)=>{
        console.log(data);
        //pronac objekt auto i ažurirati širinu i dužinu zempljpisnu
        Car.findOne({owner:data.car.owner})
        .then((car)=>{
            car.coords.lat=data.data.results[0].geometry.location.lat;
            car.coords.lng=data.data.results[0].geometry.location.lng;
            car.save((err,car)=>{
                if(err){
                    throw err;
                }
                if(car){
                    console.log('Zemljopisna sirina i duzina su azurirane!')
                }
            })
        }).catch((err)=>{
            console.log(err);
        });
    });

    //vi odspajanje
    socket.on('disconnect', (socket)=>{
        console.log("Odspajanje od klijenta");
    });
});
server.listen(port,()=>{
    console.log(`Server is up on port ${port}`);
});