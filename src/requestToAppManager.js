const URLMapper = require('./urlMapper').getInstance();

function appProcessRequest(request) {
    let path = new URL(request.url).pathname;
    return URLMapper.executeCallback(path, request);
}

module.exports = { appProcessRequest };