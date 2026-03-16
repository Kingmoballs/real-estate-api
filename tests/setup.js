const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(process.cwd(), ".env.test"),
});

beforeAll(async () => {
  if (!process.env.MONGO_URI_TEST) {
    throw new Error("MONGO_URI_TEST is not defined");
  }

  await mongoose.connect(process.env.MONGO_URI_TEST);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.close();
});
