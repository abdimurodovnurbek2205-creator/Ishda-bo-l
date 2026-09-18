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
    const { name, phone, email, password, department, position } = body;

    if (!name || !phone || !password) {
      return jsonWithCors({ error: 'Ism, telefon raqam va parol kiritilishi shart' }, 400);
    }

    const cleanPhone = phone.trim();
    const existingUser = storeService.getUserByPhoneOrEmail(cleanPhone);
    if (existingUser) {
      return jsonWithCors({ error: 'Bu telefon raqam allaqachon ro‘yxatdan o‘tgan' }, 400);
    }

    const passwordHash = hashPassword(password);
    const userEmail = email ? email.trim() : `${cleanPhone.replace(/[^0-9]/g, '')}@bandixon.gov.uz`;
    const empCode = `EMP-${Math.floor(100 + Math.random() * 900)}`;

    const newEmployee = storeService.createEmployee({
      name: name.trim(),
      phone: cleanPhone,
      email: userEmail,
      employeeCode: empCode,
      department: department?.trim() || 'Monitoring Bo‘limi',
      position: position?.trim() || 'Xodim',
      passwordHash,
      workingHoursStart: '08:00',
      workingHoursEnd: '17:00',
    });

    const user = storeService.getUserById(newEmployee.userId);
    if (!user) {
      return jsonWithCors({ error: 'Ro‘yxatdan o‘tishda xatolik yuz berdi' }, 500);
    }

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
      employee: {
        id: newEmployee.id,
        employeeCode: newEmployee.employeeCode,
        department: newEmployee.department,
        position: newEmployee.position,
        isTrackingEnabled: newEmployee.isTrackingEnabled,
        workingHoursStart: newEmployee.workingHoursStart,
        workingHoursEnd: newEmployee.workingHoursEnd,
      },
    });
  } catch (err: any) {
    return jsonWithCors({ error: err.message || 'Server xatosi' }, 500);
  }
}
