# Multi-stage build for production-ready image
# Supports AMD64 (Intel/AMD) and ARM64 (Apple Silicon, Raspberry Pi)
FROM --platform=$BUILDPLATFORM node:18-alpine AS builder

# Set build arguments
ARG BUILDPLATFORM
ARG TARGETPLATFORM

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs . .

# Create uploads and microservices directories
RUN mkdir -p /app/src/whatever/uploads/reports && \
    mkdir -p /app/src/whatever/uploads/exports && \
    chown -R nodejs:nodejs /app/src/whatever/uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "src/whatever/server.js"]
