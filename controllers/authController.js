const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {promisify} = require('util');
const User = require('../models/user');
const catchAsync = require('../auxiliaries/catchAsync');
const passwordValidation = require('../auxiliaries/pwdValidations');
const AppError = require('../auxiliaries/appError');
const Email = require('../auxiliaries/mail');
const { userInfo } = require('os');

const signToken = (id) => jwt.sign({id}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN, })

const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user.id);

    const cookieOps = {
        expires: new Date( Date.now() + process.env.JWT_COOKIE_EXP * 24 * 60 * 60 * 1000),
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production' ? (req.secure || req.headers['x-forwarded-proto'] === 'https') : false,
        secure: true,
        // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Protección contra CSRF, temporal-----------revisar si poner 'strict' o 'lax'//temporal, solo para test en render
        sameSite: 'none', // Protección contra CSRF, temporal-----------revisar si poner 'strict' o 'lax'//temporal, solo para test en render
        path: '/',
    };
    /*Evalúa sameSite dinámico según tus necesidades: Si tu cliente y servidor están en diferentes dominios (frontend y backend separados), 
    usa sameSite: 'none' y asegúrate de que la cookie sea secure. Si están en el mismo dominio, sameSite: 'strict' está bien. consejo de chatgpt */
    res.cookie('jwt', token, cookieOps);
    setTimeout(() => {
        console.log('esperando');
        
        res.status(statusCode).json({
            status: 'success',
            data:{ user: user._id, name: user.username, },
        });
    }, 5000);
}

//aca van todas las funciones referidas a la sesion de usuario y a la creacion de usuarios
//la funcion de crear usuario, como es una funcion critica la desarrollo directamente, sin pasar por un factory o alguna otra cosa
exports.signup = catchAsync(async (req,res,next) => {
    const newUser = await User.create({
        username: req.body.username,
        mail: req.body.mail,
        firstName: req.body.firstName || '',
        lastName: req.body.lastName || '',
        password: req.body.password,
        passwordChangedAt: Date.now() - 1000,
        lastLogin: Date.now(),
        lastLoginIp: req.ip,
    });
    const url = `${req.protocol}://${req.get("host")}/me`//revisar esto de la ruta que coincida con la pagina cliente y que la direccion sea de los datos del usuario, temporal
    //envio mail de bienvenida y confirmacion
    await new Email(newUser,url).welcome();//temporal, revisar y completar la clase de mail
    
    createSendToken(newUser, 201, req, res);//esto siempre al final por el res.status de la funcion
})
exports.createUser = catchAsync(async (req,res,next) => {
    const newUser = new User({
        username: req.body.username,
        mail: req.body.mail,
        role: req.body.role || 'user',
    })
    const resetToken = newUser.createPasswordResetToken();
    await newUser.save({validateBeforeSave: false});

    const baseUrl = process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL?.trim() : process.env.DEV_URL?.trim();
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    try {
        await new Email(newUser, resetUrl).passwordReset();
    } catch (error) {
        newUser.passwordResetToken = undefined;
        newUser.passwordResetExpires = undefined;
        await newUser.save({validateBeforeSave: false});
        return next(new AppError('An error ocurred sending the email, please try again in a few minutes', 500));
    }
    
    const {_id: userId, username} = newUser
    res.status((201)).json({
        status: 'success',
        message:'user created',
        data: { userId, username },
    })
})

exports.alreadyLoggedIn = async (req, res, next) => {//revisar utilidad de esta funcion
    if(!(req.cookies.jwt)){
        return res.status(200).json({
            status: 'success',
            data: {
                message: 'No user logged in',
                userInfo: {role: 'none', username: '', id: ''},
            },
        })
    }
    try{
        const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
        const freshUser = await User.findById(decoded.id);
        const cookieOps = {httpOnly: true, secure: true, sameSite: 'none'};

        if(!freshUser){
            console.log('fresh user not')
            res.clearCookie('jwt', cookieOps);
            return next(new AppError("The user belonging to this token no longer exists.", 401));
        }
        if(await freshUser.changedPasswordAfter(decoded.iat)){
            console.log('changed password')
            res.clearCookie('jwt', cookieOps);
            return next(new AppError("Password changed recently, please log in again.", 401));
        }
        if(freshUser.status === 'inactive' || freshUser.status === 'suspended') {
            res.clearCookie('jwt', cookieOps);
            return res.status(200).json({status: 'success', data: { message: 'logged out', userInfo: {role: '', username: '', id: ''}}});
        }
        return res.status((200)).json({
            status: 'success',
            data: {
                message:'logged',
                userInfo: {role: freshUser.role, username: freshUser.username, id: freshUser.id}
            },
        })
    }catch(error){
        return res.status(200).json({
            status: 'success',
            data: {    
                message: 'No user logged in',
                userInfo: {role: '', username: '', id: ''},
            },
        })
    }
}

