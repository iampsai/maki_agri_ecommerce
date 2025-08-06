const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    phone:{
        type:String,
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
    },
    images:[
        {
            type:String,
            required:true
        }
    ],
    billingAddress:{
        fullName: {
            type: String,
            default: ''
        },
        country: {
            type: String,
            default: ''
        },
        streetAddressLine1: {
            type: String,
            default: ''
        },
        streetAddressLine2: {
            type: String,
            default: ''
        },
        city: {
            type: String,
            default: ''
        },
        state: {
            type: String,
            default: ''
        },
        zipCode: {
            type: String,
            default: ''
        },
        phoneNumber: {
            type: String,
            default: ''
        },
    },
    role:{
        type: String,
        enum: ['admin', 'staff', 'user'],
        default: 'user',
    },
    isAdmin:{
        type: Boolean,
        default: false,
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    otp:{
        type:String
    },
    otpExpires:{
        type:Date
    },
    date: {
        type: Date,
        default: Date.now
    },
},{timeStamps:true})

userSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

userSchema.set('toJSON', {
    virtuals: true,
});

exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;
