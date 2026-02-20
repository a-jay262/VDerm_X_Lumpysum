# Runtime stage  
FROM node:18-alpine

WORKDIR /app

# Install Python3, pip, dev tools
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Create a virtual environment
RUN python3 -m venv /venv

# Upgrade pip and install Python dependencies in the venv
RUN /venv/bin/pip install --upgrade pip
RUN /venv/bin/pip install pillow tensorflow numpy

# Add the virtual environment to PATH so `python3` points here
ENV PATH="/venv/bin:$PATH"

# Copy only production Node dependencies and build
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy Python model files
COPY --from=builder /build/src/model ./src/model

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start Node.js app
CMD ["node", "dist/main.js"]