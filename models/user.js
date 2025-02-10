const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const salt = 12;

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true,'A user must have a username'],
        trim: true,
    },
    mail:{
        type: String,
        unique: true,
        required:[true,'A user must have an email'],
        validate: [validator.isEmail, 'Please use a valid email']
    },
    password: {
        type: String,//temporal, revisar, tengo que ver que medidas de seguridad pongo aca + tambien ver otros lugares para proteger
        minlength: 8,
        required: [true,'A user must have a password'],
    },
    userRole: {
        type: String,
        enum: ['admin','user'],
        default: 'user',
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    isActive: {
        type: Boolean,
        default: true,
        select: false,
    },
})

userSchema.pre('save',async function (next) {

    //temporal, revisar la documentacion de bcrypt para saber como mejorar esto, en el github tienen mejores datos
    this.password = await bcrypt.hash(this.password, salt);

    next();
})

userSchema.pre(/^find/, function (next){
    this.find({isActive: {$ne: false}})
    next();
})

userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword)
}

userSchema.methods.changedPasswordAfter = async function(JWTTimeStamp){
    if(this.passwordChangedAt) {
        const changedTimeStamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        //temporal, el return false queda porque se supone de lo que hice antes que el JWTTimeStamp < changedTimeStamp; no funciona como deberia revisar esto
        // return false;
        // return JWTTimeStamp < changedTimeStamp;
        if(JWTTimeStamp > changedTimeStamp){
            //cookie es mas reciente
            return false
        }else{
            //cookie es mas vieja que el cambio de pwd
            return true
        }
    }else{
        return true
    }
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;