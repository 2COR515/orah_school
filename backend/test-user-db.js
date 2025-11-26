// test-user-db.js - Test script for user database functions
const { initDb, findUserByEmail, saveUser } = require('./db');
const bcrypt = require('bcrypt');

async function testUserFunctions() {
  console.log('=== Testing User Database Functions ===\n');

  try {
    // Initialize database
    await initDb();
    console.log('✓ Database initialized');

    // Test 1: Save a new user
    console.log('\n--- Test 1: Save a new student user ---');
    const passwordHash = await bcrypt.hash('password123', 10);
    const studentUser = {
      email: 'student@test.com',
      passwordHash: passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'student'
    };

    const savedStudent = await saveUser(studentUser);
    console.log('✓ Student user saved:', {
      userId: savedStudent.userId,
      email: savedStudent.email,
      role: savedStudent.role,
      name: `${savedStudent.firstName} ${savedStudent.lastName}`
    });

    // Test 2: Save an instructor user
    console.log('\n--- Test 2: Save an instructor user ---');
    const instructorPasswordHash = await bcrypt.hash('instructor123', 10);
    const instructorUser = {
      email: 'instructor@test.com',
      passwordHash: instructorPasswordHash,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'instructor'
    };

    const savedInstructor = await saveUser(instructorUser);
    console.log('✓ Instructor user saved:', {
      userId: savedInstructor.userId,
      email: savedInstructor.email,
      role: savedInstructor.role,
      name: `${savedInstructor.firstName} ${savedInstructor.lastName}`
    });

    // Test 3: Find user by email
    console.log('\n--- Test 3: Find user by email ---');
    const foundStudent = await findUserByEmail('student@test.com');
    if (foundStudent && foundStudent.email === 'student@test.com') {
      console.log('✓ Found student user:', {
        userId: foundStudent.userId,
        email: foundStudent.email,
        role: foundStudent.role
      });
    } else {
      console.error('✗ Failed to find student user');
    }

    // Test 4: Verify password hashing works
    console.log('\n--- Test 4: Verify password hashing ---');
    const isPasswordCorrect = await bcrypt.compare('password123', foundStudent.passwordHash);
    if (isPasswordCorrect) {
      console.log('✓ Password verification successful');
    } else {
      console.error('✗ Password verification failed');
    }

    // Test 5: Try to save duplicate user (should fail)
    console.log('\n--- Test 5: Try to save duplicate user ---');
    try {
      await saveUser({
        email: 'student@test.com',
        passwordHash: passwordHash,
        firstName: 'Duplicate',
        lastName: 'User'
      });
      console.error('✗ Should have thrown error for duplicate email');
    } catch (error) {
      console.log('✓ Correctly prevented duplicate user:', error.message);
    }

    // Test 6: Default role assignment
    console.log('\n--- Test 6: Default role assignment ---');
    const userWithoutRole = {
      email: 'norole@test.com',
      passwordHash: await bcrypt.hash('test123', 10),
      firstName: 'No',
      lastName: 'Role'
    };

    const savedUserWithDefaultRole = await saveUser(userWithoutRole);
    if (savedUserWithDefaultRole.role === 'student') {
      console.log('✓ Default role "student" assigned correctly');
    } else {
      console.error('✗ Default role not assigned correctly:', savedUserWithDefaultRole.role);
    }

    console.log('\n=== All Tests Completed Successfully! ===');

  } catch (error) {
    console.error('\n✗ Test failed with error:', error.message);
    console.error(error);
  }
}

// Run tests
testUserFunctions();
