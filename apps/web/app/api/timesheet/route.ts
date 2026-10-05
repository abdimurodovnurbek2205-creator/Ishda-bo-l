import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { getUzbekistanDateString } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getUzbekistanDateString();

    const records = storeService.getTimesheetByDate(date);

    return NextResponse.json(
      {
        success: true,
        date,
        total: records.length,
        presentCount: records.filter((r) => r.status === 'PRESENT').length,
        lateCount: records.filter((r) => r.status === 'LATE').length,
        excusedCount: records.filter((r) => r.status === 'EXCUSED').length,
        absentCount: records.filter((r) => r.status === 'ABSENT').length,
        fieldWorkCount: records.filter((r) => r.status === 'FIELD_WORK').length,
        records,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.records && Array.isArray(body.records)) {
      const saved = storeService.bulkSaveTimesheet(body.records);
      return NextResponse.json({ success: true, count: saved.length, records: saved });
    }

    if (body.record) {
      const saved = storeService.saveTimesheetRecord(body.record);
      return NextResponse.json({ success: true, record: saved });
    }

    return NextResponse.json({ success: false, error: 'records yoki record kiritilishi shart' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
