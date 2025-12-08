// create-test-users.js - Creates test users for student and instructor

const bcrypt = require('bcrypt');
const db = require('./db');

async function createTestUsers() {
    console.log('Creating test users...\n');
    
    // Initialize database first
    await db.initDb();
    
    const testUsers = [
        {
            email: 'student@test.com',
            password: 'student123',
            role: 'student',
            firstName: 'Test',
            lastName: 'Student'
        },
        {
            email: 'instructor@test.com',
            password: 'instructor123',
            role: 'instructor',
            firstName: 'Test',
            lastName: 'Instructor'
        },
        {
            email: 'admin@test.com',
            password: 'admin123',
            role: 'admin',
            firstName: 'Test',
            lastName: 'Admin'
        }
    ];
    
    try {
        const users = await db.getAllUsers();
        
        for (const testUser of testUsers) {
            // Check if user already exists
            const existingUser = users.find(u => u.email === testUser.email);
            
            if (existingUser) {
                console.log(`✓ ${testUser.role} user already exists: ${testUser.email}`);
                continue;
            }
            
            // Create new user
            const passwordHash = await bcrypt.hash(testUser.password, 10);
            const userId = Date.now() + Math.random().toString(36).substring(2, 9);
            
            const newUser = {
                userId,
                role: testUser.role,
                email: testUser.email,
                passwordHash,
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                createdAt: Date.now()
            };
            
            // Add to database using saveUser
            await db.saveUser(newUser);
            
            console.log(`✓ ${testUser.role} user created successfully!`);
            console.log(`  Email: ${testUser.email}`);
            console.log(`  Password: ${testUser.password}`);
            console.log(`  User ID: ${userId}\n`);
        }
        
        console.log('✅ All test users ready!');
        console.log('\n📋 Test Credentials:');
        console.log('   Student:    student@test.com / student123');
        console.log('   Instructor: instructor@test.com / instructor123');
        console.log('   Admin:      admin@test.com / admin123');
        
    } catch (error) {
        console.error('✗ Error creating test users:', error.message);
        console.error(error);
    }
}

// Run the script
createTestUsers();
