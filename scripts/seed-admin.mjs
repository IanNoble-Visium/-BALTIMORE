#!/usr/bin/env node
/**
 * Seed admin user: admin@visium.com / Baltimore2025
 * This script creates the admin user in the database
 */

import { drizzle } from 'drizzle-orm/mysql2';
import { users } from '../drizzle/schema.ts';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

async function seedAdmin() {
  console.log('Seeding admin user...');
  
  try {
    // Create admin user with specific credentials
    // Note: In Manus OAuth system, the actual authentication happens via OAuth
    // This is just for display/reference purposes
    await db.insert(users).values({
      openId: 'admin-baltimore-2025',
      name: 'Baltimore Admin',
      email: 'admin@visium.com',
      role: 'admin',
      loginMethod: 'oauth',
    }).onDuplicateKeyUpdate({
      set: {
        name: 'Baltimore Admin',
        email: 'admin@visium.com',
        role: 'admin',
      }
    });
    
    console.log('✓ Admin user created successfully');
    console.log('  Email: admin@visium.com');
    console.log('  Role: admin');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedAdmin();
