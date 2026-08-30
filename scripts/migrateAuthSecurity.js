require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/modules/user/user.model");

async function migrateAuthSecurity() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log(
        `Connected to database: ${mongoose.connection.db.databaseName}`
    );

    const removedLegacyTokens = await User.collection.updateMany(
        { refreshToken: { $exists: true } },
        { $unset: { refreshToken: "" } }
    );

    const initializedAccountStatus = await User.collection.updateMany(
        { accountStatus: { $exists: false } },
        { $set: { accountStatus: "active" } }
    );

    console.log({
        legacyRefreshTokensRemoved:
            removedLegacyTokens.modifiedCount,
        accountStatusesInitialized:
            initializedAccountStatus.modifiedCount,
    });

    console.log("Authentication security migration completed");
}

migrateAuthSecurity()
    .catch((error) => {
        console.error(
            "Authentication security migration failed:",
            error.message
        );
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    });
