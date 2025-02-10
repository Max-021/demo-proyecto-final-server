//Esta es mi plantilla de productos puede mutar en tamaño y forma dependiendo de la necesidad
const mongoose = require('mongoose');

const validationFunctions = require('../auxiliaries/validationFunctions');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A product must have a name.'],
        trim: true,
    },
    descr: {
        type: String,
        default: 'Product without description',
    },
    category: {
        type: String,
        // enum: {values: [categories], message: '{VALUE} is not supported'},
        required: [true, 'A product must have a category'],
        validate: async (v) => {
            return validationFunctions(v,'category')
        },
    },
    price: {
        type: Number,
        default: 0,
        min: [0, `Price can't be negative`]
    },
    quantity: {
        type: Number,
        default: 0,
        min: [0, `Quantity can't be negative`]
    },
    colors: {
        type: [String],
        validate: async (v) => {
            return validationFunctions(v, 'colors')
        },
    },
    img:{
        type: [String],
        default: 'test.jpg',//agregar una validacion para que todos los campos de texto de acá verifiquen que la extension corresponda a una imagen, temporal
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now(),
        select: false,
    },
    updated_at: {
        type: Date,
        default: null,
    }
});

const Product = mongoose.model('Product',productSchema);

// productSchema.pre('save',function (next) {
//     //aca podria agregar algo mas adelante para que se ejecute previo al guardado
//     next();
// })

module.exports = Product;