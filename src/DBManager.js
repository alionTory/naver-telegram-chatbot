class CloudflareKVManager {
    kvEnv;
    env;

    constructor(env, namespace) {
        console.log("CloudflareKVManager created");
        this.env = env;
        this.kvEnv = env[namespace];
        if (!this.kvEnv) {
            throw new Error("KV namespace " + namespace + " not found");
        }
    }

    getKey(key) {
        return this.kvEnv.get(key);
    }

    setKey(key, value) {
        console.log("Setting key: " + key + " to value: " + value);
        return this.kvEnv.put(key, value);
    }

    getEnvironmentVariable(key) {
        return this.env[key];
    }
}

let instance = null;

function initDBManager(env, namespace) {
    if (!instance) {
        instance = new CloudflareKVManager(env, namespace);
    } else {
        console.log("DBManager already created");
    }
}

function setKey(key, value) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    return instance.setKey(key, value);
}

function getKey(key) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    return instance.getKey(key);
}

function getEnvironmentVariable(key) {
    if (!instance) {
        throw new Error("DBManager not initialized");
    }
    return instance.getEnvironmentVariable(key);
}

module.exports = { initDBManager, setKey, getKey, getEnvironmentVariable };