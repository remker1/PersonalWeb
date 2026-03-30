FROM node:20-alpine
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend code and data
COPY backend/ ./backend/

# Copy built frontend
COPY dist/ ./dist/

EXPOSE 3000
CMD ["node", "backend/server.js"]
