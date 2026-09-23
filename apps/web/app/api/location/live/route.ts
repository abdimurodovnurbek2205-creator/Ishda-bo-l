import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { dbStore } from '@repo/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Clean up any stale active work sessions in memory store
  const allSessions = Array.from(dbStore.workSessions.values());
  const nowMs = Date.now();
  let cleaned = false;
  for (const ws of allSessions) {
    if (ws.status === 'ACTIVE' && ws.startedAt) {
      const ageHours = (nowMs - new Date(ws.startedAt).getTime()) / (1000 * 3600);
      if (ageHours > 16) {
        ws.status = 'COMPLETED';
        ws.endedAt = new Date(new Date(ws.startedAt).getTime() + 9 * 3600 * 1000).toISOString();
        cleaned = true;
      }
    }
  }
  if (cleaned) {
    dbStore.saveToFile();
  }

  const summary = storeService.getLiveSummary();
  return NextResponse.json(
    {
      timestamp: new Date().toISOString(),
      employees: summary,
      total: summary.length,
      workingCount: summary.filter((s) => s.status === 'WORKING').length,
      delayedCount: summary.filter((s) => s.status === 'DELAYED').length,
      offlineCount: summary.filter((s) => s.status === 'OFFLINE').length,
      notWorkingCount: summary.filter((s) => s.status === 'NOT_WORKING').length,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
