import { describe, it, expect } from 'vitest';
import { isPointInsideGeofence, checkGeofenceTransitions } from '../apps/web/lib/geofence.js';
import { Geofence } from '@repo/types';

describe('Geofence Containment & Event Transition Logic', () => {
  const mockGeofence: Geofence = {
    id: 'gf-bandixon-hokimiyat',
    name: 'Bandixon Tuman Hokimligi',
    latitude: 37.5255,
    longitude: 67.2458,
    radius: 500, // 500 meters
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  it('should detect point inside 500m geofence radius', () => {
    // Exactly at hokimiyat center
    const inside = isPointInsideGeofence(37.5255, 67.2458, 37.5255, 67.2458, 500);
    expect(inside).toBe(true);
  });

  it('should detect point outside geofence radius', () => {
    // 5 km away in Bandixon outskirts
    const inside = isPointInsideGeofence(37.5600, 67.3000, 37.5255, 67.2458, 500);
    expect(inside).toBe(false);
  });

  it('should trigger ENTER event when employee steps into geofence', () => {
    const prevLocation = { latitude: 37.5600, longitude: 67.3000 }; // outside
    const newLat = 37.5255;
    const newLng = 67.2458; // inside

    const events = checkGeofenceTransitions(
      'emp-1',
      'Ali Valiyev',
      newLat,
      newLng,
      [mockGeofence],
      prevLocation
    );

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('ENTER');
    expect(events[0].geofenceName).toBe('Bandixon Tuman Hokimligi');
  });

  it('should trigger EXIT event when employee leaves geofence', () => {
    const prevLocation = { latitude: 37.5255, longitude: 67.2458 }; // inside
    const newLat = 37.5600;
    const newLng = 67.3000; // outside

    const events = checkGeofenceTransitions(
      'emp-1',
      'Ali Valiyev',
      newLat,
      newLng,
      [mockGeofence],
      prevLocation
    );

    expect(events.length).toBe(1);
    expect(events[0].type).toBe('EXIT');
  });
});
