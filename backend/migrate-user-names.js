#!/usr/bin/env node
/**
 * Migration script to ensure all users have a name field
 * Run this after updating db.js and scripts
 * 
 * Usage: node migrate-user-names.js
 */

const storage = require('node-persist');
const path = require('path');

async function migrateUserNames() {
  console.log('🔄 Starting user name migration...\n');

  // Initialize storage
  await storage.init({
    dir: path.join(__dirname, 'storage'),
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,
    ttl: false,
    forgiveParseErrors: false
  });

  try {
    // Get all users
    const users = await storage.getItem('users') || [];
    console.log(`📊 Found ${users.length} users in database\n`);

    let updated = 0;

    // Update each user to have a name field
    const updatedUsers = users.map((user, index) => {
      if (!user.name) {
        // Generate name from firstName/lastName if available
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const generatedName = `${firstName} ${lastName}`.trim() || user.email || user.userId;

        console.log(`✏️ User #${index + 1}: ${user.userId}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   First Name: "${firstName}"`);
        console.log(`   Last Name: "${lastName}"`);
        console.log(`   ✅ Generated Name: "${generatedName}"\n`);

        updated++;

        return {
          ...user,
          name: generatedName
        };
      } else {
        console.log(`✓ User #${index + 1}: ${user.userId} - already has name: "${user.name}"`);
        return user;
      }
    });

    // Save updated users back to storage
    await storage.setItem('users', updatedUsers);

    console.log(`\n✅ Migration complete!`);
    console.log(`📈 Updated ${updated} users with name fields`);
    console.log(`📊 Total users: ${updatedUsers.length}`);
    console.log(`\n✨ All users now have name fields!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateUserNames();
