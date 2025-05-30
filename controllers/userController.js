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
    if(!req.body._id || !req.body.status) return next(new AppError('An error ocurred and some fields are missing, retry.',400));
    
    let suspendedUser;
    if(req.body.status === 'suspended') {
        suspendedUser = await User.findByIdAndUpdate(req.body._id, {status: 'active'}, {new: true});
        await new Email(suspendedUser, '').userActivation();
    }else if(req.body.status === 'active') {
        suspendedUser = await User.findByIdAndUpdate(req.body._id, {status: 'suspended'}, {new: true});
        await new Email(suspendedUser, '').userSuspension();
    } 

    if(!suspendedUser) return next(new AppError('No user found with this id.', 404));
    
    res.status(200).json({
        status: 'success',
        data: {
            user: suspendedUser.username,
            status: suspendedUser.status,
        }
    })
      const { _id, status } = req.body;
    if (!_id || !status) {
        return next(new AppError('Some fields are missing, retry.', 400));
    }

    let filter, update;
    if (status === 'active') {
        filter = { _id, status: 'active' };
        update = { status: 'suspended' };
    } else if (status === 'suspended') {
        filter = { _id, status: 'suspended' };
        update = { status: 'active' };
    } else {
        return next(new AppError(`Cannot toggle status from "${status}".`, 400));
    }

    const user = await User.findOneAndUpdate(filter, update, { new: true });
    if (!user) {
        return next(new AppError('User not found or status not allowed for toggle.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
        user: user.username,
        status: user.status,
        },
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
        data: {
            user: updatedUser.username,
            role: updatedUser.role,
        }
    })
})