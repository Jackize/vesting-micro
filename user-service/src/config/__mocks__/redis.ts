const store = new Map();
export const redisClient = {
  set: jest.fn((key, value) => {
    store.set(key, value);
    return Promise.resolve("OK");
  }),
  get: jest.fn((key) => {
    const value = store.get(key);
    return Promise.resolve(value);
  }),
  del: jest.fn((key) => {
    store.delete(key);
    return Promise.resolve(1);
  }),
  setex: jest.fn((key, ttl: number, value: string) => {
    store.set(key, value);
    return Promise.resolve("OK");
  }),
  incr: jest.fn((key) => {
    const value = Number(store.get(key)) || 0;
    const newVal = value + 1;
    store.set(key, `${newVal}`);
    return Promise.resolve(`${newVal}`);
  }),
  expire: jest.fn(() => Promise.resolve()),
  on: jest.fn(() => Promise.resolve()),
  removeListener: jest.fn(() => Promise.resolve()),
  once: jest.fn(() => Promise.resolve()),
  connect: jest.fn(() => Promise.resolve()),
  status: "ready",
  removeAllListeners: jest.fn(() => Promise.resolve()),
  error: jest.fn(() => Promise.resolve()),
  quit: jest.fn(() => Promise.resolve()),
  retryStrategy: jest.fn(() => Promise.resolve()),
};
