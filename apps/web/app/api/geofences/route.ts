import { NextResponse } from 'next/server';
import { dbStore } from '@repo/database';
import { Geofence } from '@repo/types';

export async function GET() {
  const gfList = Array.from(dbStore.geofences.values());
  return NextResponse.json(gfList);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, latitude, longitude, radius } = body;

    if (!name || latitude === undefined || longitude === undefined || !radius) {
      return NextResponse.json({ error: 'Nomi, koordinata va radius talab qilinadi' }, { status: 400 });
    }

    const gfId = `gf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newGf: Geofence = {
      id: gfId,
      name,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: Number(radius),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    dbStore.geofences.set(gfId, newGf);
    return NextResponse.json(newGf, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Geozona yaratishda xatolik' }, { status: 500 });
  }
}
