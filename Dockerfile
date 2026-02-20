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

# Runtime stage - Node.js on Debian with Python support
FROM node:18-bullseye

WORKDIR /app

# Install Python and required build tools for pip packages
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify installations - this helps debug build issues
RUN echo "=== Installation Verification ===" && \
    which python3 && \
    python3 --version && \
    pip3 --version && \
    node --version && \
    npm --version && \
    echo "=== All checks passed ==="

# Copy only production Node dependencies
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy the model files and Python scripts
COPY backend/src/model/ ./src/model/

# Install Python dependencies for the ML model
RUN pip3 install --no-cache-dir tensorflow pillow numpy

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
