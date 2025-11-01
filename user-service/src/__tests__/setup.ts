import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-super-secret-jwt-key-for-testing';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-super-secret-refresh-key-for-testing';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  try {
    // Create an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'vestify_users_test',
      },
    });

    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      dbName: 'vestify_users_test',
    });

    console.log('✅ Test database (in-memory) connected');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    process.exit(1);
  }
});

// Cleanup after each test
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
});

// Close database connection after all tests
afterAll(async () => {
  try {
    // Drop the database
    await mongoose.connection.dropDatabase();
    
    // Close mongoose connection
    await mongoose.connection.close();
    
    // Stop the in-memory MongoDB server
    if (mongoServer) {
      await mongoServer.stop();
    }

    console.log('✅ Test database connection closed');
  } catch (error) {
    console.error('Error closing test database connection:', error);
  }
});
