const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

const salt = 12;
const enumRole = ['admin', 'user', 'editor',];
const enumStatus = ['active', 'inactive', 'suspended','locked'];

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
        required: [function() { return !this.passwordResetToken; }, 'A user must have a password.'],
    },
    role: {
        type: String,
        enum: enumRole,
        default: 'user',
    },
    firstName: {
        type: String,
        trim: true,
        default:'',
    },
    lastName: {
        type: String,
        trim: true,
        default:'',
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    lastLoginIp:{
        type: String,
        default: null,
        validate: {
            validator: (ip) => ip === null || validator.isIP(ip),
            message: props => `${props.value} is not a valid Ip address.`
        },
    },
    status: {
        type: String,
        enum: enumStatus,
        default: 'active',
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
},
{
    timestamps:true,
})

userSchema.pre('save',async function (next) {
    //temporal, revisar la documentacion de bcrypt para saber como mejorar esto, en el github tienen mejores datos
    if(!this.isModified('password') || typeof this.password !== 'string') return next();
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

// userSchema.pre(/^find/, function (next){//lo dejo comentado porque manejo esto en el login devolviendo bien los errores
//     this.find({status: {$ne: 'suspended'}})
//     next();
// })
userSchema.statics.getAllowedRoles = function() {
    const rolesList = this.schema.path('role').enumValues;
    const filteredRoles = rolesList.filter(role => role !== 'admin');
    return filteredRoles;
};

userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword)
}
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
      return JWTTimestamp < changedTimestamp; // true = la pwd cambió después de emitir el JWT
    }
    return false;
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
/* campos posibles para definir el modelo de usuario
username: nombre de usuario
email/mail: correo
password: almacenar cifrada -------- salt: para reforzar el cifrado, usar siempre, no como campo en el modelo
twoFactor: posible mejora a futuro, ver que campos usar
passwordChangedAt: Date,
passwordResetToken: String, //estos 3 para los cambios de contraseña
passwordResetExpires: Date,

firstName, lastName: campos de info del usuario
displayName: opcional para mostrar en el front//poco probable que lo use
avatarUrl: posible imagen de perfil, ver como combinar con multer
birthDate: autoexplicativo
gender: ????si sirve

phone: ver si lo aplico junto con el twoFactor
address, city, province, zipCode, country
language,

role
status, ver si reemplazo el isActive por esto, que vendria con un enum [active, inactive, suspended y alguna mas]

agregar  { timestamps: true} al final del objeto 

lastLogin: con fecha para revisar el tema de log con cookies
lastLoginIp: opcional de seguridad


*/