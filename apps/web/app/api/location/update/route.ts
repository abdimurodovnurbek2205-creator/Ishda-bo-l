import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { verifyToken } from '@/lib/auth';
import { LocationUpdatePayload } from '@repo/types';
import { jsonWithCors, handleCorsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    let authenticatedEmployeeId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      if (payload) {
        const emp = storeService.getEmployeeByUserId(payload.userId);
        if (emp) authenticatedEmployeeId = emp.id;
      }
    }

    const body = await request.json();
    const items: LocationUpdatePayload[] = Array.isArray(body)
      ? body
      : body.locations && Array.isArray(body.locations)
      ? body.locations
      : [body];

    const results = [];
    const allEvents = [];

    for (const item of items) {
      const targetEmpId = authenticatedEmployeeId || item.employeeId;
      if (!targetEmpId) continue;

      const payloadWithEmpId: LocationUpdatePayload = {
        ...item,
        employeeId: targetEmpId,
        timestamp: item.timestamp || new Date().toISOString(),
      };

      const res = storeService.addLocation(payloadWithEmpId);
      results.push(res.location);
      if (res.events && res.events.length > 0) {
        allEvents.push(...res.events);
      }
    }

    return jsonWithCors({
      success: true,
      count: results.length,
      locations: results,
      geofenceEvents: allEvents,
    });
  } catch (err: any) {
    return jsonWithCors({ error: err.message || 'GPS malumotlarini saqlashda xatolik' }, 500);
  }
}
