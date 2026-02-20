FROM debian:bullseye-slim

# Install Node + Python together
RUN apt-get update && apt-get install -y \
    python3 python3-pip nodejs npm git curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

COPY backend/src/model/ ./src/model/
RUN pip3 install --no-cache-dir tensorflow pillow numpy

ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3
ENV MODEL_PATH=/app/src/model

CMD ["node", "dist/main.js"]