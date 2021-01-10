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
handlers._user.get = function(data, callback){
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length() == 10 ?
        data.queryStringObject.phone.trim() : false;
    
    if(phone){
        _data.read('users', phone, function(err, data){
            if(!err && data){
                delete data.hashedPassword;
                callback(200, data);
            }else{
                callback(404);
            }
        });
    }else{
        callback(400, {'error': 'Missing required data.'});
    }
};

handlers._user.post = function(data, callback){
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

handlers._user.put = function(data, callback){
    const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length() == 10 ?
        data.payload.phone.trim() : false;

        const firstName = typeof(data.payload.firstName) == 'string' 
    && data.payload.firstName.trim().length > 0 
    ? data.payload.firstName.trim() : false;

    const lastName = typeof(data.payload.lastName) == 'string' 
    && data.payload.lastName.trim().length > 0 
    ? data.payload.lastName.trim() : false;
     
    const password = typeof(data.payload.password) == 'string' 
    && data.payload.password.trim().length > 0 
    ? data.payload.password.trim() : false;
    
    if(phone){
        
        if(firstName || lastName || password){
            _data.read('users', phone, function(err, userData){
                if(!err && userData){
                    if(firstName) userData.firstName = firstName;
                    if(lastName) userData.lastName = lastName;
                    if(password) userData.hashedPassword = helpers.hash(password);

                    // store
                    _data.update('users', phone, userData, function(err){
                        if(!err){
                            callback(200);
                        }else{
                            callback(500, {'error': 'cannot update user on server'});
                        }
                    });
                }else{ // if cannot find user
                    callback(400, {'error': 'user does not exist.'});
                }
            });

        }else{ // if nothing to update
            callback(400, {'error': 'No fields to update.'});
        }
    }else{ // if phone is missing
        callback(400, {'error': 'Missing required field.'});
    }
    
};

handlers._user.delete = function(data, callback){
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length() == 10 ?
        data.queryStringObject.phone.trim() : false;
    
    if(phone){
        _data.read('users', phone, function(err, userData){
            if(!err && userData){
                _data.delete('users', phone, function(err){
                    if(!err){
                        callback(200);
                    }else{
                        callback(500, {'error': 'cannot delete user'});
                    }
                });
            }else{
                callback(400, {'error': 'cannot find the user'});
            }
        });
    }else{
        callback(400, {'error': 'Missing required data.'});
    }
};

handlers.tokens = function(data, callback){
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    }else{
        callback(405); // method not allowed.
    }
};

// container for tokens private submethods
handlers._tokens = {};

handlers._tokens.post = function(data, callback){
    const phone = typeof(data.payload.phone) == 'string' 
    && data.payload.phone.trim().length == 10
    ? data.payload.phone.trim() : false;

    const password = typeof(data.payload.password) == 'string' 
    && data.payload.password.trim().length > 0 
    ? data.payload.password.trim() : false;

    if(phone && password){
        _data.read('users', phone, function(err, userData){
            if(!err && userData){
                const hashedPassword = helpers.hash(password);
                if(hashedPassword === userData.hashedPassword){
                    const tokenId = helpers.createRandomString(20);
                    const expires = Date.now()  + 1000 * 60 * 60;// one hour
                    const tokenObject = {
                        phone,
                        'id': tokenId,
                        expires
                    };

                    _data.create('tokens', tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200, tokenObject);
                        }else{
                            callback(500, {'error': 'cannot create token'});
                        }
                    });
                }else{
                    callback(400, {'error': 'password is not matching'});
                }
            }else{
                callback(400, {'error': 'cannot find the specific user'});
            }
        });
    }else{
        callback(400, {'error': 'missing required field(s)'});
    }
};

handlers._tokens.get = function(data, callback){
    const phone = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length() == 20 ?
        data.queryStringObject.id.trim() : false;
    
    if(id){
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){                
                callback(200, tokenData);
            }else{
                callback(404);
            }
        });
    }else{
        callback(400, {'error': 'Missing required data.'});
    }
};

handlers._tokens.put = function(data, callback){
    const id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length() == 20 ?
        data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ?
        true : false;
    
    if(id && extend){
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    _data.update('tokens', id, tokenData, function(err){
                        if(!err){
                            callback(200);
                        }else{
                            callback(500, {'error': 'cannot update the token'});
                        }
                    });
                }else{
                    callback(400, {'error': 'expired token'});
                }                
            }else{
                callback(404);
            }
        });
    }else{
        callback(400, {'error': 'invalid payload'});
    }



};

handlers._tokens.delete = function(data, callback){
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length() == 20 ?
        data.queryStringObject.id.trim() : false;
    
    if(id){
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                _data.delete('tokens', id, function(err){
                    if(!err){
                        callback(200);
                    }else{
                        callback(500, {'error': 'cannot delete token'});
                    }
                });
            }else{
                callback(400, {'error': 'cannot find the token'});
            }
        });
    }else{
        callback(400, {'error': 'Missing required data.'});
    }
};

handlers._tokens.verifyToken = function(id, phone, callback){
    _data.read('tokens', id, function(err, tokenData){
        if(!err && userData){
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            }else{
                callback(false);
            }
        }else{
            return callback(false);
        }
    });
};

handlers.ping = function(data, callback){
    callback(200);
}

handlers.notFound = function(data, callback){
    callback(404);
};

module.exports = handlers;