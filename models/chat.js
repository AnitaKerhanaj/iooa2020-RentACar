const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const chatSchema= new Schema({
    posiljatelj: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    primatelj: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    date: {
        type: Date,
        default: Date.now
    },
    posiljateljProcitao:{
        type: Boolean,
        default: false
    },
    primateljProcitao: {
        type:Boolean,
        default: false
    },
    dialogue: [{
        posiljatelj: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        primatelj: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        posiljateljPoruka: {
            type: String
        },
        primateljPoruka: {
            type: String
        },
        posiljateljProcitao: {
            type: Boolean,
            default: false
        },
        primateljProcitao: {
            type:Boolean,
            default: false
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
});
module.exports=mongoose.model('Chat', chatSchema);