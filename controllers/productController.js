const Product = require('../models/product');
const functions = require('./factoryHandler');

const catchAsync = require('../auxiliaries/catchAsync');
const AppError = require('../auxiliaries/appError');

exports.catalogo = functions.getAll(Product);

//REVISAR, temporal tambien verlo en factory handler
//revisar que cuando se creen no se creen duplicados de los ya existentes, ver si lo puedo dejar como una validacion opcional
exports.createProduct = catchAsync(async (req,res,next) => {
    const doc = await Product.create({
        name: req.fields.name,
        descr: req.fields.descr,
        category: req.fields.category,
        price: req.fields.price,
        quantity: req.fields.quantity,
        colors: JSON.parse(req.fields.colors),
        img: req.fields.img,
    });
    res.status(201).json({
        status:'success',
        data: {doc}
    });
});
exports.updateFromSingleEnumField = catchAsync(async (req,res,next) => {
    console.log(req.body)
    const data = await Product.updateMany({[req.body.fieldName]: req.body.oldInfo}, {[req.body.fieldName]: req.body.newInfo}, {runValidators: false} )
    // const data = await Product.updateMany({[req.body.fieldName]: req.body.oldInfo}, {[req.body.fieldName]: req.body.newInfo}, {runValidators: true} )//temporal, revisar la importancia de que esto esté en true
    res.status(200).json({
        status: 'success',
        data,//temporal, revisar si sacar estas cosas
    })
})
exports.updateFromArrayEnumField = catchAsync(async (req, res, next) => {
    console.log(req.body);
    let data = {};

    if(req.body.newInfo !== ''){
        data = await Product.updateMany(
            { [req.body.fieldName]: req.body.oldInfo }, // Buscar solo productos que contenían el color viejo
            [{
                $set: {
                    [req.body.fieldName]: {
                        $map: {
                            input: `$${req.body.fieldName}`,
                            as: "color",
                            in: { $cond: { if: { $eq: ["$$color", req.body.oldInfo] }, then: req.body.newInfo, else: "$$color" } }
                        }
                    }
                }
            }]
        );
    }else{
        data = await Product.updateMany(
            { [req.body.fieldName]: req.body.oldInfo, },
            [{
                $set: {
                    [req.body.fieldName]: {
                        $filter: {
                            input: `$${req.body.fieldName}`,
                            as: 'el',
                            cond: { $ne: ["$$el", req.body.oldInfo] },
                        }
                    }
                }
            }]
        );
    }
    console.log(data)

    res.status(200).json({
        status: 'success',
        data,
    });
});

exports.getProduct = functions.getOne(Product);
exports.updateProduct = catchAsync(async (req,res,next) => {
    req.fields.colors = JSON.parse(req.fields.colors);

    const product = await Product.findById(req.params.id);
    if(!product) return next(new AppError('No document found with this Id', 404));

    Object.keys(req.fields).forEach(key => {
        if (key !== 'img') product[key] = req.fields[key];
    });

    if(Array.isArray(req.fields.img)){
        product.img = req.fields.img;
    }
    await product.save();

    res.status(200).json({
        status: 'success',
        data: product,
    })
});
exports.deleteProduct = functions.deleteOne(Product);

exports.getOnlyOne = functions.getJustOne(Product);//esto es para obtener el modelo del producto en este caso