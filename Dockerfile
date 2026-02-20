# Use Node.js 18 LTS
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package.json backend/package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/src ./src
COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/nest-cli.json ./

# Build the backend
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]
