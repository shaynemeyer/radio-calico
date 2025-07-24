const sqlite3 = require('sqlite3').verbose();

let testDb = null;

function setupTestDatabase() {
  return new Promise((resolve, reject) => {
    testDb = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
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
  return new Promise((resolve) => {
    if (testDb) {
      testDb.close(() => {
        testDb = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

function getTestDatabase() {
  return testDb;
}

module.exports = {
  setupTestDatabase,
  closeTestDatabase,
  getTestDatabase
};