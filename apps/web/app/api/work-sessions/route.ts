import { NextResponse } from 'next/server';
import { dbStore } from '@repo/database';
import { storeService } from '@/lib/store';

export async function GET() {
  const sessions = Array.from(dbStore.workSessions.values()).map((ws) => {
    const emp = storeService.getEmployeeById(ws.employeeId);
    return {
      ...ws,
      employeeName: emp?.user?.name || 'Noma‘lum',
      employeeCode: emp?.employeeCode || '',
      department: emp?.department || '',
    };
  });

  return NextResponse.json(sessions);
}
