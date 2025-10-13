# Multi-stage build for pluglink-web frontend

# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies needed for build)
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Build the application (without environment variables)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script for runtime environment variable injection
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Use entrypoint to inject runtime environment variables
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
