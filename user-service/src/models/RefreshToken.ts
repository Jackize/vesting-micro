import crypto from "crypto";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRefreshToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

export interface IRefreshTokenModel extends Model<IRefreshToken> {
  generateToken(): string;
  findByToken(token: string): Promise<IRefreshToken | null>;
  findByUserId(userId: string): Promise<IRefreshToken[]>;
  deleteByUserId(userId: string): Promise<void>;
  deleteByToken(token: string): Promise<void>;
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
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
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

RefreshTokenSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString("hex");
};

RefreshTokenSchema.statics.findByToken = async function (
  token: string,
): Promise<IRefreshToken | null> {
  return this.findOne({ token });
};

RefreshTokenSchema.statics.findByUserId = async function (
  userId: string,
): Promise<IRefreshToken[]> {
  return this.find({ userId });
};

RefreshTokenSchema.statics.deleteByUserId = async function (
  userId: string,
): Promise<void> {
  await this.deleteMany({ userId });
};

RefreshTokenSchema.statics.deleteByToken = async function (
  token: string,
): Promise<void> {
  await this.deleteOne({ token });
};

const RefreshToken: IRefreshTokenModel = mongoose.model<
  IRefreshToken,
  IRefreshTokenModel
>("RefreshToken", RefreshTokenSchema);

export default RefreshToken;
