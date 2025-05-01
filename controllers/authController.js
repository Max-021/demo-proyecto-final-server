const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const User = require('../models/user');
const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');
const Email = require('../auxiliaries/mail');

//funciones de jwt
const signToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    })
}
const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user.id);

    const cookieOps = {
        expires: new Date( Date.now() + process.env.JWT_COOKIE_EXP * 24 * 60 * 60 * 1000),
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production' ? (req.secure || req.headers['x-forwarded-proto'] === 'https') : false,
        secure: true,//ver cual de los dos me quedo, temporal
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Protección contra CSRF, temporal-----------revisar si poner 'strict' o 'lax'//temporal, solo para test en render
        // sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none', // Protección contra CSRF, temporal-----------revisar si poner 'strict' o 'lax'//temporal, es la que anda bien
        path: '/'
    };
    /*Evalúa sameSite dinámico según tus necesidades: Si tu cliente y servidor están en diferentes dominios (frontend y backend separados), 
    usa sameSite: 'none' y asegúrate de que la cookie sea secure. Si están en el mismo dominio, sameSite: 'strict' está bien.
    consejo de chatgpt 
    */console.log("token creado");

    user.password = undefined;//temporal, cambiar acá segun las necesidades del cliente estos campos
    user.role = undefined;
    if(process.env.NODE_ENV === 'production') cookieOps.secure = true;
    res.cookie('jwt', token, cookieOps);
    res.status(statusCode).json({
        status: 'success',
        token,//borrar para que no aparezca en prod
        data:{
            user: user._id,//revisar si mandar esto o no, temporal
        },
    });
    // res.send();//temporal, revisar al final si queda o no esto, el problema del guardado de cookies ya deberia estar resuelto con lo puesto en cookieOps
}

//aca van todas las funciones referidas a la sesion de usuario y a la creacion de usuarios
//la funcion de crear usuario, como es una funcion critica la desarrollo directamente, sin pasar por un factory o alguna otra cosa
exports.signup = catchAsync(async (req,res,next) => {
    const newUser = await User.create({
        username: req.body.username,
        mail: req.body.mail,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: req.body.password,
        passwordChangedAt: Date.now() - 1000,
        lastLogin: Date.now(),
        lastLoginIp: req.ip,
    });
    createSendToken(newUser, 201, req, res);
    const url = `${req.protocol}://${req.get("host")}/me`//revisar esto de la ruta que coincida con la pagina cliente y que la direccion sea de los datos del usuario, temporal
    //envio mail de bienvenida y confirmacion
    await new Email(newUser,url).sendWelcome();//temporal, revisar y completar la clase de mail

})

exports.alreadyLoggedIn = async (req, res, next) => {//revisar utilidad de esta funcion

    if(req.cookies.jwt){
        try{
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            const freshUser = await User.findById(decoded.id);

            if(!freshUser){
                console.log('fresh user not')
                return next(new AppError("The user belonging to this token no longer exists.", 401));
            }
            if(await freshUser.changedPasswordAfter(decoded.iat)){
                console.log('changed password')
                return next(new AppError("Password changed recently, please log in again.", 401));
            }
            //temporal, agregar algo que tenga un tiempo de expiracion a la cookie
            res.locals.user = freshUser;
            // return next();
            console.log('paso todas')
            res.status((200)).json({
                status: 'success',
                message:'logged',
                userInfo: {role: freshUser.role, username: freshUser.username}
            })
        }catch(error){
            res.status(200).json({
                status: 'success',
                message: 'No user logged in',
            })
            // return next(new AppError('No user logged in',404));
        }
    }else{
        res.status(200).json({
            status: 'success',
            message: 'No user logged in',
            userInfo: {role: 'none', username: ''}
        })
        // return next(new AppError(`Couldn't determine user status`,404));
    }
}

