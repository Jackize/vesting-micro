# Use Node.js LTS version
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install 

# Development stage
FROM base AS development
WORKDIR /app
COPY . .
EXPOSE 3003
CMD ["pnpm", "dev"]

