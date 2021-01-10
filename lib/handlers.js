const { join } = require("path");
const _data = require('./data');
const helpers = require('./helpers');
const config = require('../config');

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
        const token = typeof( data.headers.token ) == 'string' ?
            data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, function(isValidToken){
            if(isValidToken){
                _data.read('users', phone, function(err, data){
                    if(!err && data){
                        delete data.hashedPassword;
                        callback(200, data);
                    }else{
                        callback(404);
                    }
                });
            }else{
                callback(403, {'error': 'no permission'});
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
            const token = typeof( data.headers.token ) == 'string' ?
                data.headers.token : false;
            handlers._tokens.verifyToken(token, phone, function(isValidToken){
                if(isValidToken){
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
                }else{
                    callback(403, {'error': 'no permission'});
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
        const token = typeof( data.headers.token ) == 'string' ?
            data.headers.token : false;
        handlers._tokens.verifyToken(token, phone, function(isValidToken){
            if(isValidToken){
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
                callback(403, {'error': 'no permission'});
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
            if(tokenData.phone = phone && tokenData.expires > Date.now()){
                callback(true);
            }else{
                callback(false);
            }
        }else{
            return callback(false);
        }
    });
};

handlers.checks = function(data, callback){
    const acceptableMethods = ['get', 'post', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._checks[data.method](data, callback);
    }else{
        callback(405); // method not allowed.
    }
};

// container for check private submethods
handlers._checks = {};

handlers._checks.post = function(data, callback){
    const protocol = typeof(data.payload.protocol) == 'string' 
        && ['http', 'https'].indexOf(data.payload.protocol) > -1 ?
        data.payload.protocol : false;
    const url = typeof(data.payload.url) == 'string' 
        && data.payload.url.trim().length > 0 ?
        data.payload.url : false;
    const method = typeof(data.payload.method) == 'string' 
        && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ?
        data.payload.method : false;
    const successCode = typeof(data.payload.successCode) == 'object' 
        && data.payload.successCode instanceof Array 
        && data.payload.successCode.length > 0 ? 
        data.payload.successCode : false;

    const timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number'
        && data.payload.timeoutSeconds % 1 === 0
        && data.payload.timeoutSeconds >= 1
        && data.payload.timeoutSeconds <= 5 ?
        data.payload.timeoutSeconds: false;

    if(protocol && url && method && successCode && timeoutSeconds){
        const token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        _data.read('tokens', token, function(err, tokenData){
            if(!err && tokenData){
                const userPhone = tokenData.phone;
                _data.read('users', userPhone, function(err, userData){
                    if(!err && userData){
                        let userChecks = typeof(userData.checks) == 'object' 
                            && userData.checks instanceof Array ?
                            userData.checks : [];
                        if(userChecks.length < config.maxChecks){
                            const checkId = helpers.createRandomString(20);
                            const checkObject = {
                                'id': checkId,
                                userPhone,
                                protocol,
                                method,
                                successCode,
                                timeoutSeconds
                            };
                            
                            _data.create('checks', checkId, checkObject, function(err){
                                if(!err){
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);
                                    // sync with user data
                                    _data.update('users', userPhone, userData, function(err){
                                        if(!err){
                                            callback(200, checkObject);
                                        }else{
                                            callback(500, {'error': 'cannot sync with user'});
                                        }
                                    });
                            
                                }else{
                                    callback(500, {'error': 'cannot create check'});
                                }
                            });
                        }else{
                            callback(400, {'error': 'max checkes excceed'});
                        }
                    }else{
                        callback(403);
                    }
                });
            }else{
                callback(403);
            }
        });
    }else{
        callback(400, {'error': 'mission required fields.'});
    }
};

handlers.ping = function(data, callback){
    callback(200);
}

handlers.notFound = function(data, callback){
    callback(404);
};




module.exports = handlers;