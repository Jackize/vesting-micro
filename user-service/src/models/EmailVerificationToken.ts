import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

export interface IEmailVerificationToken extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IEmailVerificationTokenModel
  extends Model<IEmailVerificationToken> {
  generateToken(): string;
  findByToken(token: string): Promise<IEmailVerificationToken | null>;
  deleteByUserId(userId: string): Promise<void>;
}

const EmailVerificationTokenSchema: Schema =
  new Schema<IEmailVerificationToken>(
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
    },
    {
      timestamps: true,
      collection: "email_verification_tokens",
    },
  );

// Indexes for performance
EmailVerificationTokenSchema.index({ userId: 1 });
EmailVerificationTokenSchema.index({ token: 1 });
EmailVerificationTokenSchema.index({ expiresAt: 1 });

// Static method to generate secure random token
EmailVerificationTokenSchema.statics.generateToken = function (): string {
  return crypto.randomBytes(32).toString("hex");
};

// Static method to find token by token string
EmailVerificationTokenSchema.statics.findByToken = async function (
  token: string,
): Promise<IEmailVerificationToken | null> {
  return this.findOne({ token });
};

// Static method to delete all tokens for a user
EmailVerificationTokenSchema.statics.deleteByUserId = async function (
  userId: string,
): Promise<void> {
  await this.deleteMany({ userId });
};

const EmailVerificationToken: IEmailVerificationTokenModel = mongoose.model<
  IEmailVerificationToken,
  IEmailVerificationTokenModel
>("EmailVerificationToken", EmailVerificationTokenSchema);

export default EmailVerificationToken;
