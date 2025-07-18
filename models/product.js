//Esta es mi plantilla de productos puede mutar en tamaño y forma dependiendo de la necesidad
const mongoose = require('mongoose');

const productStatusEnum = ['normal',];//acá agregar otros estados segun se determine

const enumValidation = require('../auxiliaries/validationFunctions/enumValidation');

const stockSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        default: 0,
        min: [0, `Quantity can't be negative`]
    },
    color: {
        type: String,
        required: [true, 'Color is required'],
        validate: {
            message: props => `${props.value} no es un color válido`,
            validator: async (v) => {
                return enumValidation(v, 'colors')
            }
        },
    },
},{_id: false});

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
        required: [true, 'A product must have a category'],
        validate: {
            message: props => `${props.value} no es una categoria permitida`,
            validator: async (v) => {
                return enumValidation(v,'category')
            }
        },
    },
    price: {
        type: Number,
        default: 0,
        min: [0, `Price can't be negative`]
    },
    stock: {
        type: [stockSchema],
        default: [],
    },
    img:{
        type: [String],
        default: ['test.jpg'],
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: productStatusEnum,
        default: 'normal',
        required: [true, 'A product must have a status'],
    },
}, {timestamps: true});


productSchema.query.status = function(prodStatus) {
    return this.where({status: prodStatus});
}

productSchema.query.neStatus = function(prodStatus) {
    return this.where({status: {$ne: prodStatus}});
}
productSchema.methods.adjustStock = async function(color, delta) {
    const item = this.stock.find(s => s.color === color);
    if(item){
        item.quantity = Math.max(0, item.quantity + delta);
    }else if(delta >= 0){
        this.stock.push({color, quantity: delta});
    }
    return this.save();
}

// productSchema.pre('save',function (next) {
    //     //aca podria agregar algo mas adelante para que se ejecute previo al guardado
    //     next();
// })

const Product = mongoose.model('Product',productSchema);
    
module.exports = Product;