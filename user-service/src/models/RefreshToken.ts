import crypto from "crypto";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRefreshToken extends Document {
  userId: string;
  token: string;
  sessionId: string;
  expiresAt: Date;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    deviceType?: string;
  };
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface IRefreshTokenModel extends Model<IRefreshToken> {
  generateToken(): string;
  generateSessionId(): string;
  findByToken(token: string): Promise<IRefreshToken | null>;
  findBySessionId(sessionId: string): Promise<IRefreshToken | null>;
  findByUserId(userId: string): Promise<IRefreshToken[]>;
  deleteByUserId(userId: string): Promise<void>;
  deleteByToken(token: string): Promise<void>;
  deleteBySessionId(sessionId: string): Promise<void>;
}

const RefreshTokenSchema: Schema = new Schema<IRefreshToken>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
    deviceInfo: {
      userAgent: {
        type: String,
      },
      ip: {
        type: String,
      },
      deviceType: {
        type: String,
      },
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "refresh_tokens",
  },
);

// Indexes for performance
RefreshTokenSchema.index({ userId: 1 });
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ sessionId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 });

// Static method to generate secure random token
RefreshTokenSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString("hex");
};

// Static method to generate session ID
RefreshTokenSchema.statics.generateSessionId = function (): string {
  return crypto.randomBytes(16).toString("hex");
};

// Static method to find token by token string
RefreshTokenSchema.statics.findByToken = async function (
  token: string,
): Promise<IRefreshToken | null> {
  return this.findOne({ token });
};

// Static method to find all tokens for a user
RefreshTokenSchema.statics.findByUserId = async function (
  userId: string,
): Promise<IRefreshToken[]> {
  return this.find({ userId });
};

// Static method to delete all tokens for a user
RefreshTokenSchema.statics.deleteByUserId = async function (
  userId: string,
): Promise<void> {
  await this.deleteMany({ userId });
};

// Static method to delete a specific token
RefreshTokenSchema.statics.deleteByToken = async function (
  token: string,
): Promise<void> {
  await this.deleteOne({ token });
};

// Static method to delete by session ID
RefreshTokenSchema.statics.deleteBySessionId = async function (
  sessionId: string,
): Promise<void> {
  await this.deleteOne({ sessionId });
};

// Static method to find by session ID
RefreshTokenSchema.statics.findBySessionId = async function (
  sessionId: string,
): Promise<IRefreshToken | null> {
  return this.findOne({ sessionId });
};

const RefreshToken: IRefreshTokenModel = mongoose.model<
  IRefreshToken,
  IRefreshTokenModel
>("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
