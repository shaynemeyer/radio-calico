const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { getTestDatabase } = require('../setup/test-db');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/songs/rate', (req, res) => {
  const { songId, rating, userSession } = req.body;
  const db = getTestDatabase();
  
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
  const db = getTestDatabase();
  
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
  const db = getTestDatabase();
  
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

describe('Rating System API', () => {
  describe('POST /api/songs/rate', () => {
    it('should submit new thumbs up rating', async () => {
      const response = await request(app)
        .post('/api/songs/rate')
        .send({
          songId: 'test_song_1',
          rating: 1,
          userSession: 'user_test_123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        songId: 'test_song_1',
        rating: 1
      });
    });

    it('should submit new thumbs down rating', async () => {
      const response = await request(app)
        .post('/api/songs/rate')
        .send({
          songId: 'test_song_2',
          rating: -1,
          userSession: 'user_test_456'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        songId: 'test_song_2',
        rating: -1
      });
    });

    it('should update existing rating', async () => {
      await request(app)
        .post('/api/songs/rate')
        .send({
          songId: 'test_song_3',
          rating: 1,
          userSession: 'user_test_789'
        });

      const response = await request(app)
        .post('/api/songs/rate')
        .send({
          songId: 'test_song_3',
          rating: -1,
          userSession: 'user_test_789'
        });

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(-1);
    });

    it('should return 400 for missing songId', async () => {
      const response = await request(app)
        .post('/api/songs/rate')
        .send({
          rating: 1,
          userSession: 'user_test_123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('songId, rating, and userSession are required');
    });

    it('should return 400 for missing rating', async () => {
      const response = await request(app)
        .post('/api/songs/rate')
        .send({
          songId: 'test_song_1',
          userSession: 'user_test_123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('songId, rating, and userSession are required');
    });

    it('should return 400 for missing userSession', async () => {
      const response = await request(app)
        .post('/api/songs/rate')
        .send({
          songId: 'test_song_1',
          rating: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('songId, rating, and userSession are required');
    });

    it('should return 400 for invalid rating value', async () => {
      const response = await request(app)
        .post('/api/songs/rate')
        .send({
          songId: 'test_song_1',
          rating: 5,
          userSession: 'user_test_123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Rating must be 1 (thumbs up) or -1 (thumbs down)');
    });
  });

  describe('GET /api/songs/:songId/ratings', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/songs/rate')
        .send({ songId: 'aggregation_test', rating: 1, userSession: 'user_1' });
      
      await request(app)
        .post('/api/songs/rate')
        .send({ songId: 'aggregation_test', rating: 1, userSession: 'user_2' });
      
      await request(app)
        .post('/api/songs/rate')
        .send({ songId: 'aggregation_test', rating: -1, userSession: 'user_3' });
    });

    it('should return correct rating counts', async () => {
      const response = await request(app)
        .get('/api/songs/aggregation_test/ratings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        songId: 'aggregation_test',
        thumbs_up: 2,
        thumbs_down: 1,
        total_ratings: 3
      });
    });

    it('should return zeros for non-existent song', async () => {
      const response = await request(app)
        .get('/api/songs/nonexistent_song/ratings');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        songId: 'nonexistent_song',
        thumbs_up: null,
        thumbs_down: null,
        total_ratings: 0
      });
    });
  });

  describe('GET /api/songs/:songId/user-rating/:userSession', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/songs/rate')
        .send({ songId: 'user_rating_test', rating: 1, userSession: 'specific_user' });
    });

    it('should return user rating', async () => {
      const response = await request(app)
        .get('/api/songs/user_rating_test/user-rating/specific_user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        songId: 'user_rating_test',
        userSession: 'specific_user',
        rating: 1
      });
    });

    it('should return null for no rating', async () => {
      const response = await request(app)
        .get('/api/songs/user_rating_test/user-rating/different_user');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        songId: 'user_rating_test',
        userSession: 'different_user',
        rating: null
      });
    });

    it('should return correct rating after updates', async () => {
      await request(app)
        .post('/api/songs/rate')
        .send({ songId: 'update_test', rating: 1, userSession: 'update_user' });

      await request(app)
        .post('/api/songs/rate')
        .send({ songId: 'update_test', rating: -1, userSession: 'update_user' });

      const response = await request(app)
        .get('/api/songs/update_test/user-rating/update_user');

      expect(response.status).toBe(200);
      expect(response.body.rating).toBe(-1);
    });
  });
});