# Build stage
FROM node:18-bullseye AS builder

WORKDIR /build

# Copy package files (from backend directory in repo root)
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy all backend source code
COPY . .

# Build the NestJS application
RUN npm run build

# Runtime stage
FROM node:18-bullseye-slim

WORKDIR /app

# Install Python and dependencies for ML model
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment and install Python packages
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
RUN pip install --no-cache-dir \
    tensorflow==2.20.0 \
    numpy==1.26.4 \
    Pillow==10.2.0

# Copy built application from builder
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy model files - FIXED: Remove 'backend/' prefix
COPY src/model ./src/model

# Copy .env.example - FIXED: Remove 'backend/' prefix
# COPY .env.example .env

# Set production environment
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode !== 200 ? 1 : 0)})" || exit 1

# Start the application
CMD ["node", "dist/main.js"]