FROM tiangolo/node-python:18

WORKDIR /app

# Copy package.json first for caching
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Copy model files (already in backend/src/model)
# Already copied above

# Install Python dependencies
RUN pip install --no-cache-dir tensorflow pillow numpy

# Create uploads directory
RUN mkdir -p /app/uploads

ENV NODE_ENV=production
ENV MODEL_PATH=/app/src/model
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

CMD ["node", "dist/main.js"]