import { env as workerEnv } from "cloudflare:workers";

class CloudflareKVManager {
    kvEnv: KVNamespace;
    stringCache: Map<string, string>;
    numberCache: Map<string, number>;

    constructor(env: Env) {
        console.log("CloudflareKVManager created");
        this.kvEnv = env["kv-binding"];
        this.stringCache = new Map();
        this.numberCache = new Map();
    }

    get(key: string) {
        return this.kvEnv.get(key);
    }

    set(key: string, value: string) {
        console.log("Setting key: " + key + " to value: " + value);
        return this.kvEnv.put(key, value);
    }

    getStringCache(key: string) {
        return this.stringCache.get(key);
    }

    setStringCache(key: string, value: string) {
        this.stringCache.set(key, value);
    }

    getNumberCache(key: string) {
        return this.numberCache.get(key);
    }

    setNumberCache(key: string, value: number) {
        this.numberCache.set(key, value);
    }

}

let instance: CloudflareKVManager | null = null;

/**
 * 모든 worker 실행 시작 시 정확히 1번 실행되어야 함.
 * 이 함수 실행 없이 DBManager 접근 시, 기존 실행 상태가 누출될 수 있음.
 */
function initDBManager(env: Env) {
    instance = new CloudflareKVManager(env);
}

function set(key: string, value: string) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    return instance.set(key, value);
}

function get(key: string) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    return instance.get(key);
}

/**
 * DB에 key가 있고, 대응하는 값이 number로 변환 가능하면 number 반환.  
 * 그렇지 않으면 undefined 반환.
 */
async function getNumber(key: string) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    const value = await instance.get(key);

    let result: number | null = null;
    if (value) {
        const numberValue = Number(value);
        if (!isNaN(numberValue)) {
            result = numberValue;
        }
    }
    return result;
}

function getStringCache(key: string) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    return instance.getStringCache(key);
}

function setStringCache(key: string, value: string) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    instance.setStringCache(key, value);
}

function getNumberCache(key: string) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    return instance.getNumberCache(key);
}

function setNumberCache(key: string, value: number) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    instance.setNumberCache(key, value);
}

function env() {
    return workerEnv;
}

export { initDBManager, set, get, getNumber, getStringCache, setStringCache, getNumberCache, setNumberCache, env };