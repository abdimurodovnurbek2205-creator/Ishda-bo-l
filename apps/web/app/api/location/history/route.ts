import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { calculateTotalRouteDistance } from '@/lib/distance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId talab qilinadi' }, { status: 400 });
  }

  const locations = storeService.getEmployeeLocations(employeeId, date);
  const employee = storeService.getEmployeeById(employeeId);
  const totalDistanceKm = calculateTotalRouteDistance(locations);

  let durationMinutes = 0;
  if (locations.length >= 2) {
    const firstTime = new Date(locations[0].timestamp).getTime();
    const lastTime = new Date(locations[locations.length - 1].timestamp).getTime();
    durationMinutes = Math.round((lastTime - firstTime) / 60000);
  }

  return NextResponse.json(
    {
      employeeId,
      employeeName: employee?.user?.name || 'Noma‘lum',
      date,
      totalPoints: locations.length,
      totalDistanceKm,
      durationMinutes,
      startLocation: locations[0] || null,
      endLocation: locations.length > 0 ? locations[locations.length - 1] : null,
      points: locations,
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
