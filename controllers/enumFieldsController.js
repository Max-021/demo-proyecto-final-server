const EnumFields = require('../models/enumFields');
const functions = require('./factoryHandler');
const ApiFeat = require('../auxiliaries/apiFeat') //temporal, completar con los datos del apifeat de mi api anterior

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

exports.getCategories = catchAsync(async (req, res, next) => {
    const features = new ApiFeat(EnumFields.find({}), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

    const doc = await features.query;
    res.status(200).json({
        status: 'success',
        data: doc[0].category,//solo la lista de categorias
    })
})