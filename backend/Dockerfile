# 1️⃣ Build stage
FROM node:18-bullseye AS builder

WORKDIR /build

# Copy package files
COPY package.json package-lock.json ./

# Install Node dependencies
RUN npm install

# Copy all source code
COPY . ./

# Build TypeScript
RUN npm run build

# 2️⃣ Runtime stage
FROM node:18-bullseye-slim  # Use slim version to save space

WORKDIR /app

# Install Python + pip + build tools (minimal)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /venv

# Upgrade pip & install Python packages (with specific versions)
RUN /venv/bin/pip install --upgrade pip
RUN /venv/bin/pip install --no-cache-dir \
    pillow==10.0.0 \
    numpy==1.24.3 \
    tensorflow-cpu==2.13.0  # Use CPU-only version for Render

# Make venv Python the default
ENV PATH="/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV NODE_ENV=production

# Copy Node build and dependencies from builder stage
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy Python model scripts and model file
COPY src/model ./src/model

# Verify model exists
RUN ls -la ./src/model/

# Expose port
EXPOSE 3000

# Health check (simplified)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000').then(r => {if (!r.ok) process.exit(1)}).catch(() => process.exit(1))"

# Start application
CMD ["node", "dist/main.js"]