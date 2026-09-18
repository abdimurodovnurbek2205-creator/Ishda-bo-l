import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { hashPassword, generateToken } from '@/lib/auth';
import { jsonWithCors, handleCorsOptions } from '@/lib/cors';

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, phone, identifier, password } = body;
    const userIdentifier = email || phone || identifier;

    if (!userIdentifier || !password) {
      return jsonWithCors({ error: 'Telefon raqam (yoki Email) va parol kiritilishi shart' }, 400);
    }

    const user = storeService.getUserByPhoneOrEmail(userIdentifier);
    if (!user || !user.isActive) {
      return jsonWithCors({ error: 'Telefon raqam/email yoki parol noto‘g‘ri' }, 401);
    }

    const inputHash = hashPassword(password);
    if (user.passwordHash !== inputHash) {
      return jsonWithCors({ error: 'Email yoki parol noto‘g‘ri' }, 401);
    }

    const employee = storeService.getEmployeeByUserId(user.id);
    const token = generateToken({ userId: user.id, role: user.role, email: user.email });

    return jsonWithCors({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      employee: employee ? {
        id: employee.id,
        employeeCode: employee.employeeCode,
        department: employee.department,
        position: employee.position,
        isTrackingEnabled: employee.isTrackingEnabled,
        workingHoursStart: employee.workingHoursStart,
        workingHoursEnd: employee.workingHoursEnd,
      } : null,
    });
  } catch (err: any) {
    return jsonWithCors({ error: err.message || 'Server xatosi' }, 500);
  }
}
