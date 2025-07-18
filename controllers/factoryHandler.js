const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');
const ApiFeat = require('../auxiliaries/apiFeat');
const helpers = require('../auxiliaries/helpers');

//revisar, temporal
//revisar que cuando se creen no se creen duplicados de los ya existentes, ver si lo puedo dejar como una validacion opcional
exports.createOne = (Model) => catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
        status:'success',
        data: doc,
    });
});

exports.getAll = (Model) => catchAsync(async (req,res,next) => {
    let filter = {}
    if(req.params.id) filter = {item: req.params.id};

    const baseFeatures = new ApiFeat(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields();

    const shouldPaginate = req.query.page != null || req.query.limit != null;
    if(!shouldPaginate){
        const docs = await baseFeatures.filteredModel;

        return res.status(200).json({
            status: 'success',
            results: docs.length,
            data: docs,
        });
    }

    const page  = parseInt(req.query.page, 10)  || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const pageFeatures = new ApiFeat(Model.find(filter), req.query).filter().sort().limitFields().paginate();
    const docs = await pageFeatures.filteredModel;

    const totalCount = await baseFeatures.filteredModel.countDocuments();

    return res.status(200).json({
        status: 'success',
        results: docs.length,
        data: {
            docs: docs,
            page: page,
            limit: limit,
            totalCount: totalCount,
        }
    })
})

//revisar, temporal
exports.getOne = (Model,popOps) => catchAsync(async (req,res,next) => {
    //completar
    console.log("Por aca")
    let query = Model.findById(req.params.id)
    if(popOps) query = query.populate(popOps);
    const doc = await query;
    
    //404
    if(!doc) return next(new AppError("factoryHandler.noDocument",404))

    return res.status(200).json({
        status: 'success',
        data: doc,
    });
});

//revisar, temporal
exports.deleteOne = (Model) => catchAsync(async (req,res,next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    //404 errors
    if(!doc) return next(new AppError('factoryHandler.noDocument', 404));

    return res.status(204).json({
        status: 'success',
        data: null,
    })
})

exports.updateOne = (Model) => catchAsync(async (req,res,next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    //404 errors
    if(!doc) return next(new AppError('factoryHandler.noDocument', 404));

    return res.status(200).json({
        status: 'success',
        data: doc
    })
})

//este es para devolver el modelo del documento
exports.getJustOne = (Model) => catchAsync(async (req,res,next) => {
    const {created_at, updated_at, _id, __v, ...rest} = Model.schema.obj
    return res.status(200).json({
        status: 'success',
        data: rest,
    })
})