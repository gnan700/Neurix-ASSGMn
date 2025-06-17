# Use specific Node.js version with Alpine for security
FROM node:18-alpine

RUN apk update && apk upgrade

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies and clean cache
RUN npm install --only=production && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy application code
COPY . .

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]