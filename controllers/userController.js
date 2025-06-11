const User = require('../models/user');
const functions = require('./factoryHandler')

const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');
const Email = require('../auxiliaries/mail');

exports.user = functions.getOne(User);
exports.updateUser = functions.updateOne(User)
exports.deleteUser = functions.deleteOne(User)
exports.getUsers = catchAsync(async (req,res,next) => {
    const fieldsRequired = 'username mail role status'//getUserInfo en authController tiene una lista parecida, revisar
    const info = await User.find().select(fieldsRequired).lean();
    res.status(200).json({
        status: 'success',
        data: info,
    })
})

exports.deactivateMe = catchAsync(async (req,res,next) => {
    const user = await User.findByIdAndUpdate(req.params.id, {status: 'inactive'});
    await new Email(user, '').userDeactivation();
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
exports.getRoles = catchAsync(async (req,res,next) =>{
    const roles = User.getAllowedRoles();

    res.status(200).json({
        status: 'success',
        data: {roles}
    })
})

exports.toggleSuspension = catchAsync(async (req,res,next) => {
    console.log(req.body)//temporal, fijarse de poder recibir y enviar por mail un motivo de suspensión
    const { _id, status } = req.body;
    if (! _id || ! status) return next(new AppError('Some fields are missing, retry.', 400));

    let newStatus;
    if (status === 'active') {
        newStatus = 'suspended';
    } else if (status === 'suspended') {
        newStatus = 'active';
    } else {
        return next(new AppError(`Cannot toggle status from "${status}".`, 400));
    }

    const user = await User.findByIdAndUpdate(_id, { status: newStatus }, { new: true });
    if (!user) return next(new AppError('User not found.', 404));
    if (newStatus === 'suspended') {
        await new Email(user, '').userSuspension();
    } else {
        await new Email(user, '').userActivation();
    }

    return res.status(200).json({
        status: 'success',
        data: { user: user.username, status: user.status, },
    });
})

exports.changeUserRole = catchAsync(async (req,res,next) => {
    console.log(req.body)
    if(!req.body._id) return next(new AppError('An error ocurred and some fields are missing, retry.',400));
    
    const updatedUser = await User.findByIdAndUpdate(req.body._id, {role: req.body.role}, {new: true})
    if(!updatedUser) return next(new AppError('No user found with this id.', 404));
    await new Email(updatedUser, '', updatedUser.role).updatedRole();

    res.status(200).json({
        status: 'success',
        data: { user: updatedUser.username,role: updatedUser.role, }
    })
})