# RadioCalico Docker Deployment Guide

This guide covers deploying RadioCalico using Docker containers for both development and production environments.

## Quick Start

### Development
```bash
# Start development environment with hot reload
docker-compose --profile development up

# Or use the deployment script
./scripts/deploy.sh development
```

### Production
```bash
# Start production environment
docker-compose --profile production up -d

# Or use the deployment script
./scripts/deploy.sh production
```

## Container Architecture

### Production Container (`Dockerfile`)
- **Base Image**: `node:18-alpine` (minimal, secure)
- **Security**: Non-root user, minimal dependencies
- **Optimizations**: Production-only npm install, layer caching
- **Health Checks**: Built-in HTTP health monitoring
- **Signal Handling**: Graceful shutdown support

### Development Container (`Dockerfile.dev`)
- **Base Image**: `node:18-alpine` with dev tools
- **Features**: Hot reload with nodemon, debugging port (9229)
- **Testing**: Full test suite and development dependencies
- **Volume Mounting**: Source code mounted for live updates

## Environment Profiles

### Development Profile
- **Port**: 3000 (app) + 9229 (debugger)
- **Features**: Hot reload, debugging, full logging
- **Database**: Development volume (`radiocalico-dev-data`)
- **Use Case**: Local development, testing

### Production Profile
- **Port**: 3000 (app only)
- **Features**: Optimized, minimal logging, health checks
- **Database**: Production volume (`radiocalico-data`)
- **Security**: Non-root user, minimal attack surface

### Nginx Profile (Optional)
- **Port**: 80 (HTTP) + 443 (HTTPS)
- **Features**: Reverse proxy, rate limiting, SSL termination
- **Security**: Security headers, CSP policies
- **Performance**: Gzip compression, static file caching

## Deployment Scripts

### Build Script (`./scripts/build.sh`)
```bash
# Build all Docker images
./scripts/build.sh
```
Creates:
- `radiocalico:latest` (production)
- `radiocalico:dev` (development)
- `radiocalico:v1.0.0` (versioned)

### Deploy Script (`./scripts/deploy.sh`)
```bash
# Deploy to production
./scripts/deploy.sh production

# Deploy to development
./scripts/deploy.sh development
```

### Test Script (`./scripts/test.sh`)
```bash
# Run unit tests in container
./scripts/test.sh

# Run integration tests
./scripts/test.sh --integration
```

## Environment Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Application
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/database.db

# Security (optional)
SESSION_SECRET=your-secret-key-here

# External APIs (optional - uses defaults)
METADATA_URL=https://d3d4yli4hf5bmh.cloudfront.net/metadatav2.json
```

### Docker Compose Overrides
- `docker-compose.yml` - Base configuration
- `docker-compose.override.yml` - Local development overrides
- Environment-specific profiles for different deployment targets

## Data Persistence

### Production Volume
```bash
# Backup production database
docker run --rm -v radiocalico_radiocalico-data:/data -v $(pwd):/backup alpine tar czf /backup/radiocalico-backup.tar.gz -C /data .

# Restore production database
docker run --rm -v radiocalico_radiocalico-data:/data -v $(pwd):/backup alpine tar xzf /backup/radiocalico-backup.tar.gz -C /data
```

### Development Volume
Development data is stored in `radiocalico-dev-data` volume and persists across container restarts.

## Security Features

### Container Security
- **Non-root user**: Application runs as `radiocalico` user (UID 1001)
- **Minimal base image**: Alpine Linux for reduced attack surface
- **Health checks**: Automatic container health monitoring
- **Signal handling**: Graceful shutdown on SIGTERM/SIGINT

### Network Security (with Nginx)
- **Rate limiting**: API and general request limits
- **Security headers**: HSTS, CSP, X-Frame-Options
- **SSL termination**: HTTPS support with configurable certificates
- **Access logs**: Request logging and monitoring

## Monitoring and Logging

### Health Checks
```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{.State.Health}}' radiocalico-production
```

### Application Logs
```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f radiocalico-prod
```

### Database Access
```bash
# Access production database
docker exec -it radiocalico-production sqlite3 /app/data/database.db

# Backup database
docker exec radiocalico-production sqlite3 /app/data/database.db ".dump" > backup.sql
```

## Troubleshooting

### Common Issues

**Container won't start**
```bash
# Check logs
docker-compose logs radiocalico-prod

# Check disk space
docker system df

# Prune unused resources
docker system prune
```

**Database permissions**
```bash
# Fix volume permissions
docker run --rm -v radiocalico_radiocalico-data:/data alpine chown -R 1001:1001 /data
```

**Network connectivity**
```bash
# Test network connectivity
docker exec -it radiocalico-production curl -f http://localhost:3000/

# Check exposed ports
docker port radiocalico-production
```

### Performance Tuning

**Resource limits**
```yaml
# Add to docker-compose.yml
services:
  radiocalico-prod:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

**Database optimization**
- Use SSD storage for database volume
- Regular database vacuuming for SQLite
- Monitor database size and performance

## Production Deployment Checklist

- [ ] Configure environment variables in `.env`
- [ ] Set up SSL certificates for HTTPS
- [ ] Configure backup strategy for database
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Test disaster recovery procedures
- [ ] Security scan containers before deployment
- [ ] Set up automated updates for base images

## Advanced Configuration

### Custom Networks
```bash
# Create custom network
docker network create radiocalico-network

# Run with custom network
docker-compose --profile production up -d
```

### External Database
Modify `docker-compose.yml` to use external PostgreSQL or MySQL if needed.

### Load Balancing
Use multiple container instances with a load balancer for high availability.

### Secrets Management
Use Docker secrets or external secret management systems for sensitive configuration.