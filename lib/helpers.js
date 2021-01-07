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

helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        str = '';
        for (i = 0; i < strLength; i++){
            let randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

            str += randomChar;
        }

        return str;
    }else{
        return false;
    }

};

module.exports = helpers;