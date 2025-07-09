const Product = require('../models/product');
const functions = require('./factoryHandler');

const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');

exports.catalogo = functions.getAll(Product);
exports.checkCatalogue = catchAsync(async (req,res,next) => {
    const { showInactive, showAll } = req.query;
    delete req.query.showInactive;
    delete req.query.showAll;

    if(showAll === 'true'){

    }else if(showInactive === 'true'){
        req.query.isActive = 'false';
    }else{
        req.query.isActive = 'true';
    }
    next();
});

//revisar que cuando se creen no se creen duplicados de los ya existentes, ver si lo puedo dejar como una validacion opcional/ temporal
exports.createProduct = catchAsync(async (req,res,next) => {
    console.log(req.fields)
    let newStock = [];
    if(req.fields.stock){
        try {
            newStock = typeof req.fields.stock === 'string' ? JSON.parse(req.fields.stock) : req.fields.stock;
        } catch (error) {
            return next(new AppError('Stock format invalid',400));
        }
    }
    const price = parseFloat(req.fields.price)
    if(isNaN(price)) return next(new AppError('Price format invalid', 400));
    const doc = await Product.create({
        name: req.fields.name,
        descr: req.fields.descr,
        category: req.fields.category,
        price: price,
        stock: newStock,
        img: req.fields.img,
        // status: 'normal',//comentado temporalmente porque esta pensado para mejoras futuras
        isActive: req.fields.isActive === 'true' || req.fields.isActive === true,
    });
    res.status(201).json({
        status:'success',
        data: {doc}
    });
});
exports.updateFromSingleEnumField = catchAsync(async (req,res,next) => {
    const {newInfo, oldInfo, fieldName} = req.body;
    if(!oldInfo)            return next(new AppError('Old value required', 400));
    if(!newInfo)            return next(new AppError('New value required', 400));
    if(oldInfo === newInfo) return next(new AppError('Old and new values are the same', 400));
    if(!fieldName)          return next(new AppError('Field type required', 400));

    const schemaType = Product.schema.path(fieldName);
    if (!schemaType) return next(new AppError(`Field "${fieldName}" does not exist on Product`, 400));
    const data = await Product.updateMany({[fieldName]: oldInfo}, {[fieldName]: newInfo}, {runValidators: true} )
    res.status(200).json({
        status: 'success',
        data:{matched: data.matchedCount, modified: data.modifiedCount},
    })
})
exports.updateFromArrayEnumField = catchAsync(async (req, res, next) => {
    console.log(req.body);
    const {newInfo, oldInfo, fieldName} = req.body;

    if(!oldInfo)            return next(new AppError('Old value required', 400));
    if(!newInfo)            return next(new AppError('New value required', 400));
    if(oldInfo === newInfo) return next(new AppError('Old and new values are the same', 400));
    if(!fieldName)          return next(new AppError('Field type required', 400));

    const schemaType = Product.schema.path(fieldName);
    if (!schemaType) return next(new AppError(`Field "${fieldName}" does not exist on Product`, 400));
    if(schemaType.instance !== 'Array') return next(new AppError(`${fieldName} is not an array`, 400));

    const data = await Product.updateMany(
        { [fieldName]: oldInfo }, // Buscar solo productos que contenían el color viejo
        [{
            $set: {
                [fieldName]: {
                    $map: {
                        input: `$${fieldName}`,
                        as: "el",
                        in: { $cond: [ { $eq: ["$$el", oldInfo] }, newInfo, "$$el" ] }
                    }
                }
            }
        }],
        {runValidators: true},
    );

    res.status(200).json({
        status: 'success',
        data: {matched: data.matchedCount, modified: data.modifiedCount},
    });
});

