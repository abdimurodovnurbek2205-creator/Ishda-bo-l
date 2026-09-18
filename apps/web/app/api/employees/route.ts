import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const employees = storeService.getAllEmployees();
  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      employeeCode,
      department,
      position,
      workingHoursStart,
      workingHoursEnd,
      password,
    } = body;

    if (!name || !phone || !email || !employeeCode || !department || !position || !password) {
      return NextResponse.json(
        { error: 'Barcha talab qilingan maydonlarni to‘ldiring' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);
    const newEmp = storeService.createEmployee({
      name,
      phone,
      email,
      employeeCode,
      department,
      position,
      workingHoursStart,
      workingHoursEnd,
      passwordHash,
    });

    return NextResponse.json(newEmp, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Xodim yaratishda xatolik' }, { status: 500 });
  }
}
