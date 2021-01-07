var environments = {};

environments.staging = {
    'httpPort': 3000,
    'httpsPort' : 3001,
    'evnName': 'staging',
    'hashingSecret': 'asfdasltj'
};

environments.production = {
    'httpPort': 5000,
    'httpsPort' : 50001,
    'evnName': 'production',
    'hashingSecret': 'xdu0urjf;f'
};

var currentEnvironment = type(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

module.exports = environmentToExport;