exports.updateFromStockEnumField = catchAsync(async (req,res,next) => {
    const {newInfo, oldInfo, fieldName} = req.body;

    if(!oldInfo)                            return next(new AppError('Old value required', 400));
    if(!newInfo || newInfo==='')            return next(new AppError('New value required', 400));
    if(oldInfo === newInfo)                 return next(new AppError('Old and new values are the same', 400));
    if(!fieldName)                          return next(new AppError('Field type required', 400));
    const schemaType = Product.schema.path(fieldName);
    if (!schemaType)                        return next(new AppError(`Field "${fieldName}" does not exist on Product`, 400));
    if(schemaType.instance !== 'Array')     return next(new AppError(`${fieldName} is not an array`, 400));
    const subSchema = schemaType.schema;
    if(!subSchema)                                                  return next(new AppError(`Field ${fieldName} is not a subdoc array`, 400));
    if (!subSchema.path('color') || !subSchema.path('quantity'))    return next(new AppError("Subdoc must have color and quantity", 400));

    const pipeline = [
        { $set: {
            stock: {
                $map: {
                input: "$stock",
                as: "item",
                in: {
                    $mergeObjects: [
                    "$$item",
                    { color: {
                        $cond: [
                            { $eq: ["$$item.color", oldInfo] }, // si el color coincide con oldInfo
                            newInfo,                            // usar el nuevo color
                            "$$item.color"                      // sino, conservar el color actual
                        ]
                    }}
                    ]
                }
                }
            }
            }
        }
    ]

    const {matchedCount, modifiedCount } = await Product.updateMany(
        { [`${fieldName}.color`]: oldInfo },
        pipeline,
        {runValidators: true},
    )

    res.status(200).json({
        status: 'success',
        data: {matched: matchedCount, modified: modifiedCount},
    })
})

exports.getProduct = functions.getOne(Product);
exports.updateProduct = catchAsync(async (req,res,next) => {
    let updatedStock = [];
    if(req.fields.stock){
        try {
            updatedStock = typeof req.fields.stock === 'string' ? JSON.parse(req.fields.stock) : req.fields.stock;
        } catch (error) {
            return next(new AppError('Stock format invalid',400));
        }
    }
    const product = await Product.findById(req.params.id);
    if(!product) return next(new AppError('No document found with this Id', 404));

    if(Array.isArray(updatedStock)){
        product.stock = updatedStock.map(item => ({
            color: item.color,
            quantity: item.quantity,
        }))
    }
    const excluded = ['img', 'stock', 'removedImages', 'imgOrder', 'newImages'];
    Object.keys(req.fields).forEach( key => {
        if(excluded.includes(key)) return;

        const val = req.fields[key];

        if(key === 'isActive'){
            product.isActive = val === 'true' || val === true;
        }else if(key === 'price'){
            const p = parseFloat(val);
            if(isNaN(p)) return next(new AppError('Price format invalid', 400));
            product.price = p;
        }else{
            product[key] = val;
        }
    })

    if(Array.isArray(req.fields.img)) product.img = req.fields.img;

    await product.save();

    res.status(200).json({
        status: 'success',
        data: product,
    })
});
exports.deleteProduct = functions.deleteOne(Product);

exports.getOnlyOne = catchAsync(async (req,res,next) => {//para obtener el modelo del producto
    const forbidden = ['__v', 'createdAt', 'updatedAt', 'status','_id', 'isActive'];
    const modelDesc = {};

    Product.schema.eachPath((path, schemaType) => {//para cuando es un array de subdocumentos
        if(forbidden.includes(path) || path.includes('.')) return;

        if(schemaType.instance === 'Array' && schemaType.caster && schemaType.caster.schema){
            const subFields = {};
            const subSchema = schemaType.caster.schema;

            Object.entries(subSchema.paths).forEach(([subPath, subType]) => {
                if(['_id', '__v'].includes(subPath)) return;
                subFields[subPath] = {type: subType.instance};
            })

            modelDesc[path] = {
                type:       'Array',
                arrayType:  'Object',
                subFields,
                default:    schemaType.options.default || [],
                required:   !!schemaType.isRequired,
            };
            return;
        }

        if(schemaType.instance === 'Array') {//para cuando es un array de primitivos
            modelDesc[path] = {
                type:       'Array',
                arrayType:  schemaType.caster.instance,
                default:    schemaType.options.default || [],
                required:   !!schemaType.isRequired,
            }
            return;
        }

        //campos primitivos
        modelDesc[path] = {
            type:       schemaType.instance,
            default:    schemaType.options.default,
            required:   !!schemaType.isRequired,
            enum:       schemaType.enumValues?.length ? schemaType.enumValues : undefined,
            min:        schemaType.options.min,
            max:        schemaType.options.max,
        }
    })

    res.status(200).json({
        status: 'success',
        data: modelDesc,
    })
})