import { NextResponse } from 'next/server';
import { storeService } from '@/lib/store';
import { getUzbekistanDateString } from '@/lib/date-utils';
import { dbStore } from '@repo/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    if (typeof (dbStore as any).initRemoteDb === 'function') {
      await (dbStore as any).initRemoteDb();
    }
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    // Monthly timesheet matrix mode
    if (monthParam && yearParam) {
      const year = parseInt(yearParam, 10);
      const month = parseInt(monthParam, 10);
      const monthlyData = storeService.getTimesheetForMonth(year, month);
      return NextResponse.json(
        {
          success: true,
          type: 'monthly',
          ...monthlyData,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );
    }

    // Daily timesheet mode
    const date = searchParams.get('date') || getUzbekistanDateString();
    const records = storeService.getTimesheetByDate(date);

    return NextResponse.json(
      {
        success: true,
        type: 'daily',
        date,
        total: records.length,
        presentCount: records.filter((r) => r.status === 'PRESENT').length,
        lateCount: records.filter((r) => r.status === 'LATE').length,
        excusedCount: records.filter((r) => r.status === 'EXCUSED').length,
        absentCount: records.filter((r) => r.status === 'ABSENT').length,
        fieldWorkCount: records.filter((r) => r.status === 'FIELD_WORK').length,
        sickCount: records.filter((r) => r.status === 'SICK_LEAVE').length,
        dayOffCount: records.filter((r) => r.status === 'DAY_OFF').length,
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
    if (typeof (dbStore as any).initRemoteDb === 'function') {
      await (dbStore as any).initRemoteDb();
    }
    const body = await request.json();

    // Action 1: Set Day Type (Mark whole date as holiday, custom day off, or workday)
    if (body.action === 'setDayType' && body.date) {
      const isHoliday = body.isHolidayOrDayOff !== undefined ? Boolean(body.isHolidayOrDayOff) : true;
      const records = storeService.setDayTypeForDate(body.date, isHoliday, body.reason);
      return NextResponse.json({ success: true, count: records.length, records });
    }

    // Action 2: Bulk Save Records
    if (body.records && Array.isArray(body.records)) {
      const saved = storeService.bulkSaveTimesheet(body.records);
      return NextResponse.json({ success: true, count: saved.length, records: saved });
    }

    // Action 3: Save Single Record
    if (body.record) {
      const saved = storeService.saveTimesheetRecord(body.record);
      return NextResponse.json({ success: true, record: saved });
    }

    return NextResponse.json({ success: false, error: 'records, record yoki action kiritilishi shart' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
