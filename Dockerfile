# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run deploy:build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S busapp -u 1001

# Copy built application and node_modules
COPY --from=builder --chown=busapp:nodejs /app/dist ./dist
COPY --from=builder --chown=busapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=busapp:nodejs /app/package*.json ./

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER busapp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "deploy:start"]