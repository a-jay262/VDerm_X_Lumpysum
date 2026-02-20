FROM node:18-alpine

WORKDIR /app

# Install Python + pip + venv
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Create a virtual environment
RUN python3 -m venv /venv

# Activate virtual environment and install dependencies
RUN /venv/bin/pip install --upgrade pip
RUN /venv/bin/pip install pillow tensorflow numpy

# Add venv binaries to PATH
ENV PATH="/venv/bin:$PATH"

# Copy built Node app
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/package.json ./

# Copy Python model files
COPY --from=builder /build/src/model ./src/model

EXPOSE 3000

CMD ["node", "dist/main.js"]