const EnumFields = require('../models/enumFields');
const functions = require('./factoryHandler');

const catchAsync = require('../auxiliaries/catchAsync');
//revisar estos dos despues por si tengo que borrarlos
const AppError = require('../auxiliaries/appError');

// const foo = () =>{
//     EnumFields.schema.pathType
// }


exports.createEnumField = functions.addEnumField(EnumFields);

exports.getAllFields = functions.getAll(EnumFields);

exports.getEnumField = functions.getOne(EnumFields);
exports.updateEnumField = functions.updateOne(EnumFields);
exports.deleteEnumField = functions.deleteOne(EnumFields);