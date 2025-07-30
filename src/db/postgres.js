const { Pool } = require('pg');

class PostgresDB {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'radiocalico',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async connect() {
    try {
      const client = await this.pool.connect();
      console.log('Connected to PostgreSQL database');
      client.release();
      await this.createTables();
    } catch (err) {
      console.error('Error connecting to PostgreSQL:', err.message);
      throw err;
    }
  }

  async createTables() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS song_ratings (
          id SERIAL PRIMARY KEY,
          song_id TEXT NOT NULL,
          user_session TEXT NOT NULL,
          rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(song_id, user_session)
        )
      `);

      console.log('Database tables created successfully');
    } catch (err) {
      console.error('Error creating tables:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query failed:', {
        query: text,
        params: params,
        error: error.message
      });
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
    console.log('PostgreSQL connection pool closed');
  }
}

module.exports = PostgresDB;