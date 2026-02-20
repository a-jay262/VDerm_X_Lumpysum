FROM tiangolo/node-python:18

WORKDIR /app

# Copy Node dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source & build
COPY backend/ ./
RUN npm run build

# Copy model files
COPY backend/src/model/ ./src/model/

# Install Python dependencies
RUN pip install --no-cache-dir tensorflow pillow numpy

# Create uploads directory
RUN mkdir -p /app/uploads

# Environment
ENV NODE_ENV=production
ENV MODEL_PATH=/app/src/model
ENV PYTHON_PATH=/usr/local/bin/python3
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

CMD ["node", "dist/main.js"]