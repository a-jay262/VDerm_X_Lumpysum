# Runtime stage  
FROM node:18-alpine

WORKDIR /app

# Install Python3, pip, dev tools
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Create a Python virtual environment
RUN python3 -m venv /venv

# Upgrade pip and install Python dependencies inside the venv
RUN /venv/bin/pip install --upgrade pip
RUN /venv/bin/pip install pillow tensorflow numpy

# Make the venv Python the default
ENV PATH="/venv/bin:$PATH"

# Copy production Node dependencies and build from builder stage
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy Python model scripts
COPY --from=builder /build/src/model ./src/model

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start Node app
CMD ["node", "dist/main.js"]