'use server';

import { connectToDatabase } from '@/database/mongoose';
import Watchlist from '@/database/models/watchlist.model';

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

    // Find the user by email in Better Auth users collection
    const user = await db.collection('users').findOne<{ id?: string, _id?: unknown, email?: string }>({ email }
    );

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return [];
    }

    const userId = user.id || user._id?.toString();

    if (!userId) {
      console.error('User ID not found');
      return [];
    }

    // Query the Watchlist collection for this user's symbols
    const watchlistItems = await Watchlist.find({ userId }).select('symbol').lean();

    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error('Error fetching watchlist symbols:', error);
    return [];
  }
};