# Jobs Service

Microservice responsible for handling background jobs (expiration, email, notification, indexing) using BullMQ and RabbitMQ.

## Overview

The Jobs Service listens for events from RabbitMQ and processes various background jobs using BullMQ. It handles:

- ⏰ **Order Expiration**: Automatically expires orders that haven't been paid
- 📧 **Email Jobs**: Sends transactional and marketing emails
- 🔔 **Notification Jobs**: Sends push notifications and SMS
- 🔍 **Indexing Jobs**: (Coming soon) Indexes products and search data

## Features

- 🔄 **Event-Driven Architecture**: Uses RabbitMQ for event communication
- 🛡️ **Reliable Job Processing**: Uses BullMQ with retry mechanisms
- 📊 **Scalable**: Handles high volumes of jobs with concurrent processing
- 🔔 **Multiple Job Types**: Supports expiration, email, notification, and more
- 📈 **Monitoring**: Comprehensive logging and error handling

## Architecture

```
Events (RabbitMQ)
    ↓
Listeners
    ↓
BullMQ Queues (Delayed Jobs)
    ↓
Workers (Process Jobs)
    ↓
Publish Events (RabbitMQ) / Execute Actions
```

## Job Types

### 1. Order Expiration Jobs

- **Queue**: `order-expiration`
- **Trigger**: `order.created` event
- **Action**: Publishes `order.expired` event when order expires
- **Concurrency**: 10 jobs
- **Rate Limit**: 100 jobs/second

### 2. Email Jobs

- **Queue**: `email`
- **Trigger**: Can be triggered by various events
- **Action**: Sends emails via email service
- **Concurrency**: 5 jobs
- **Rate Limit**: 50 emails/second
- **Retries**: 5 attempts

### 3. Notification Jobs

- **Queue**: `notification`
- **Trigger**: Can be triggered by various events
- **Action**: Sends push notifications and SMS
- **Concurrency**: 10 jobs
- **Rate Limit**: 100 notifications/second
- **Retries**: 3 attempts

## Environment Variables

```env
# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Optional

# Application Configuration
NODE_ENV=development
```

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode
pnpm dev

# Run in production mode
pnpm start
```

## Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Format code
pnpm format
```

## Docker

```bash
# Build Docker image
docker build -t jobs-service .

# Run Docker container
docker run -p 3005:3005 \
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672 \
  -e REDIS_HOST=redis \
  -e REDIS_PORT=6379 \
  -e NODE_ENV=production \
  jobs-service
```

## Dependencies

- **BullMQ**: Job queue for handling background jobs
- **RabbitMQ (amqplib)**: Event-driven communication
- **Redis (ioredis)**: Backend for BullMQ
- **@vestify/shared**: Shared types and events

## Events

### Listens To

- `order:created` - When a new order is created (for expiration jobs)

### Publishes

- `order:expired` - When an order has expired

## Job Configuration

### Order Expiration

- **Delay**: Based on order `expiresAt` timestamp (default: 15 minutes)
- **Attempts**: 3 retries with exponential backoff
- **Concurrency**: 10 jobs processed concurrently
- **Rate Limiting**: Max 100 jobs per second

### Email

- **Attempts**: 5 retries with exponential backoff
- **Concurrency**: 5 jobs processed concurrently
- **Rate Limiting**: Max 50 emails per second

### Notification

- **Attempts**: 3 retries with exponential backoff
- **Concurrency**: 10 jobs processed concurrently
- **Rate Limiting**: Max 100 notifications per second

## Monitoring

The service logs important events:
- Job scheduling
- Job processing status
- Event publishing
- Errors and retries

## Error Handling

- Jobs are retried with exponential backoff
- Failed jobs are kept for 7 days for debugging
- Completed jobs are kept for 24 hours
- Unhandled errors trigger graceful shutdown

## Adding New Job Types

1. Create a new queue in `src/queues/`
2. Create a worker in `src/jobs/<job-type>/`
3. Create a listener if needed in `src/jobs/<job-type>/`
4. Register the worker in `src/server.ts`
5. Export from `src/jobs/index.ts`

## Related Services

- **Order Service**: Creates orders and listens to `order.expired` events
- **Notification Service**: Sends expiration notifications to users
- **Product Service**: Releases reserved inventory when orders expire

## License

MIT


