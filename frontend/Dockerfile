# Use Node.js LTS
FROM node:20-alpine AS development

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Copy package and lock files first (for caching)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the source code
COPY . .

# Expose port (Next.js dev server)
EXPOSE 3000

# Run Next.js in dev mode
CMD ["pnpm", "dev"]
