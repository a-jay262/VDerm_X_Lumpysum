# Build stage
FROM node:18-bullseye AS builder

WORKDIR /build

# Copy backend package files first
COPY backend/package.json backend/package-lock.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy all backend source code and config
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Runtime stage - TensorFlow official image with Python and Node.js
FROM tensorflow/tensorflow:2.13.0

WORKDIR /app

# Install Node.js on top of the TensorFlow image
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify installations
RUN echo "=== Installation Verification ===" && \
    which python3 && \
    python3 --version && \
    python3 -c "import tensorflow; print('TensorFlow version:', tensorflow.__version__)" && \
    node --version && \
    npm --version && \
    echo "=== All checks passed ==="

# Copy only production Node dependencies
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy the model files and Python scripts
COPY backend/src/model/ ./src/model/

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
