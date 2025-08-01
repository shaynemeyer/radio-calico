# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm start` or `npm run dev` - Start the Express server on http://localhost:3000
- `npm install` - Install dependencies after cloning
- `make security-audit` - Run npm security audit to check for vulnerabilities
- `make security-test` - Run security tests (fails on moderate+ vulnerabilities)
- `make security-fix` - Automatically fix security vulnerabilities

## Architecture Overview

This is a RadioCalico live streaming web application built with Node.js, featuring both a radio streaming interface and a basic user management system.

**Backend (server.js):**

- Express.js server serving both API endpoints and static files
- SQLite database (database.db) for data persistence
- CORS enabled for cross-origin requests
- REST API endpoints under `/api/` prefix
- Server runs on port 3000 (configurable via PORT env var)

**Frontend File Structure:**

```
public/
├── index.html              # Main HTML structure (73 lines)
├── css/
│   └── styles.css         # All CSS styling and responsive design
├── scripts/
│   └── site.js           # All JavaScript functionality
├── RadioCalicoLogoTM.png  # RadioCalico brand logo
└── ...
```

**Frontend Features:**

- Live radio streaming interface using HLS (HTTP Live Streaming)
- HLS.js library for browser compatibility with deferred loading
- Real-time metadata display (now playing, recent tracks, album art)
- Audio controls with volume slider and play/pause functionality
- Song rating system with thumbs up/down voting
- User session management with localStorage
- Smart metadata polling: 30s when active, 60s when tab hidden
- Lazy-loaded album art images for improved performance
- DNS prefetching for external CDN resources
- Responsive design following RadioCalico brand guidelines
- Clean separation of concerns: HTML structure, CSS styling, JavaScript behavior

**Database Schema:**

- `users` table with fields: id, name, email, created_at
- `song_ratings` table with fields: id, song_id, user_session, rating, created_at
- SQLite database auto-creates tables on startup
- Database file: `./database.db`

**Key API Endpoints:**

- `GET /api/users` - Retrieve all users
- `POST /api/users` - Create new user (requires name, email in JSON body)
- `POST /api/songs/rate` - Submit song rating (requires songId, rating, userSession)
- `GET /api/songs/:songId/ratings` - Get rating totals for a song
- `GET /api/songs/:songId/user-rating/:userSession` - Get user's rating for a song
- `GET /` - Serves the radio streaming interface

**External Dependencies:**

- Stream URL: `https://d3d4yli4hf5bmh.cloudfront.net/hls/live.m3u8`
- Metadata API: `https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json`
- Album art: `https://d3d4yli4hf5bmh.cloudfront.net/cover.jpg`
- HLS.js library: `https://cdn.jsdelivr.net/npm/hls.js@latest` (deferred loading)
- Google Fonts: Montserrat and Open Sans with `font-display: swap`

**Performance Optimizations:**

- DNS prefetching for CloudFront and jsDelivr CDNs
- Lazy loading for album art images
- Deferred script loading for HLS.js library
- Adaptive metadata polling based on tab visibility
- Font loading optimization with display swap

The server handles graceful shutdown with proper database connection cleanup on SIGINT.

### Style Guide

- A text version of the styling guide for the webpage is at RadioCalico_Style_Guide.txt
- The Radio Calico logo is RadioCalicoLogoTM.png
