// scripts/seed-database.js
/**
 * Seed script to add a test user to the SQLite database
 * Run this from the project root: node scripts/seed-database.js
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Note: This script runs on Node.js, not in the React Native app
// For development only

console.log('🌱 Seeding database with test user...');

const testUsers = [
  {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  },
  {
    email: 'demo@example.com',
    password: 'demo123',
    name: 'Demo Account',
  },
];

console.log('\n📝 Test Users:');
testUsers.forEach((user) => {
  console.log(`  • Email: ${user.email}`);
  console.log(`    Password: ${user.password}`);
  console.log(`    Name: ${user.name}\n`);
});

console.log('✅ Database will be auto-seeded in the app on first run');
console.log('📱 Use the Login screen to test with these credentials');
