const EnumFields = require('../models/enumFields');
const functions = require('./factoryHandler');
const ApiFeat = require('../auxiliaries/apiFeat') //temporal, completar con los datos del apifeat de mi api anterior

const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');

// exports.createEnumField = functions.addEnumField(EnumFields);//temporal, revisar lo comentado en la ruta comentada que lleva a esta funcion
exports.getAllFields = functions.getAll(EnumFields);
exports.getEnumField = functions.getOne(EnumFields);
exports.deleteEnumField = functions.deleteOne(EnumFields);
exports.updateEnumField = functions.updateOne(EnumFields);

exports.getFilterData = functions.getAll(EnumFields);
// exports.getCategories = catchAsync(async (req, res, next) => {
//     const cats = await EnumFields.findOne({name: 'categorias'});
//     if(!cats) return next(new AppError('No categories found', 404));

//     res.status(200).json({
//         status: 'success',
//         data: cats,
//     })
// })