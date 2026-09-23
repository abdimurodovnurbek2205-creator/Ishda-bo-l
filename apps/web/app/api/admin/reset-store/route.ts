import { NextResponse } from 'next/server';
import { dbStore } from '@repo/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Clear all work sessions and locations in memory store
    dbStore.workSessions.clear();
    dbStore.locations = [];

    // 2. Persist empty state to disk
    dbStore.saveToFile();

    return NextResponse.json({
      success: true,
      message: "Barcha eski test seanslari va lokatsiyalari to'liq tozalandi.",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
