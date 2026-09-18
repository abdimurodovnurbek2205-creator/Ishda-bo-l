import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Avtorizatsiya belgisi yetishmaydi' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Yaroqsiz yoki muddati o‘tgan token' }, { status: 401 });
  }

  const user = storeService.getUserById(payload.userId);
  if (!user) {
    return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
  }

  const employee = storeService.getEmployeeByUserId(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    employee,
  });
}
