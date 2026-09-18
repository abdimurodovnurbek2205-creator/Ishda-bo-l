import { dbStore } from './index.js';

console.log('🌱 Seeding database...');
console.log(`- Created ${dbStore.users.size} users`);
console.log(`- Created ${dbStore.employees.size} employees`);
console.log(`- Created ${dbStore.locations.length} initial locations`);
console.log(`- Created ${dbStore.workSessions.size} active work sessions`);
console.log(`- Created ${dbStore.geofences.size} geofences`);
console.log('✅ Seed completed successfully!');