exports.login = catchAsync(async (req,res,next) => {
    const {mail,password} = req.body;

    if(!mail || !password) {
        return next(new AppError('Please provide email and/or password.',400));
    }
    const user = await User.findOne({mail}).select("+password");
    if(!user || !(await user.correctPassword(password, user.password))){
        console.log(user)
        return next(new AppError('Incorrect email or password.',401));
    }

    user.lastLogin = Date.now();
    user.lastLoginIp = req.ip;
    user.save({validateBeforeSave: false}).catch(console.error);

    createSendToken(user, 200, req, res);
})

exports.logout = catchAsync(async (req,res) => {
    res.cookie('jwt','logged out', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,//temporal, revisar este atributo si va y porque ponerlo
    })
    res.status(200).json({
        status: 'Logged out',
    });
});

exports.protect = catchAsync(async (req, res, next) => {
    console.log("Protect ejecutado en: "+req.originalUrl);

    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
        console.log('por headers')
    }else if(req.cookies.jwt){
        console.log('por COOKIES jwt')
        token = req.cookies.jwt;
    }

    if(!token){
        return next(new AppError('To perform this action you must have logged in.', 401));
    }

    //verifico el token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const freshUser = await User.findById(decoded.id)

    if(!freshUser){
        return next(new AppError("The user does not exist.",401));
    }

    //temporal, funcion comentada porque se supone que no funciona como deberia, corregir, también reveer pertinencia de dar este tipo de informacion
    // if(freshUser.changedPasswordAfter(decoded.iat)){
    //     return next(new AppError('Password changed recently, try again',401))
    // }
    console.log("viene bien")
    req.user = freshUser;
    // req.locals.user = freshUser;//temporal, revisar porque dice que no existe
    next();
})

exports.restrict = (...roles) => {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return next(new AppError(`You don't have permission.`, 403));
      }
      next();
    }
  }  

exports.getUserInfo = catchAsync(async (req,res,next) =>{

    const fieldsNeeded = 'username mail role firstName lastName'//temporal, ver si muevo esto a un mejor lugar y tambien revisar la adaptabilidad a más/distintos campos de esta configuracion
    //para que funcione de manera mas óptima
    if(req.cookies.jwt){
        const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
        const freshUser = await User.findById(decoded.id,fieldsNeeded);
        if(!freshUser){
            return next(new AppError("The user belonging to this token no longer exists", 401));
        }
        res.status(200).json({
            status:'success',
            data: freshUser,
        })

    }
})

exports.passwordForgotten = catchAsync(async (req, res, next) => {
    const user = await User.findOne({mail: req.body.mail});

    if(!user){
        return next(new AppError("The provided email doesn't belong to any user",404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    try {//revisar la url completa para refactorizarla por el tema de cambio de rutas/versiones
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
        // await new Email //corregir y actualizar esto
        await new Email(user, resetUrl).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent via email',
        });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save({validateBeforeSave: false});

        return next(new AppError('An error ocurred sending the email, please try again in a few minutes'));
    }
})

exports.retryPassword = catchAsync(async (req, res, next) => {

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now()},
    });
    if(!user){
        return next(new AppError("Token expired or invalid token"));
    }

    user.password = req.body.password;
    // user.confPassword = req.body.confPassword;//revisar la importancia de esto, el campo no existe en el modelo
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, req, res);//revisar porqué solo res
})

exports.updatePassword = catchAsync(async (req, res, next) => {
    const {password, newPassword, newPasswordConfirm} = req.body;    
    if(!password || !newPassword || !newPasswordConfirm)        return next(new AppError("You must send current, new, and confirmed new password.",400));
    if(newPassword !== newPasswordConfirm)                      return next(new AppError("The new password and its confirmation doesn't match.", 400));
    if(password === newPassword)                                return next(new AppError('Your new password must be different from the current one.', 400));

    const user = await User.findById(req.user.id).select('+password');
    if(!user)                                                   return next(new AppError('User not found.',404));
    if(!(await user.correctPassword(password, user.password)))  return next(new AppError('Incorrect password.',401));

    user.password = newPassword;
    await user.save();
    return createSendToken(user, 200, req, res);
})