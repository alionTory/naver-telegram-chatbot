import { getInstance } from './URLMapper';
const URLMapper = getInstance();

function appProcessRequest(request: Request) {
    let path = new URL(request.url).pathname;
    return URLMapper.executeCallback(path, request);
}

export { appProcessRequest };