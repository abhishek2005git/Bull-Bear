import { inngest } from '@/lib/inngest/client';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await inngest.send({
      name: 'app/send.daily.news',
      data: {}
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'News summary function triggered successfully. Check Inngest dashboard for execution.' 
    });
  } catch (error) {
    console.error('Error triggering news function:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to trigger news function',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Optional: GET endpoint to check status
export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to trigger the daily news summary function',
    endpoint: 'POST /api/test-news',
    note: 'This will manually trigger the news email for all users'
  });
}
