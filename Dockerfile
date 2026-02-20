# # Build stage
# FROM node:18-alpine AS builder

# WORKDIR /build

# # Copy package files
# COPY package.json package-lock.json ./

# # Install all dependencies (including dev for build)
# RUN npm install

# # Copy all source code and config
# COPY . ./

# # Build TypeScript
# RUN npm run build

# # Runtime stage  
# FROM node:18-alpine

# WORKDIR /app

# RUN apk add --no-cache python3 py3-pip



# # Copy only production dependencies
# COPY --from=builder /build/node_modules ./node_modules
# COPY --from=builder /build/dist ./dist
# COPY --from=builder /build/package.json ./
# COPY --from=builder /build/src/model ./src/model

# EXPOSE 3000

# # Health check
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# # Start application
# CMD ["node", "dist/main.js"]

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
FROM node:18-bullseye

WORKDIR /app

# Install Python + pip + build tools
RUN apt-get update && \
    apt-get install -y python3 python3-venv python3-pip build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /venv

# Upgrade pip & install Python packages
RUN /venv/bin/pip install --upgrade pip
RUN /venv/bin/pip install pillow tensorflow numpy

# Make venv Python the default
ENV PATH="/venv/bin:$PATH"

# Copy Node build and dependencies from builder stage
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy Python model scripts
COPY src/model ./src/model

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start application
CMD ["node", "dist/main.js"]