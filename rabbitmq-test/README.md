# RabbitMQ Test Scripts

This directory contains test scripts for RabbitMQ message queue functionality.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Make sure RabbitMQ is running (via Skaffold):
```bash
skaffold dev
```

RabbitMQ will be available at:
- **AMQP**: `amqp://guest:guest@localhost:5672`
- **Management UI**: `http://localhost:15672` (username: `guest`, password: `guest`)

## Environment Variables

- `RABBITMQ_URL`: RabbitMQ connection string (default: `amqp://guest:guest@localhost:5672`)

## Usage

### Producer (Send Messages)

Run the producer to send messages to the queue:

```bash
pnpm run produce
```

This will send 10 test messages to the `test_queue` queue.

### Consumer (Receive Messages)

Run a single consumer:

```bash
pnpm run consume
```

Or run with a specific worker name:

```bash
pnpm run consume:1  # Worker name: worker1
pnpm run consume:2  # Worker name: worker2
```

### Testing Work Queue Pattern (Load Balancing)

To test that multiple consumers share the work:

1. **Terminal 1**: Start first consumer
   ```bash
   pnpm run consume:1
   ```

2. **Terminal 2**: Start second consumer
   ```bash
   pnpm run consume:2
   ```

3. **Terminal 3**: Run producer
   ```bash
   pnpm run produce
   ```

You should see messages being distributed between the two consumers. Each consumer will process one message at a time (due to `prefetch(1)`), and messages will be distributed in a round-robin fashion.

## How It Works

### Work Queue Pattern

- **Durable Queue**: Queue survives broker restarts
- **Persistent Messages**: Messages survive broker restarts
- **Fair Dispatch**: Using `prefetch(1)` ensures each consumer only gets one unacknowledged message at a time
- **Manual Acknowledgment**: Messages are only removed from the queue after successful processing
- **Load Balancing**: Multiple consumers automatically share the workload

### Message Flow

1. Producer sends messages to `test_queue`
2. Messages are stored in the queue
3. Consumers connect and start listening
4. RabbitMQ distributes messages to consumers in round-robin fashion
5. Each consumer processes one message at a time (due to prefetch=1)
6. Consumer acknowledges message after successful processing
7. Message is removed from queue

## Queue Configuration

- **Queue Name**: `test_queue`
- **Durable**: `true` (survives broker restarts)
- **Message Persistence**: `true` (messages survive broker restarts)
- **Prefetch Count**: `1` (fair dispatch - one message per consumer at a time)
- **Acknowledgment Mode**: Manual (messages are acked after processing)

