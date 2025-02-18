const User = require('../models/user');
const functions = require('./factoryHandler')

const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');

//crud basico

exports.user = functions.getOne(User);
exports.updateUser = functions.updateOne(User)
exports.deleteUser = functions.deleteOne(User)
exports.getUsers = catchAsync(async (req,res,next) => {
    const fieldsRequired = 'username mail userRole'
    const info = await User.find().select(fieldsRequired).lean();
    res.status(200).json({
        status: 'success',
        data: info,
    })
})

exports.deactivateMe = catchAsync(async (req,res,next) => {
    await User.findByIdAndUpdate(req.params.id, {isActive: false});
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