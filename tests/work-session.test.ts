import { describe, it, expect } from 'vitest';
import { storeService } from '../apps/web/lib/store.js';

describe('Work Session Lifecycle & Location Ingestion', () => {
  it('should start a work session for an employee', () => {
    const session = storeService.startWorkSession('emp-admin-1', 37.5255, 67.2458);
    expect(session).toBeDefined();
    expect(session.employeeId).toBe('emp-admin-1');
    expect(session.status).toBe('ACTIVE');
    expect(session.startLatitude).toBe(37.5255);
  });

  it('should retrieve active work session for employee', () => {
    const active = storeService.getActiveWorkSession('emp-admin-1');
    expect(active).toBeDefined();
    expect(active?.status).toBe('ACTIVE');
  });

  it('should end work session and update status to COMPLETED', () => {
    const closed = storeService.endWorkSession('emp-admin-1', 37.2242, 67.2783);
    expect(closed).toBeDefined();
    expect(closed?.status).toBe('COMPLETED');
    expect(closed?.endLatitude).toBe(37.2242);
  });

  it('should ingest location point and update employee district', () => {
    const result = storeService.addLocation({
      employeeId: 'emp-admin-1',
      latitude: 37.2242,
      longitude: 67.2783,
      accuracy: 5.0,
      timestamp: new Date().toISOString(),
    });

    expect(result.location).toBeDefined();
    expect(result.location.district).toBe('Termiz shahri');
    expect(result.location.region).toBe('Surxondaryo viloyati');
  });
});
