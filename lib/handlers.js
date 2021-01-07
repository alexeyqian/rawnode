const { Z_DATA_ERROR } = require("zlib");

const _data = require('./data');
const helpers = require('./helpers');

// define handlers
var handlers = {};

handlers.users = function(data, callback){
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    }else{
        callback(405); // method not allowed.
    }
};

// container for users private submethods
handlers._user = {};
handlers._user.get = function(data callback){

};

handlers._user.post = function(data callback){
    const firstName = typeof(data.payload.firstName) == 'string' 
    && data.payload.firstName.trim().length > 0 
    ? data.payload.firstName.trim() : false;

    const lastName = typeof(data.payload.lastName) == 'string' 
    && data.payload.lastName.trim().length > 0 
    ? data.payload.lastName.trim() : false;

    const phone = typeof(data.payload.phone) == 'string' 
    && data.payload.phone.trim().length == 10
    ? data.payload.phone.trim() : false;

    const password = typeof(data.payload.password) == 'string' 
    && data.payload.password.trim().length > 0 
    ? data.payload.password.trim() : false;

    const tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' 
    && data.payload.tosAgreement == true
    ? true : false;

    if(firstName && lastName && password && phone && tosAgreement){
        // validate user not exist
        _data.read('users', phone, function(err, data){
            if(err){
                const hashedPassword = helpers.hash(password);
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    hashedPassword,
                    tosAgreement
                };

                _data.create('users', phone, userObject, function(err){
                    if(!err){
                        callback(200); 
                    }else{
                        console.log(err);
                        callback(500, {'error': 'cannot create user'});
                    }
                });


            }else{
                callback(400, {'Error': 'The user is already exist.'});
            }
        });
    }else{
        callback(400, {'Error': 'Missing required fields'});
    }



};

handlers._user.put = function(data callback){

};

handlers._user.delete = function(data callback){

};


handlers.ping = function(data, callback){
    callback(200);
}

handlers.notFound = function(data, callback){
    callback(404);
};

module.exports = handlers;