# 1️⃣ Build stage
FROM node:18-alpine AS builder

WORKDIR /build

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . ./

# Build TypeScript
RUN npm run build

# Copy Python model scripts (so they're available in builder stage)
# Optional: you can skip if they're only in runtime
# COPY src/model ./src/model

# 2️⃣ Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install Python + pip + build tools
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Create Python virtual environment
RUN python3 -m venv /venv

# Upgrade pip & install required Python packages in venv
RUN /venv/bin/pip install --upgrade pip
RUN /venv/bin/pip install pillow tensorflow numpy

# Make the venv Python the default
ENV PATH="/venv/bin:$PATH"

# Copy Node dependencies and build from builder stage
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy Python model scripts **directly from local context**
COPY src/model ./src/model

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start app
CMD ["node", "dist/main.js"]