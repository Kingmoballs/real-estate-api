require("dotenv").config();

const mongoose = require("mongoose");

const CONFIRMATION_VALUE =
    "DELETE_ALL_REAL_ESTATE_DATA";

const applicationCollections = [
    "bookings",
    "chatmessages",
    "conversations",
    "notifications",
    "properties",
    "users",
];

async function resetDatabase() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not configured");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const database = mongoose.connection.db;

    console.log(
        `Connected to database: ${database.databaseName}`
    );

    const existingCollections = await database
        .listCollections({}, { nameOnly: true })
        .toArray();

    const existingCollectionNames = new Set(
        existingCollections.map(
            (collection) => collection.name
        )
    );

    console.log("\nCurrent application data:");

    for (const collectionName of applicationCollections) {
        if (!existingCollectionNames.has(collectionName)) {
            console.log(`${collectionName}: collection not found`);
            continue;
        }

        const count = await database
            .collection(collectionName)
            .countDocuments();

        console.log(`${collectionName}: ${count} documents`);
    }

    if (
        process.env.RESET_CONFIRMATION !==
        CONFIRMATION_VALUE
    ) {
        console.log(
            "\nPreview only. No documents were deleted."
        );

        console.log(
            `To confirm deletion, set RESET_CONFIRMATION to ${CONFIRMATION_VALUE}`
        );

        return;
    }

    console.log("\nResetting application collections...");

    for (const collectionName of applicationCollections) {
        if (!existingCollectionNames.has(collectionName)) {
            continue;
        }

        const result = await database
            .collection(collectionName)
            .deleteMany({});

        console.log(
            `${collectionName}: deleted ${result.deletedCount} documents`
        );
    }

    console.log("\nDatabase reset completed successfully");
}

resetDatabase()
    .catch((error) => {
        console.error("Database reset failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    });