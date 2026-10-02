import { NextResponse } from 'next/server';
import { dbStore } from '@repo/database';
import { storeService } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');

  const allSessions = Array.from(dbStore.workSessions.values()).map((ws) => {
    const emp = storeService.getEmployeeById(ws.employeeId);
    return {
      ...ws,
      employeeName: emp?.user?.name || 'Noma‘lum',
      employeeCode: emp?.employeeCode || '',
      department: emp?.department || '',
    };
  });

  if (employeeId) {
    const activeSession = storeService.getActiveWorkSession(employeeId);
    const empSessions = allSessions.filter((s) => s.employeeId === employeeId);
    return NextResponse.json({
      success: true,
      session: activeSession,
      sessions: empSessions,
    });
  }

  return NextResponse.json(allSessions);
}
