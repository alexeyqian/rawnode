const crypto = require('crypto');
const config = require('../config');

let helpers = {};

helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        const hash = crypto.createHmac('sha256', config.hashingSecret)
        .update(str).digest('hex');    
        return hash;
    }else{
        return false;
    }
};

helpers.parseJsonToObject = function(str){
    try{
        const obj = JSON.parse(str);
        return obj;
    }catch(e){
        return {};
    }
};

module.exports = helpers;