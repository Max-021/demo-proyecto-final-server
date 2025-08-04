const EnumFields = require('../models/enumFields');
const functions = require('./factoryHandler');

exports.getAllFields = functions.getAll(EnumFields);
exports.getEnumField = functions.getOne(EnumFields);
exports.deleteEnumField = functions.deleteOne(EnumFields);
exports.updateEnumField = functions.updateOne(EnumFields);

exports.getFilterData = functions.getAll(EnumFields);