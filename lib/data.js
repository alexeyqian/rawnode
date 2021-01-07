const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

var lib = {};
lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = function(dir, file, data, callback){
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor){
        if (!err && fileDescriptor){
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor, stringData, function(err){
                if (!err){

                    fs.close(fileDescriptor, function(err){
                        if (!err){
                            callback(false);
                        }else{
                            callback('ERROR: cannot close the file'.);
                        }
                    });
                }else{
                    callback('ERROR: can not write to file');
                }
            });
        }else{
            callback('ERROR: could not create file.');
        }
    });

};

lib.read = function(dir, file, callback){
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', function(err, data) {
        if(!err && data){
            const parsedData = helpers.parseJsonToObject(data);
            callback(false, parsedData);
        }else{
            callback(err, data);
        }        
    });

};

lib.update = function(dir, file, data, callback) {
    fs.open(lib.baseDir + '/' + file + '.json', 'r+', function(err, fileDescriptor) {
        if(!err && fileDescriptor){
            const stringData = JSON.stringify(data);
            fs.truncate(fileDescriptor, function(err) {
               if(!err){
                    fs.writeFile(fileDescriptor, stringData, function(err) {
                       if(!err){
                            fs.close(fileDescriptor, function(err) {
                               if(!err){
                                   callback(false);
                               } else{
                                   callback('error close file');
                               }
                            });
                       } else{
                           callback('error writing to file');
                       }
                    });
               } else {
                   callback('error truncate file');
               }
            });
        }else{
            callback('cannot open the file');
        }
        
    });
    
};

lib.delete = function(dir, file, callback) {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err) {
       if(!err){
           callback(false);
       } else{
           callback('cannot delete file');
       }
    });
};

module.exports = lib;