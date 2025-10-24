'use server';
import { auth } from "@/lib/better-auth/auth";
import { inngest } from "../inngest/client";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export const signupWithEmail = async({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: fullName,
      }
    })
    if(res){
      await inngest.send({
        name: 'app/user.created',
        data: {
          email,
          name: fullName,
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
        }
      })
    }
    return {
      success: true,
      message: 'Signup with email successful',
      data: res,
    }
  } catch (error) {
    console.log('Signup with email failed', error);
    return {
      success: false,
      message: 'Signup with email failed',
      data: error,
    }
  }
}



export const signOut = async() => {
  try {
    await auth.api.signOut({ headers: await headers()});
    return {
      success: true,
      message: 'Sign out successful',
    }
  } catch (error) {
    console.log('Sign out failed', error);
    return {
      success: false,
      message: 'Sign out failed',
      data: error,
    }
  }
}


export const signinWithEmail = async({ email, password }: SignInFormData) => {
  try {
    const res = await auth.api.signInEmail({
      body: {
        email,
        password,
      }
    })
    return {
      success: true,
      message: 'Signin with email successful',
      data: res,
    }
  } catch (error) {
    console.log('Signin with email failed', error);
    return {
      success: false,
      message: 'Signin with email failed',
      data: error,
    }
  }
}

export const deleteAccount = async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      return { success: false, message: "No active session found" };
    }

    const userId = session.user.id;

    const { connectToDatabase } = await import("@/database/mongoose");
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) throw new Error("Database connection not found");

    // ✅ Correct collection name
    await Promise.all([
      db.collection("user").deleteOne({ _id: new ObjectId(userId) }),
      db.collection("session").deleteMany({ userId }),
      db.collection("account").deleteMany({ userId }),
    ]);

    // ✅ Delete watchlist
    const Watchlist = (await import("@/database/models/watchlist.model")).default;
    await Watchlist.deleteMany({ userId });

    // ✅ Sign out
    await auth.api.signOut({ headers: await headers() });

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("Delete account failed", error);
    return {
      success: false,
      message: "Failed to delete account",
      data: error,
    };
  }
};

