import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { dbStore } from '@repo/database';
import { calculateTotalRouteDistance } from '@/lib/distance';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const employees = storeService.getAllEmployees();

  let csvContent = 'Xodim,Kodi,Bo‘lim,Sana,Ish Boshlanishi,Ish Yakunlanishi,Davomiyligi (soat),Boshlang‘ich Joy,Oxirgi Joy,Masofa (km),Nuqtalar Soni\n';

  for (const emp of employees) {
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

    const startLoc = locs.length > 0 ? `${locs[0].district || 'Bandixon'}` : '-';
    const endLoc = locs.length > 0 ? `${locs[locs.length - 1].district || 'Bandixon'}` : '-';

    const line = `"${emp.user?.name || ''}","${emp.employeeCode}","${emp.department}","${date}","${workStart}","${workEnd}","${durationHours}","${startLoc}","${endLoc}","${distanceKm}","${locs.length}"\n`;
    csvContent += line;
  }

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="xodimlar-lokatsiya-hisobot-${date}.csv"`,
    },
  });
}
