const _ = require('lodash')
const EnumFields = require('../models/enumFields');

module.exports = async (v, type) => {
    const doc = await EnumFields.findOne({name: type});
    
    if(!doc) return false;
    
    const allowed = doc.values;
    
    if(Array.isArray(v)){
        const intersection = _.intersection(v, allowed);
        return intersection.length === v.length;
    }else{
        return allowed.includes(v);
    }
}