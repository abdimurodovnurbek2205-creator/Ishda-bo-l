import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { dbStore } from '@repo/database';
import { calculateTotalRouteDistance } from '@/lib/distance';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const employees = storeService.getAllEmployees();
  const reportRows = employees.map((emp) => {
    const locs = storeService.getEmployeeLocations(emp.id, date);
    const distanceKm = calculateTotalRouteDistance(locs);

    const empSessions = Array.from(dbStore.workSessions.values()).filter(
      (s) => s.employeeId === emp.id && s.startedAt.startsWith(date)
    );

    const firstSession = empSessions[0] || null;
    const lastSession = empSessions[empSessions.length - 1] || null;

    let workStart = firstSession ? new Date(firstSession.startedAt).toLocaleTimeString('uz-UZ') : '-';
    let workEnd = lastSession && lastSession.endedAt ? new Date(lastSession.endedAt).toLocaleTimeString('uz-UZ') : (firstSession ? 'Ishda' : '-');

    let durationHours = 0;
    if (firstSession) {
      const startMs = new Date(firstSession.startedAt).getTime();
      const endMs = lastSession && lastSession.endedAt ? new Date(lastSession.endedAt).getTime() : Date.now();
      durationHours = Math.round(((endMs - startMs) / (1000 * 3600)) * 10) / 10;
    }

    const startLoc = locs.length > 0 ? `${locs[0].district || 'Bandixon'} (${locs[0].latitude.toFixed(4)}, ${locs[0].longitude.toFixed(4)})` : '-';
    const endLoc = locs.length > 0 ? `${locs[locs.length - 1].district || 'Bandixon'} (${locs[locs.length - 1].latitude.toFixed(4)}, ${locs[locs.length - 1].longitude.toFixed(4)})` : '-';

    return {
      employeeId: emp.id,
      employeeName: emp.user?.name || 'Noma‘lum',
      employeeCode: emp.employeeCode,
      department: emp.department,
      date,
      workStart,
      workEnd,
      durationHours,
      startLocation: startLoc,
      endLocation: endLoc,
      distanceKm,
      locationPointCount: locs.length,
    };
  });

  return NextResponse.json({
    date,
    totalEmployees: employees.length,
    reports: reportRows,
  });
}
