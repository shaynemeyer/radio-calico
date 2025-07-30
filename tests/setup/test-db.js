const sqlite3 = require('sqlite3').verbose();
const PostgresDB = require('../../src/db/postgres');

let testDb = null;
let isPostgres = false;

function setupTestDatabase() {
  // Use PostgreSQL if environment variables are set (CI environment)
  if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_PASSWORD) {
    return setupPostgresTestDatabase();
  } else {
    return setupSqliteTestDatabase();
  }
}

function setupPostgresTestDatabase() {
  return new Promise(async (resolve, reject) => {
    try {
      testDb = new PostgresDB();
      await testDb.connect();
      isPostgres = true;
      
      // Clean up tables before tests
      await testDb.query('TRUNCATE TABLE song_ratings, users RESTART IDENTITY CASCADE');
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function setupSqliteTestDatabase() {
  return new Promise((resolve, reject) => {
    testDb = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      isPostgres = false;
      
      testDb.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        testDb.run(`CREATE TABLE IF NOT EXISTS song_ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          song_id TEXT NOT NULL,
          user_session TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(song_id, user_session)
        )`, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  });
}

function closeTestDatabase() {
  return new Promise(async (resolve) => {
    if (testDb) {
      if (isPostgres) {
        await testDb.close();
      } else {
        testDb.close(() => {
          testDb = null;
          resolve();
        });
      }
    } else {
      resolve();
    }
  });
}

function getTestDatabase() {
  return testDb;
}

function isPostgresMode() {
  return isPostgres;
}

module.exports = {
  setupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  isPostgresMode
};