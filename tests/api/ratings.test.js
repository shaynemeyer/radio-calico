const request = require('supertest');
const { getTestDatabase, isPostgresMode } = require('../setup/test-db');

// Import server after database is set up
let app;

beforeAll(async () => {
  // Import server app after test database setup
  const server = require('../../server');
  app = server.app;
  
  // Replace the server's database instance with our test database
  const testDb = getTestDatabase();
  
  // Mock the database query method to use test database
  server.db.query = async (query, params) => {
    if (isPostgresMode()) {
      return await testDb.query(query, params);
    } else {
      // Handle SQLite queries
      return new Promise((resolve, reject) => {
        if (query.includes('INSERT') || query.includes('UPDATE')) {
          const sqliteQuery = query
            .replace(/\$(\d+)/g, '?')
            .replace('ON CONFLICT (song_id, user_session) DO UPDATE SET rating = $3', '');
          const finalQuery = sqliteQuery.includes('INSERT') 
            ? sqliteQuery.replace('INSERT INTO', 'INSERT OR REPLACE INTO')
            : sqliteQuery;
          
          testDb.run(finalQuery, params, function(err) {
            if (err) reject(err);
            else resolve({ rowCount: this.changes });
          });
        } else if (query.includes('SELECT')) {
          const sqliteQuery = query.replace(/\$(\d+)/g, '?');
          if (query.includes('SUM(CASE')) {
            testDb.all(sqliteQuery, params, (err, rows) => {
              if (err) reject(err);
              else resolve({ rows: rows || [{ thumbs_up: 0, thumbs_down: 0, total_ratings: 0 }] });
            });
          } else {
            testDb.all(sqliteQuery, params, (err, rows) => {
              if (err) reject(err);
              else resolve({ rows: rows || [] });
            });
          }
        }
      });
    }
  };
});

describe('Rating System API (using actual server endpoints)', () => {
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