const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const rezervacijaSchema=new Schema({
    carID: {
        type: Schema.Types.ObjectId,
        ref: 'Car'
    },
    ukupno: {
        type: Number
    },
    renter: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now
    }
});
module.exports=mongoose.model('rezervacija', rezervacijaSchema);