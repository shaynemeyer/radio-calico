const express = require('express');
const cors = require('cors');
const path = require('path');
const PostgresDB = require('./src/db/postgres');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new PostgresDB();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database connection
db.connect()
  .then(() => {
    console.log('Database connected successfully');
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
    console.log('Application will start but database operations will fail until connection is established');
  });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'disconnected'
  };

  try {
    await db.query('SELECT 1');
    health.database = 'connected';
    res.json(health);
  } catch (err) {
    health.status = 'unhealthy';
    res.status(503).json(health);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await db.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/songs/rate', async (req, res) => {
  const { songId, rating, userSession } = req.body;
  
  if (!songId || !rating || !userSession) {
    return res.status(400).json({ error: 'songId, rating, and userSession are required' });
  }
  
  if (rating !== 1 && rating !== -1) {
    return res.status(400).json({ error: 'Rating must be 1 (thumbs up) or -1 (thumbs down)' });
  }
  
  try {
    await db.query(
      'INSERT INTO song_ratings (song_id, user_session, rating) VALUES ($1, $2, $3) ON CONFLICT (song_id, user_session) DO UPDATE SET rating = $3',
      [songId, userSession, rating]
    );
    res.json({ success: true, songId, rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/songs/:songId/ratings', async (req, res) => {
  const { songId } = req.params;
  
  try {
    const result = await db.query(`
      SELECT 
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as thumbs_up,
        SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) as thumbs_down,
        COUNT(*) as total_ratings
      FROM song_ratings WHERE song_id = $1
    `, [songId]);
    
    const data = result.rows[0] || { thumbs_up: 0, thumbs_down: 0, total_ratings: 0 };
    res.json({ songId, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/songs/:songId/user-rating/:userSession', async (req, res) => {
  const { songId, userSession } = req.params;
  
  try {
    const result = await db.query(
      'SELECT rating FROM song_ratings WHERE song_id = $1 AND user_session = $2',
      [songId, userSession]
    );
    
    const rating = result.rows.length > 0 ? result.rows[0].rating : null;
    res.json({ songId, userSession, rating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown handling for Docker
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing server gracefully...');
  try {
    await db.close();
    console.log('Database connection closed');
  } catch (err) {
    console.error('Error closing database:', err.message);
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);