const _ = require('lodash')
const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');
const ApiFeat = require('../auxiliaries/apiFeat') //temporal, completar con los datos del apifeat de mi api anterior

//revisar, temporal
//revisar que cuando se creen no se creen duplicados de los ya existentes, ver si lo puedo dejar como una validacion opcional
// exports.createOne = (Model, newData) => ?????????????
exports.createOne = (Model) => 
    catchAsync(async (req, res, next) => {
        // const doc = await Model.create(newData); ??????????????????????
        const doc = await Model.create(req.body);

        res.status(201).json({
            status:'success',
            data: {
                data: doc,
            },
        });
});

//revisar, temporal
exports.getAll = (Model) =>
    catchAsync(async (req,res,next) => {

        //para permitir rutas anidadas, temporal REVISAR
        let filter = {}
        if(req.params.id) filter = {item: req.params.id};
        //ejecutar query, temporal REVISAR
        const features = new ApiFeat(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const doc = await features.query;

        res.status(200).json({
            status: 'success',
            results: doc.length,
            data: doc
        });
})

//revisar, temporal
exports.getOne = (Model,popOps) =>
    catchAsync(async (req,res,next) => {
        //completar
        console.log("Por aca")
        let query = Model.findById(req.params.id)
        if(popOps) query = query.populate(popOps);
        const doc = await query;
        
        //404
        if(!doc) {
            next(new AppError("No document found with this ID",404))
        }

        //si sale
        res.status(200).json({
            status: 'success',
            data: doc,
        });
});

//revisar, temporal
exports.deleteOne = (Model) =>
    catchAsync(async (req,res,next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        //404 errors
        if(!doc) {
            next(new AppError('No document found with this Id', 404));
        }
        res.status(204).json({
            status: 'success',
            data: null,
        })
})

exports.updateOne = (Model) =>
    catchAsync(async (req,res,next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        //404 errors
        if(!doc) {
            next(new AppError('No document found with this Id', 404));
        }

        res.status(200).json({
            status: 'success',
            data: doc
        })
})

//este es para devolver el modelo del documento
exports.getJustOne = (Model) => catchAsync(async (req,res,next) => {
    const {updatedAt, createdAt, ...rest} = Model.schema.obj
    res.status(200).json({
        status: 'success',
        data: rest,
    })
})

//esta funcion es especifica para un mejor funcionamiento del agregado de enums,
const checkEachEnumArray = (obj) =>{
    Object.keys(obj).forEach((key,index) => {
        const lowercaseBody = obj[key].map(word => word.toLowerCase().trim())
        const lowercaseData = obj[key].map(word => word.toLowerCase().trim())
        obj[key] = _.union(lowercaseBody,lowercaseData)
    })
}
//temporal, revisar que si se agregan campos que ya existen se avise y no diga simplemente campos creados
    exports.addEnumField = (Model) =>
    catchAsync(async (req,res,next) => {
        var doc = await Model.findOne();

        console.log("llego")
        console.log(req.body)
        if(!doc) {
            checkEachEnumArray(req.body)
            doc = await Model.create(req.body)
            res.status(200).json({
                status:'success',
                message:'EnumFields created',
                data: doc,
            })
        }else {
            checkEachEnumArray(req.body)
            const updatedEnum = await Model.findByIdAndUpdate(doc._id, req.body, {new: true, runValidators: true})
            res.status(200).json({
                status:'success',
                message:'EnumFields updated',
                data: updatedEnum,
            })
        }

    })