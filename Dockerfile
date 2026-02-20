# Build stage
FROM node:18-alpine AS builder

WORKDIR /build

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy all source code and config
COPY . ./

# Build TypeScript
RUN npm run build

# Runtime stage  
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 py3-pip
RUN pip3 install pillow

# Copy only production dependencies
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./
COPY --from=builder /build/src/model ./src/model

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start application
CMD ["node", "dist/main.js"]
