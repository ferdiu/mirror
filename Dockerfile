######################################################
# Stage 1: build
FROM node:current-alpine AS build

# Set environment variables
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install && npm cache clean --force

# Copy the rest of the application files
COPY . .

# Build the TypeScript code
RUN npm run build

######################################################
# Stage 2: Production image
FROM node:current-alpine

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --only=production && npm cache clean --force

# Copy public dir
COPY public ./public

# Copy the rest of the application files from the build stage
COPY --from=build /app/dist ./dist

# Command to run the application
CMD ["node", "dist/app.js"]
