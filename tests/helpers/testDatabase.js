const mongoose = require("mongoose");
const {
    MongoMemoryReplSet,
} = require("mongodb-memory-server-core");

let replicaSet;

const connectTestDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    replicaSet = await MongoMemoryReplSet.create({
        binary: {
            // Keep the test server reproducible and reuse the cached binary.
            version: "8.2.6",
        },
        replSet: {
            count: 1,
            storageEngine: "wiredTiger",
        },
    });

    await mongoose.connect(replicaSet.getUri(), {
        dbName: "real_estate_api_test",
    });

    // Create collections and indexes before any transaction starts. This
    // also makes unique-index behavior consistent with production MongoDB.
    await Promise.all(
        Object.values(mongoose.models).map((model) => model.init())
    );
};

const clearTestDatabase = async () => {
    if (mongoose.connection.readyState === 0) {
        return;
    }

    await Promise.all(
        Object.values(mongoose.connection.collections).map(
            (collection) => collection.deleteMany({})
        )
    );
};

const disconnectTestDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    if (replicaSet) {
        await replicaSet.stop();
        replicaSet = null;
    }
};

module.exports = {
    connectTestDatabase,
    clearTestDatabase,
    disconnectTestDatabase,
};
