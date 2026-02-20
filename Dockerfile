# Build stage
FROM node:18-alpine AS builder

WORKDIR /build

# Copy backend package files first
COPY backend/package.json backend/package-lock.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy all backend source code and config
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Runtime stage - use Python slim which has both Python and can install Node  
FROM python:3.11-slim

WORKDIR /app

# Install Node.js using apt
RUN apt-get update && \
    apt-get install -y --no-install-recommends nodejs npm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify Python and Node are available
RUN python3 --version && node --version && npm --version

# Copy only production Node dependencies
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy the model files and Python scripts
COPY backend/src/model/ ./src/model/

# Install Python dependencies for the ML model
RUN pip install --no-cache-dir tensorflow pillow numpy

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV MODEL_PATH=/app/src/model
ENV PYTHONUNBUFFERED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start application
CMD ["node", "dist/main.js"]
