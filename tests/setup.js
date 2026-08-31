const {
  connectTestDatabase,
  clearTestDatabase,
  disconnectTestDatabase,
} = require("./helpers/testDatabase");

beforeAll(async () => {
  await connectTestDatabase();
}, 180000);

afterEach(async () => {
  await clearTestDatabase();
});

afterAll(async () => {
  await disconnectTestDatabase();
}, 180000);
