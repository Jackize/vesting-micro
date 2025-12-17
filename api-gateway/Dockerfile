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

# Copy the rest of the source code
COPY . .

# Expose port
EXPOSE 3000

# Run the server
CMD ["pnpm", "dev"]

# # Development stage
# FROM base AS development
# WORKDIR /app
# COPY . .
# EXPOSE 3000
# CMD ["pnpm", "dev"]

# # Production stage
# FROM base AS production
# WORKDIR /app
# COPY . .
# RUN pnpm build
# EXPOSE 3000
# CMD ["pnpm", "start"]

