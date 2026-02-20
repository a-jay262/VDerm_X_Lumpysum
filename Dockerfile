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

# Runtime stage - includes Python for ML model  
FROM python:3.11-slim

WORKDIR /app

# Install Node.js in the Python image
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Verify Python is available (create symlink if needed)
RUN which python || which python3 || echo "Python not found"

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy only production Node dependencies
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy the model files and Python scripts
COPY backend/src/model/ ./src/model/

# Install Python dependencies for the ML model
RUN pip install --no-cache-dir tensorflow pillow numpy

EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV MODEL_PATH=/app/src/model

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start application
CMD ["node", "dist/main.js"]
