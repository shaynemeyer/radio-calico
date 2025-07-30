const { setupTestDatabase, closeTestDatabase } = require('./test-db');

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await closeTestDatabase();
});