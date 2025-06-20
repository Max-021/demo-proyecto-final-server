const mongoose = require('mongoose');

const enumFieldsSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'A name is required for this record.'],
        unique: true,
    },
    values: {
        type: [String],
        trim: true,
        default: [],
    },
})

const EnumFields = mongoose.model('EnumFields', enumFieldsSchema);

module.exports = EnumFields;