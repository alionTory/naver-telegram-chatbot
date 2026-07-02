type Callback = (request: Request) => Promise<Response>;

class URLMapper {
    pathList: Map<string, Record<string, Callback>> = new Map();

    constructor() { console.log("URLMapper created"); }

    // callback must return response
    addPath(pathString: string, callback: Callback, method = "GET") {
        let pathCallbacks = this.pathList.get(pathString);
        if (!pathCallbacks) {
            const pathCallbacks: Record<string, Callback> = {};
            pathCallbacks[method] = callback;
            this.pathList.set(pathString, pathCallbacks);
        } else {
            pathCallbacks[method] = callback;
        }
    }

    executeCallback(pathString: string, request: Request) {
        if (pathString.charAt(pathString.length - 1) === "/")
            pathString = pathString.slice(0, -1);
        const method = request.method;
        console.log("excuting callback to path: " + pathString + "    method: " + method);
        const pathCallbacks = this.pathList.get(pathString);
        if (pathCallbacks) {
            if (!pathCallbacks[method])
                return new Response("405 Method Not Allowed", { status: 405 });
            return pathCallbacks[method](request);
        }
        else
            return new Response("404 Not Found", { status: 404 });
    }
}

let instance: URLMapper;
function getInstance() {
    if (!instance) {
        instance = new URLMapper();
    }
    return instance;
}

export { getInstance };