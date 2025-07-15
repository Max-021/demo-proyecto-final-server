const EnumFields = require('../models/enumFields');
const functions = require('./factoryHandler');

// exports.createEnumField = functions.addEnumField(EnumFields);//temporal, revisar lo comentado en la ruta comentada que lleva a esta funcion
exports.getAllFields = functions.getAll(EnumFields);
exports.getEnumField = functions.getOne(EnumFields);
exports.deleteEnumField = functions.deleteOne(EnumFields);
exports.updateEnumField = functions.updateOne(EnumFields);

exports.getFilterData = functions.getAll(EnumFields);