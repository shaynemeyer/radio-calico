# RadioCalico 🎵

A live streaming web application built with Node.js, featuring real-time metadata display and an interactive song rating system.

*Originally created as part of learning Claude Code from the excellent course by Frank Kane: https://www.udemy.com/course/anthropic-claude-code*

## Features

- **Live Radio Streaming** - HLS-based audio streaming with browser compatibility
- **Real-time Metadata** - Now playing information with album art display  
- **Interactive Rating System** - Thumbs up/down voting with user session persistence
- **Responsive Design** - Works across desktop and mobile devices
- **User Management** - Basic user registration and session handling

## Quick Start

### Using Docker (Recommended)

**Development:**
```bash
npm run docker:dev
# or
docker compose --profile development up
```

**Production:**
```bash
npm run docker:prod  
# or
docker compose --profile production up -d
```

### Local Development

```bash
npm install
npm start
```

Visit http://localhost:3000

## Architecture

### Backend
- **Express.js** server with CORS support
- **SQLite** database for data persistence
- **REST API** endpoints for ratings and user management
- **Graceful shutdown** handling for containerized deployments

### Frontend
- **Vanilla JavaScript** with HLS.js for streaming
- **Real-time metadata** fetching every 30 seconds
- **LocalStorage** for user session persistence
- **Responsive CSS** following RadioCalico brand guidelines

### Database Schema
- `users` - User registration and management
- `song_ratings` - Rating system with unique constraints

## API Endpoints

- `GET /` - Serve main application
- `GET /api/users` - Retrieve all users
- `POST /api/users` - Create new user
- `POST /api/songs/rate` - Submit song rating
- `GET /api/songs/:songId/ratings` - Get rating totals
- `GET /api/songs/:songId/user-rating/:userSession` - Get user's rating

## Testing

### Unit Tests
```bash
npm test                # All tests
npm run test:backend    # API tests only
npm run test:frontend   # Frontend tests only
npm run test:coverage   # Coverage report
```

### Docker Testing
```bash
npm run docker:test     # Run tests in container
```

**Test Coverage:** 33 tests covering rating system, API endpoints, and frontend functionality.

## Docker Deployment

### Container Images
- **Production**: Optimized Alpine Linux with non-root user
- **Development**: Hot reload with debugging support
- **Security**: Health checks, signal handling, minimal attack surface

### Deployment Options
- **Development Profile**: Hot reload, debugging, full logging
- **Production Profile**: Optimized, health monitoring, data persistence
- **Nginx Profile**: Reverse proxy, SSL, rate limiting

### Quick Commands
```bash
./scripts/build.sh      # Build all images
./scripts/deploy.sh     # Deploy with health checks
./scripts/test.sh       # Run containerized tests
```

See [DOCKER.md](DOCKER.md) for complete deployment guide.

## Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/database.db
```

## External Dependencies

- **Stream URL**: CloudFront HLS endpoint
- **Metadata API**: Real-time track information
- **Album Art**: Dynamic cover art updates

## Development

### Project Structure
```
├── public/                 # Static frontend files
│   ├── css/styles.css     # Application styling
│   ├── scripts/site.js    # Frontend JavaScript
│   └── index.html         # Main HTML template
├── tests/                 # Comprehensive test suite
├── scripts/               # Deployment automation
├── nginx/                 # Reverse proxy configuration
├── server.js              # Express application
└── docker-compose.yml     # Multi-environment orchestration
```

### Key Features
- **Rating System**: Real-time voting with user session tracking
- **Metadata Display**: Live track information with error handling
- **Audio Controls**: Play/pause, volume control, status display
- **Session Management**: Persistent user identification

## Production Deployment

1. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy with Docker**
   ```bash
   ./scripts/deploy.sh production
   ```

3. **Monitor Health**
   ```bash
   docker compose logs -f
   curl http://localhost:3000/
   ```

### Security Features
- Non-root container execution
- Rate limiting with Nginx
- Security headers (CSP, HSTS, etc.)
- Graceful shutdown handling
- Health check monitoring

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

## License

This project is licensed under the ISC License.
