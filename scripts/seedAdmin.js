require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../src/modules/user/user.model");

async function seedAdmin() {
    const {
        MONGO_URI,
        ADMIN_NAME,
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        ADMIN_PHONE,
    } = process.env;

    const missingVariables = [
        ["MONGO_URI", MONGO_URI],
        ["ADMIN_NAME", ADMIN_NAME],
        ["ADMIN_EMAIL", ADMIN_EMAIL],
        ["ADMIN_PASSWORD", ADMIN_PASSWORD],
        ["ADMIN_PHONE", ADMIN_PHONE],
    ]
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (missingVariables.length > 0) {
        throw new Error(
            `Missing environment variables: ${missingVariables.join(", ")}`
        );
    }

    if (ADMIN_PASSWORD.length < 12) {
        throw new Error(
            "ADMIN_PASSWORD must contain at least 12 characters"
        );
    }

    await mongoose.connect(MONGO_URI);

    console.log(
        `Connected to database: ${mongoose.connection.db.databaseName}`
    );

    /*
     * Make sure the unique email index exists before checking
     * and creating the account.
     */
    await User.init();

    const normalizedEmail =
        ADMIN_EMAIL.trim().toLowerCase();

    const existingUser = await User.findOne({
        email: normalizedEmail,
    });

    if (existingUser) {
        if (existingUser.role === "admin") {
            console.log(
                `Admin account already exists: ${normalizedEmail}`
            );

            return;
        }

        throw new Error(
            `The email ${normalizedEmail} already belongs to a non-admin account`
        );
    }

    const admin = await User.create({
        name: ADMIN_NAME.trim(),
        email: normalizedEmail,
        password: ADMIN_PASSWORD,
        phone: ADMIN_PHONE.trim(),
        role: "admin",
    });

    console.log("Platform admin created successfully");

    console.log({
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: admin.role,
    });
}

seedAdmin()
    .catch((error) => {
        console.error("Admin seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    });