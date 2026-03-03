import { Schema, model, models, Document } from 'mongoose';

export interface AlertItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: 'upper' | 'lower';
  threshold: number;
  currentPrice?: number;
  changePercent?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
}

const AlertSchema = new Schema<AlertItem>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    alertName: {
      type: String,
      required: true,
      trim: true,
    },
    alertType: {
      type: String,
      required: true,
      enum: ['upper', 'lower'],
    },
    threshold: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
    },
    changePercent: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastTriggeredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate identical alerts for the same user
AlertSchema.index(
  { userId: 1, symbol: 1, alertType: 1, threshold: 1 },
  { unique: true }
);

const Alert =
  models?.Alert || model<AlertItem>('Alert', AlertSchema);

export default Alert;

