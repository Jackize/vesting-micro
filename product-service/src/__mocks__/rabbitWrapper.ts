// Shared mock for rabbitWrapper - used across all test files
// Jest automatically picks this up when you call jest.mock("../../rabbitWrapper")

const mockChannel = {
  assertQueue: jest.fn().mockResolvedValue({
    queue: "test-queue",
    messageCount: 0,
    consumerCount: 0,
  }),
  sendToQueue: jest.fn(),
  assertExchange: jest.fn(),
  publish: jest.fn(),
  consume: jest.fn(),
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
};

const mockConnection = {
  close: jest.fn().mockResolvedValue(undefined),
  on: jest.fn(),
  createChannel: jest.fn().mockResolvedValue(mockChannel),
};

const RabbitWrapper = {
  channel: mockChannel,
  connection: mockConnection,
  isConnected: jest.fn().mockReturnValue(true),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

// Export as default to match the actual module structure
// The actual module exports: export default RabbitWrapper.getInstance()
export default RabbitWrapper;
