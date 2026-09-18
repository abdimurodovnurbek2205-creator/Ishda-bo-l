import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const emp = storeService.getEmployeeById(params.id);
  if (!emp) {
    return NextResponse.json({ error: 'Xodim topilmadi' }, { status: 404 });
  }
  return NextResponse.json(emp);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const updated = storeService.updateEmployee(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Xodim topilmadi' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Yangilashda xatolik' }, { status: 500 });
  }
}
