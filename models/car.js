const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const carSchema=new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    make: {
        type: String
    },
    model: {
        type: String
    },
    year: {
        type: Number
    },
    type: {
        type: String
    },
    cijenaPoDanu: {
        type: Number
    },
    image: [{
        imageUrl: {
            type: String
        }
    }],
    location: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    coords: {
        lat: {
            type: Number
            },
        lng: {
            type: Number
            }
    },
    slikainfo: {
        type: String
    }
});
module.exports=mongoose.model('Car',carSchema);