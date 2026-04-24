'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';
import { auth } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

// Better-auth MongoDB adapter uses collection "user" (singular), not "users"
const USER_COLLECTION = 'user';

function getUserIdFromDbUser(user: { id?: string; _id?: unknown } | null): string | null {
  if (!user) return null;
  return user.id ?? (user._id != null ? String(user._id) : null) ?? null;
}

export const getWatchlistSymbolsByEmail = async (
  email: string
): Promise<string[]> => {
  try {
    if(!email){
      console.error('Email not provided');
      return [];
    }
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      console.error('Database connection not found');
      return [];
    }

    const user = await db.collection(USER_COLLECTION).findOne<{ id?: string; _id?: unknown; email?: string }>({ email });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return [];
    }

    const userId = getUserIdFromDbUser(user);

    if (!userId) {
      console.error('User ID not found');
      return [];
    }

    const watchlistItems = await Watchlist.find({ userId }).select('symbol').lean();

    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error('Error fetching watchlist symbols:', error);
    return [];
  }
};

export const getWatchlistByEmail = async (email: string): Promise<StockWithData[]> => {
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

    const items = await Watchlist.find({ userId })
      .select('userId symbol company addedAt')
      .sort({ addedAt: -1 })
      .lean();

    return items as unknown as StockWithData[];
  } catch (e) {
    console.error('Error fetching watchlist:', e);
    return [];
  }
};

export const addToWatchlist = async (params: { symbol: string; company: string }) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not found');
    }

    const existing = await Watchlist.findOne({ userId, symbol: params.symbol });
    if (existing) {
      return { success: true, message: 'Already in watchlist' };
    }

    await Watchlist.create({
      userId,
      symbol: params.symbol,
      company: params.company,
      addedAt: new Date(),
    });

    return { success: true, message: 'Added to watchlist' };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
};

export const removeFromWatchlist = async (symbol: string) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = session.user.id;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not found');
    }

    await Watchlist.deleteOne({ userId, symbol });

    return { success: true, message: 'Removed from watchlist' };
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
};