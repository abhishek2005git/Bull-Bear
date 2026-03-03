'use server';

import { connectToDatabase } from '@/database/mongoose';
import Alert from '@/database/models/alert.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';
import { getQuote } from '@/lib/actions/finnhub.actions';

// Better-auth MongoDB adapter uses collection "user" (singular), not "users"
const USER_COLLECTION = 'user';

function getUserIdFromDbUser(user: { id?: string; _id?: unknown } | null): string | null {
  if (!user) return null;
  return user.id ?? (user._id != null ? String(user._id) : null) ?? null;
}

function mapAlertDocToAlert(doc: any): Alert {
  return {
    id: String(doc._id),
    symbol: doc.symbol,
    company: doc.company,
    alertName: doc.alertName,
    currentPrice: typeof doc.currentPrice === 'number' ? doc.currentPrice : 0,
    alertType: doc.alertType,
    threshold: typeof doc.threshold === 'number' ? doc.threshold : 0,
    changePercent:
      typeof doc.changePercent === 'number' ? doc.changePercent : undefined,
  };
}

export const getAlertsByEmail = async (email: string): Promise<Alert[]> => {
  try {
    if (!email) return [];

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) return [];

    const user = await db
      .collection(USER_COLLECTION)
      .findOne<{ id?: string; _id?: unknown; email?: string }>({ email });
    if (!user) return [];

    const userId = getUserIdFromDbUser(user);
    if (!userId) return [];

    const alerts = await Alert.find({ userId }).sort({ createdAt: -1 }).lean();

    return alerts.map(mapAlertDocToAlert);
  } catch (error) {
    console.error('Error fetching alerts by email:', error);
    return [];
  }
};

export const getAlertsForCurrentUser = async (): Promise<Alert[]> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return [];
    }

    const userId = session.user.id;
    await connectToDatabase();

    const alerts = await Alert.find({ userId }).sort({ createdAt: -1 }).lean();
    return alerts.map(mapAlertDocToAlert);
  } catch (error) {
    console.error('Error fetching alerts for current user:', error);
    return [];
  }
};

export const createAlert = async (
  data: AlertData
): Promise<{ success: boolean; message: string; alert?: Alert }> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id || !session.user.email) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;
    await connectToDatabase();

    const upperSymbol = data.symbol.trim().toUpperCase();
    if (!upperSymbol) {
      throw new Error('Symbol is required');
    }

    const thresholdNumber = Number(data.threshold);
    if (!Number.isFinite(thresholdNumber) || thresholdNumber <= 0) {
      throw new Error('Threshold must be a positive number');
    }

    // Fetch latest quote to enrich alert
    const quote = await getQuote(upperSymbol);
    const currentPrice =
      quote && typeof quote.c === 'number' ? quote.c : thresholdNumber;
    const changePercent =
      quote && typeof quote.dp === 'number' ? quote.dp : undefined;

    const alertName =
      data.alertName?.trim() ||
      `${upperSymbol} price ${data.alertType === 'upper' ? 'above' : 'below'} ${thresholdNumber}`;

    const created = await Alert.create({
      userId,
      symbol: upperSymbol,
      company: data.company,
      alertName,
      alertType: data.alertType,
      threshold: thresholdNumber,
      currentPrice,
      changePercent,
    });

    return {
      success: true,
      message: 'Alert created successfully',
      alert: mapAlertDocToAlert(created),
    };
  } catch (error: any) {
    console.error('Error creating alert:', error);

    // Handle duplicate alerts gracefully
    if (error && typeof error === 'object' && error.code === 11000) {
      return {
        success: true,
        message: 'An identical alert already exists',
      };
    }

    return {
      success: false,
      message: error?.message || 'Failed to create alert',
    };
  }
};

export const updateAlert = async (
  params: { alertId: string; data: Partial<AlertData> }
): Promise<{ success: boolean; message: string; alert?: Alert }> => {
  const { alertId, data } = params;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;
    await connectToDatabase();

    const updatePayload: any = {};

    if (typeof data.alertName === 'string') {
      updatePayload.alertName = data.alertName.trim();
    }
    if (typeof data.alertType === 'string') {
      updatePayload.alertType = data.alertType;
    }
    if (typeof data.threshold === 'string' && data.threshold.trim() !== '') {
      const thresholdNumber = Number(data.threshold);
      if (!Number.isFinite(thresholdNumber) || thresholdNumber <= 0) {
        throw new Error('Threshold must be a positive number');
      }
      updatePayload.threshold = thresholdNumber;
    }

    if (Object.keys(updatePayload).length === 0) {
      return {
        success: false,
        message: 'No changes to update',
      };
    }

    const updated = await Alert.findOneAndUpdate(
      { _id: alertId, userId },
      updatePayload,
      { new: true }
    ).lean();

    if (!updated) {
      return {
        success: false,
        message: 'Alert not found',
      };
    }

    return {
      success: true,
      message: 'Alert updated successfully',
      alert: mapAlertDocToAlert(updated),
    };
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return {
      success: false,
      message: error?.message || 'Failed to update alert',
    };
  }
};

export const deleteAlert = async (
  alertId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;
    await connectToDatabase();

    const result = await Alert.deleteOne({ _id: alertId, userId });

    if (result.deletedCount === 0) {
      return {
        success: false,
        message: 'Alert not found',
      };
    }

    return {
      success: true,
      message: 'Alert deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting alert:', error);
    return {
      success: false,
      message: error?.message || 'Failed to delete alert',
    };
  }
};

