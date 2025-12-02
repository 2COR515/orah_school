// create-admin-user.js - Creates an admin user for testing

const bcrypt = require('bcrypt');
const db = require('./db');

async function createAdminUser() {
    console.log('Creating admin user...');
    
    // Initialize database first
    await db.initDb();
    
    const adminEmail = 'admin@test.com';
    const adminPassword = 'admin123'; // Change this in production!
    
    try {
        // Check if admin already exists
        const users = await db.getAllUsers();
        const existingAdmin = users.find(u => u.email === adminEmail);
        
        if (existingAdmin) {
            console.log('✓ Admin user already exists:', adminEmail);
            console.log('  Role:', existingAdmin.role);
            return;
        }
        
        // Create new admin user
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const userId = Date.now() + Math.random().toString(36).substring(2, 9);
        
        const adminUser = {
            userId,
            role: 'admin',
            email: adminEmail,
            passwordHash,
            firstName: 'Admin',
            lastName: 'User',
            createdAt: Date.now()
        };
        
        // Add to database using saveUser
        await db.saveUser(adminUser);
        
        console.log('✓ Admin user created successfully!');
        console.log('  Email:', adminEmail);
        console.log('  Password:', adminPassword);
        console.log('  User ID:', userId);
        console.log('\n⚠️  Remember to change the password after first login!');
        
    } catch (error) {
        console.error('✗ Error creating admin user:', error.message);
        process.exit(1);
    }
}

// Run the script
createAdminUser()
    .then(() => {
        console.log('\nAdmin user setup complete!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Script failed:', err);
        process.exit(1);
    });
