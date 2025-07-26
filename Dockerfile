# Production Dockerfile for RadioCalico
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S radiocalico -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY . .

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/data && \
    chown -R radiocalico:nodejs /app

# Switch to non-root user
USER radiocalico

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/database.db

# Start the application
CMD ["node", "server.js"]