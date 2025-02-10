const _ = require('lodash')
const EnumFields = require('../models/enumFields');

module.exports = async (v, type) => {
    var doc = '';

    if(Array.isArray(v)) {
        doc = await EnumFields.findOne()
        doc=doc.colors;
        const isValid = _.intersection(v, doc);//permite que si aunque sea uno de los colores del nuevo Doc es valido, pasan todos, solo deberia tomar los que coincidan, temporal
        if(isValid.length === 0) doc = false;
    }else{
        doc = await EnumFields.findOne()//revisar esto para que coincida ;
        doc = doc.category.includes(v);
    }

    return doc;
}