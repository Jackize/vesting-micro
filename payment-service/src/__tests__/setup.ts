import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

declare global {
  var signin: (id?: string) => string[];
}

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017";
process.env.MONGODB_DB_NAME =
  process.env.MONGODB_DB_NAME || "vestify_payments_test";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-super-secret-jwt-key-for-testing";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  try {
    // Create an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: "vestify_payments_test",
      },
    });

    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri, {
      dbName: "vestify_payments_test",
    });
  } catch (error) {
    console.error("❌ Failed to connect to test database:", error);
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
    console.error("Error cleaning up test data:", error);
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

    console.log("✅ Test database connection closed");
  } catch (error) {
    console.error("Error closing test database connection:", error);
  }
});

global.signin = (id?: string) => {
  // Build a JWT payload.  { id, email }
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
    email: "test@test.com",
    role: "user",
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_SECRET!);

  // Build session Object. { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString("base64");

  // return a string thats the cookie with the encoded data
  return [`session=${base64}`];
};
