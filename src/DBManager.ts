import { env as workerEnv } from "cloudflare:workers";

class CloudflareKVManager {
    kvEnv: KVNamespace;

    constructor(env: Env) {
        console.log("CloudflareKVManager created");
        this.kvEnv = env["kv-binding"];
    }

    get(key: string) {
        return this.kvEnv.get(key);
    }

    set(key: string, value: string) {
        console.log("Setting key: " + key + " to value: " + value);
        return this.kvEnv.put(key, value);
    }
}

let instance: CloudflareKVManager | null = null;

function initDBManager(env: Env) {
    if (!instance) {
        instance = new CloudflareKVManager(env);
    } else {
        console.log("DBManager already created");
    }
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

function env() {
    return workerEnv;
}

export { initDBManager, set, get, getNumber, env };