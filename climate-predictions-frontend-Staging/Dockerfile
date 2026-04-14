# Development Dockerfile (with live reloading)
FROM node:22

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the files
COPY . .

EXPOSE 3000

# Start React in development mode (with hot reloading)
CMD ["npm", "start"]