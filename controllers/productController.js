const Product = require('../models/product');
const functions = require('./factoryHandler');

const catchAsync = require('../auxiliaries/catchAsync');

//borrar despues de pasar la funcion al factory si corresponde
const AppError = require('../auxiliaries/appError');

exports.catalogo = functions.getAll(Product);

//REVISAR, temporal tambien verlo en factory handler
//revisar que cuando se creen no se creen duplicados de los ya existentes, ver si lo puedo dejar como una validacion opcional
exports.createProduct = catchAsync(async (req,res,next) => {
    console.log(req.body)
    const doc = await Product.create({
        name: req.body.name,
        descr: req.body.descr,
        category: req.body.category,
        price: req.body.price,
        quantity: req.body.quantity,
        colors: req.body.colors,
        img: req.body.img,
    });
    res.status(201).json({
        status:'success',
        data: {doc}
    });
});

exports.updateFromCategory = catchAsync(async (req,res,next) => {
    console.log(req.body)
    const data = await Product.updateMany({category: req.body.oldInfo}, {category: req.body.newInfo}, {runValidators: true} )
    res.status(200).json({
        status: 'success',
        data,//temporal, revisar si sacar estas cosas
    })
})

//revisar como puedo refactorizar esto despues
// exports.createProduct = functions.createOne(Product, {

// });
exports.getProduct = functions.getOne(Product);
exports.updateProduct = functions.updateOne(Product);
exports.deleteProduct = functions.deleteOne(Product);

//esto seria para poder leer los datos y armar un formulario
exports.getOnlyOne = functions.getJustOne(Product);