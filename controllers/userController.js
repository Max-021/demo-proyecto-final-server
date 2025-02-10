const User = require('../models/user');
const functions = require('./factoryHandler')

const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');

//crud basico

exports.user = functions.getOne(User);
exports.updateUser = functions.updateOne(User)
exports.deleteUser = functions.deleteOne(User)
exports.getUsers = functions.getAll(User)//revisar si hace falta esto, por las dudas lo puse en acceso restringido, hay que estar logueado y con permisos de administrador

exports.deactivateMe = catchAsync(async (req,res,next) => {
    await User.findByIdAndUpdate(req.user.id, {isActive: false});
    res.status(204).json({
        status: 'success',
        data: null,
    });
})


//temporal, revisar funcion getMe y que hace en mi 3dprintsApi
exports.getMe = (req, res, next) => {
    req.params.id = req.user._id;
    next();
}