import { describe, it, expect } from 'vitest';
import { detectUzbekistanDistrict } from '../apps/web/lib/uzbekistan-geocoder.js';

describe('Uzbekistan District Detection', () => {
  it('should detect Bandixon District, Surxondaryo Region correctly from GPS coordinates', () => {
    // Bandixon District Center coordinates: 37.5255, 67.2458
    const result = detectUzbekistanDistrict(37.5255, 67.2458);
    expect(result.region).toBe('Surxondaryo viloyati');
    expect(result.district).toBe('Bandixon tumani');
  });

  it('should detect Qumqo‘rg‘on District when employee moves there', () => {
    // Qumqo'rg'on coordinates: 37.4950, 67.4100
    const result = detectUzbekistanDistrict(37.4950, 67.4100);
    expect(result.region).toBe('Surxondaryo viloyati');
    expect(result.district).toBe('Qumqo‘rg‘on tumani');
  });

  it('should detect Termiz City when employee enters Termiz', () => {
    // Termiz City coordinates: 37.2242, 67.2783
    const result = detectUzbekistanDistrict(37.2242, 67.2783);
    expect(result.region).toBe('Surxondaryo viloyati');
    expect(result.district).toBe('Termiz shahri');
  });

  it('should detect Sherobod District when employee moves to Sherobod', () => {
    // Sherobod coordinates: 37.3750, 66.9200
    const result = detectUzbekistanDistrict(37.3750, 66.9200);
    expect(result.region).toBe('Surxondaryo viloyati');
    expect(result.district).toBe('Sherobod tumani');
  });

  it('should detect Tashkent City when employee travels to capital', () => {
    // Yunusabad, Tashkent: 41.3650, 69.2850
    const result = detectUzbekistanDistrict(41.3650, 69.2850);
    expect(result.region).toBe('Toshkent shahri');
    expect(result.district).toBe('Yunusobod tumani');
  });
});
