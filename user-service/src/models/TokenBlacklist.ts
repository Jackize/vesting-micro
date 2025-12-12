import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITokenBlacklist extends Document {
  token: string;
  userId: string;
  blacklistedAt: Date;
  expiresAt: Date;
}

export interface ITokenBlacklistModel extends Model<ITokenBlacklist> {}

const TokenBlacklistSchema: Schema = new Schema<ITokenBlacklist>(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    blacklistedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
  },
  {
    timestamps: false,
    collection: "token_blacklist",
  },
);

// Indexes for performance
TokenBlacklistSchema.index({ token: 1 });
TokenBlacklistSchema.index({ userId: 1 });
TokenBlacklistSchema.index({ expiresAt: 1 });

const TokenBlacklist: ITokenBlacklistModel = mongoose.model<
  ITokenBlacklist,
  ITokenBlacklistModel
>("TokenBlacklist", TokenBlacklistSchema);

export default TokenBlacklist;
