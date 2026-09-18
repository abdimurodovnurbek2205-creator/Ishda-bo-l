import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { verifyToken } from '@/lib/auth';
import { jsonWithCors, handleCorsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    let employeeId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.substring(7));
      if (payload) {
        const emp = storeService.getEmployeeByUserId(payload.userId);
        if (emp) employeeId = emp.id;
      }
    }

    const body = await request.json().catch(() => ({}));
    if (!employeeId && body.employeeId) {
      employeeId = body.employeeId;
    }

    if (!employeeId) {
      return jsonWithCors({ error: 'Avtorizatsiya yoki employeeId kiritilishi lozim' }, 400);
    }

    // Record final location point if provided
    if (body.latitude !== undefined && body.longitude !== undefined) {
      storeService.addLocation({
        employeeId,
        latitude: body.latitude,
        longitude: body.longitude,
        accuracy: body.accuracy,
        speed: body.speed,
        heading: body.heading,
        timestamp: new Date().toISOString(),
      });
    }

    const session = storeService.endWorkSession(employeeId, body.latitude, body.longitude);

    return jsonWithCors({
      success: true,
      message: 'Ish rejimi muvaffaqiyatli yakunlandi',
      session,
    });
  } catch (err: any) {
    return jsonWithCors({ error: err.message || 'Ishni yakunlashda xatolik' }, 500);
  }
}