exports.login = catchAsync(async (req,res,next) => {
    const {mail,password} = req.body;
    mail.trim();
    password.trim();

    if(!mail || !password) return next(new AppError('Please provide email and/or password.',400));

    const user = await User.findOne({mail}).select("+password");
    
    if(!user || !(await user.correctPassword(password, user.password))) return next(new AppError('Incorrect email or password.',401));

    if(user.status === 'suspended') return next(new AppError(`This account is suspended. You can't login while in this condition.`, 403));
    
    if(user.status === 'inactive') {
        user.status = 'active';
        await new Email(user, '').userActivation();
    }

    user.lastLogin = Date.now();
    user.lastLoginIp = req.ip;
    user.save({validateBeforeSave: false}).catch(console.error);
    const safeUser = {...user.toObject(), password: undefined, role: undefined, id: user._id};

    createSendToken(safeUser, 200, req, res);
})

exports.logout = catchAsync(async (req,res) => {
    res.cookie('jwt','logged out', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
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

    if(!token) return next(new AppError('To perform this action you must have logged in.', 401));

    //verifico el token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const freshUser = await User.findById(decoded.id)

    if(!freshUser) return next(new AppError("The user does not exist.",401));

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

    const baseUrl = process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL?.trim() : process.env.DEV_URL?.trim();
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;
    try {
        await new Email(user, resetUrl).passwordReset();
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('An error ocurred sending the email, please try again in a few minutes.', 500));
    }

    console.log(resetUrl)
    res.status(202).json({
        status: 'success',
        data: {
            message: 'Token sent via email',
            ...(process.env.NODE_ENV !== 'production' && {resetUrl}),
        }
    });
})
exports.resetPassword = catchAsync(async (req,res,next) => {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword)  return next(new AppError('Both password and confirmation are required', 400));
    if (password !== confirmPassword)   return next(new AppError('Passwords do not match', 400));

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest('hex');

    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});
    if(!user) return next(new AppError('Invalid or expired token', 400));

    user.password = password;
    user.passwordChangedAt = Date.now();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();
    createSendToken(user, 200, req, res);
})
exports.validateResetToken = catchAsync(async (req,res,next) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest('hex');
    
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now()}});

    if(!user) return next(new AppError("Invalid or expired token", 400));
    
    res.status(200).json({status: 'success'});
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
    user.passwordChangedAt = Date.now();
    await user.save();
    return createSendToken(user, 200, req, res);
})

exports.restrictToSelf = catchAsync(async (req,res,next) => {
    if(req.user.id !== req.params.id) return next(new AppError(`You don't have permission to perform this action`, 403));
    next();
})

exports.validatePasswordRules = catchAsync(async (req,res,next) => {//es un middleware que desarrollé pero dejé de usarlo porque moví la lógica de validación dentro del modelo de mongoose
    const {password} = req.body;
    let token = req.params.token || null; 
    let user;

    if(token) {
        const hashedToken = crypto.createHash("sha256").update(req.params.token).digest('hex');        
        user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now()}});
        if(!user) return next(new AppError('Token invalid or expired.', 400));
    }else{
        return this.protect(req,res,next);
    }
    const errors = passwordValidation.checkGeneralPasswordRules(password, user);
    if (errors.length) {
    return next(new AppError(errors.join('\n'), 400));
    }

    req.user = user;
    next();
})

exports.validatePasswordStatus = catchAsync(async (req,res,next) => {
    const {password} = req.body;
    const {username, mail, firstName, lastName} = req.user;
    console.log(password)

    if(passwordValidation.isDerivedFromUser(password, {username, mail, firstName, lastName})) return next(new AppError('Password cannot be derived from other user information', 400));
    if(passwordValidation.isWeakPassword(password)) return next(new AppError('The password is weak, and could be easily compromised', 400));

    console.log('OK!')
    res.status(200).json({
        status: 'success',
        data: {message: 'Password is Ok!'},
    })
})