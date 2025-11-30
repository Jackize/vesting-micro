import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILoginHistory extends Document {
  userId: string;
  ip: string;
  userAgent?: string;
  deviceType?: string;
  location?: {
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  loginAt: Date;
  suspicious: boolean;
  suspiciousReasons?: string[];
}

export interface ILoginHistoryModel extends Model<ILoginHistory> {
  findByUserId(userId: string, limit?: number): Promise<ILoginHistory[]>;
  deleteOldRecords(daysOld: number): Promise<void>;
}

const LoginHistorySchema: Schema = new Schema<ILoginHistory>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    ip: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
    },
    deviceType: {
      type: String,
    },
    location: {
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
    loginAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    suspicious: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspiciousReasons: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "login_history",
  },
);

// Indexes for performance
LoginHistorySchema.index({ userId: 1, loginAt: -1 });
LoginHistorySchema.index({ userId: 1, suspicious: 1 });
LoginHistorySchema.index({ loginAt: 1 }); // For cleanup

// Static method to find login history for a user
LoginHistorySchema.statics.findByUserId = async function (
  userId: string,
  limit: number = 10,
): Promise<ILoginHistory[]> {
  return this.find({ userId }).sort({ loginAt: -1 }).limit(limit);
};

// Static method to delete old records
LoginHistorySchema.statics.deleteOldRecords = async function (
  daysOld: number = 90,
): Promise<void> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  await this.deleteMany({ loginAt: { $lt: cutoffDate } });
};

const LoginHistory: ILoginHistoryModel = mongoose.model<
  ILoginHistory,
  ILoginHistoryModel
>("LoginHistory", LoginHistorySchema);

export default LoginHistory;
