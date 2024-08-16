class URLMapper {
    pathList = new Map();

    constructor() { console.log("URLMapper created"); }

    // callback must return response
    addPath(pathString, callback, method = "GET") {
        if (!this.pathList.has(pathString)) {
            const pathCallbacks = {};
            pathCallbacks[method] = callback;
            this.pathList.set(pathString, pathCallbacks);
        } else {
            const pathCallbacks = this.pathList.get(pathString);
            pathCallbacks[method] = callback;
        }
    }

    executeCallback(pathString, request) {
        if (pathString.charAt(pathString.length - 1) === "/")
            pathString = pathString.slice(0, -1);
        const method = request.method;
        console.log("excuting callback to path: " + pathString + "    method: " + method);
        if (this.pathList.has(pathString)) {
            const pathCallbacks = this.pathList.get(pathString);
            if (!pathCallbacks[method])
                return new Response("405 Method Not Allowed", { status: 405 });
            return pathCallbacks[method](request);
        }
        else
            return new Response("404 Not Found", { status: 404 });
    }
}

let instance = null;
function getInstance() {
    if (!instance) {
        instance = new URLMapper();
    }
    return instance;
}

module.exports = { getInstance };