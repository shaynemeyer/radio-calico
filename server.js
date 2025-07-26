const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_PATH = process.env.DATABASE_PATH || './database.db';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS song_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id TEXT NOT NULL,
      user_session TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(song_id, user_session)
    )`);
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, email });
  });
});

app.post('/api/songs/rate', (req, res) => {
  const { songId, rating, userSession } = req.body;
  
  if (!songId || !rating || !userSession) {
    return res.status(400).json({ error: 'songId, rating, and userSession are required' });
  }
  
  if (rating !== 1 && rating !== -1) {
    return res.status(400).json({ error: 'Rating must be 1 (thumbs up) or -1 (thumbs down)' });
  }
  
  db.run('INSERT OR REPLACE INTO song_ratings (song_id, user_session, rating) VALUES (?, ?, ?)', 
    [songId, userSession, rating], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, songId, rating });
    }
  );
});

app.get('/api/songs/:songId/ratings', (req, res) => {
  const { songId } = req.params;
  
  db.all(`SELECT 
    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as thumbs_up,
    SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) as thumbs_down,
    COUNT(*) as total_ratings
    FROM song_ratings WHERE song_id = ?`, 
    [songId], 
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      const result = rows[0] || { thumbs_up: 0, thumbs_down: 0, total_ratings: 0 };
      res.json({ songId, ...result });
    }
  );
});

app.get('/api/songs/:songId/user-rating/:userSession', (req, res) => {
  const { songId, userSession } = req.params;
  
  db.get('SELECT rating FROM song_ratings WHERE song_id = ? AND user_session = ?', 
    [songId, userSession], 
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ songId, userSession, rating: row ? row.rating : null });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown handling for Docker
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server gracefully...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);