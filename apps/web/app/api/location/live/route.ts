import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
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
