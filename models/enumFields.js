const mongoose = require('mongoose');

const enumFieldsSchema = new mongoose.Schema({
    category: {
        type: [String],
        trim: true,
        required: [true,'A category must have a name'],
    },
    colors: {
        type: [String],
        trim: true,
        required: [true,'A color must have a name']
    }
})

const EnumFields = mongoose.model('EnumFields', enumFieldsSchema);

module.exports = EnumFields;