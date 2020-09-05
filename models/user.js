const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const userSchema=new Schema({
    facebook:{
        type:String
    },
    google: {
        type: String
    },
    firstname:{
        type: String
    },
    lastname: {
        type: String
    },
    image: {
        type: String,
        default: '/image/userLogo.jpg'
    },
    email: {
        type: String
    },
    password:{
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    online: {
        type:Boolean,
        default:false
    }
}, {
    toObject: {
        virtuals:true,
    },
    toJSON:{
        virtuals: true,
    },
});

module. exports=mongoose.model('User', userSchema);