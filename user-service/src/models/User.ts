import bcrypt from "bcryptjs";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin" | "moderator";
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  lockoutLevel: number;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  resetFailedLoginAttempts(): Promise<void>;
  incrementFailedLoginAttempts(): Promise<void>;
  isAccountLocked(): boolean;
  getLockoutDuration(): number;
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const UserSchema: Schema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, "Please provide a valid phone number"],
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
    lockoutLevel: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false, // Don't return secret by default
    },
    mfaBackupCodes: {
      type: [String],
      select: false, // Don't return backup codes by default
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get full name
UserSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

// Instance method to check if account is locked
UserSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.accountLockedUntil && new Date() < this.accountLockedUntil);
};

// Instance method to reset failed login attempts
UserSchema.methods.resetFailedLoginAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  this.lockoutLevel = 0;
  await this.save();
};

// Instance method to get lockout duration
UserSchema.methods.getLockoutDuration = function (): number {
  return this.accountLockedUntil
    ? Math.ceil((this.accountLockedUntil.getTime() - Date.now()) / 1000)
    : 0;
};

// Instance method to increment failed login attempts and apply lockout
UserSchema.methods.incrementFailedLoginAttempts =
  async function (): Promise<void> {
    this.failedLoginAttempts += 1;

    // Lockout logic:
    // Level 1: After 3 failures → lock for 1 minute
    // Level 2: After 3 more failures (total 6) → lock for 5 minutes
    // Level 3: After 3 more failure (total 9) → lock for 15 minutes
    // Level 4: After 3 more failure (total 12) → lock for 60 minutes
    // Level 5: After 3 more failure (total 15) → lock for 24 hours
    const LOCKOUT_RULES = [
      { attempts: 3, duration: 1 * 60 * 1000 },
      { attempts: 6, duration: 5 * 60 * 1000 },
      { attempts: 9, duration: 15 * 60 * 1000 },
      { attempts: 12, duration: 60 * 60 * 1000 },
      { attempts: 15, duration: 24 * 60 * 60 * 1000 },
    ];
    const rule = LOCKOUT_RULES.find(
      (rule) => this.failedLoginAttempts === rule.attempts,
    );
    if (rule) {
      this.lockoutLevel = LOCKOUT_RULES.indexOf(rule) + 1;
      this.accountLockedUntil = new Date(Date.now() + rule.duration);
    }
    await this.save();
  };

// Static method to find user by email
UserSchema.statics.findByEmail = async function (
  email: string,
): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Transform output when converting to JSON
UserSchema.set("toJSON", {
  transform: function (doc, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

const User: IUserModel = mongoose.model<IUser, IUserModel>("User", UserSchema);

export default User;
