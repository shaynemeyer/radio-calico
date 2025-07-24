const { setupTestDatabase, closeTestDatabase } = require('./test-db');

beforeEach(async () => {
  await setupTestDatabase();
});

afterEach(async () => {
  await closeTestDatabase();
});