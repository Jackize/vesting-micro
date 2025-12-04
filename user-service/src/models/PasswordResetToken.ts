import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

export interface IPasswordResetToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface IPasswordResetTokenModel extends Model<IPasswordResetToken> {
  generateToken(): string;
  findByToken(token: string): Promise<IPasswordResetToken | null>;
  deleteByUserId(userId: string): Promise<void>;
}

const PasswordResetTokenSchema: Schema = new Schema<IPasswordResetToken>(
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
      index: { expireAfterSeconds: 0 }, // Auto-delete expired documents
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "password_reset_tokens",
  },
);

// Indexes for performance
PasswordResetTokenSchema.index({ userId: 1 });
PasswordResetTokenSchema.index({ token: 1 });
PasswordResetTokenSchema.index({ expiresAt: 1 });
PasswordResetTokenSchema.index({ used: 1 });

// Static method to generate secure random token
PasswordResetTokenSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString("hex");
};

// Static method to find token by token string
PasswordResetTokenSchema.statics.findByToken = async function (
  token: string,
): Promise<IPasswordResetToken | null> {
  return this.findOne({ token });
};

// Static method to delete all tokens for a user
PasswordResetTokenSchema.statics.deleteByUserId = async function (
  userId: string,
): Promise<void> {
  await this.deleteMany({ userId });
};

const PasswordResetToken: IPasswordResetTokenModel = mongoose.model<
  IPasswordResetToken,
  IPasswordResetTokenModel
>("PasswordResetToken", PasswordResetTokenSchema);

export default PasswordResetToken;
