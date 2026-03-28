import bcrypt from "bcryptjs";
import mongoose, { Document, Model, Schema } from "mongoose";
import { findByIdOrThrow } from "./plugin/findByIdOrThrow.plugin";

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
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findByIdOrThrow(id: string, errorMessage?: string): Promise<IUser>;
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
      select: false,
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
  },
  {
    timestamps: true,
    collection: "users",
  },
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

UserSchema.plugin(findByIdOrThrow);

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

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

UserSchema.statics.findByEmail = async function (
  this: Model<IUser>,
  email: string,
): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

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
