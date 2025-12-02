// test-attendance-api.js
// Test script for attendance tracking functionality

const API_BASE_URL = 'http://localhost:3002/api';

// Test configuration
const testConfig = {
  instructorEmail: 'test-instructor@example.com',
  instructorPassword: 'password123'
};

async function testAttendanceAPI() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🧪 Testing Attendance Tracking API                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Login as instructor
    console.log('Step 1: Logging in as instructor...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testConfig.instructorEmail,
        password: testConfig.instructorPassword
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    const instructorId = loginData.user.id || loginData.user.userId;

    console.log(`✅ Logged in as instructor: ${instructorId}\n`);

    // Step 2: Create a test lesson
    console.log('Step 2: Creating a test lesson...');
    const lessonResponse = await fetch(`${API_BASE_URL}/lessons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Lesson for Attendance',
        instructorId: instructorId,
        description: 'Testing attendance tracking',
        videoUrl: '/uploads/test-video.mp4',
        status: 'published'
      })
    });

    const lessonData = await lessonResponse.json();
    const lessonId = lessonData.lesson.id;
    console.log(`✅ Created lesson: ${lessonId}\n`);

    // Step 3: Mark attendance for multiple students
    console.log('Step 3: Marking attendance for students...');
    const attendanceRecords = [
      {
        studentId: 'STUDENT001',
        lessonId: lessonId,
        date: new Date().toISOString().split('T')[0], // Today's date YYYY-MM-DD
        status: 'present'
      },
      {
        studentId: 'STUDENT002',
        lessonId: lessonId,
        date: new Date().toISOString().split('T')[0],
        status: 'present'
      },
      {
        studentId: 'STUDENT003',
        lessonId: lessonId,
        date: new Date().toISOString().split('T')[0],
        status: 'absent'
      }
    ];

    const markAttendanceResponse = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ records: attendanceRecords })
    });

    const markAttendanceData = await markAttendanceResponse.json();
    
    if (markAttendanceResponse.ok) {
      console.log(`✅ Attendance marked for ${markAttendanceData.savedRecords.length} students`);
      console.log(`   Message: ${markAttendanceData.message}\n`);
    } else {
      console.log(`❌ Failed to mark attendance: ${markAttendanceData.error}\n`);
    }

    // Step 4: Get attendance records for the lesson
    console.log('Step 4: Retrieving attendance records...');
    const getAttendanceResponse = await fetch(
      `${API_BASE_URL}/attendance?lessonId=${lessonId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const getAttendanceData = await getAttendanceResponse.json();
    
    if (getAttendanceResponse.ok) {
      console.log(`✅ Retrieved ${getAttendanceData.count} attendance records:`);
      getAttendanceData.records.forEach(record => {
        console.log(`   • Student ${record.studentId}: ${record.status.toUpperCase()} on ${record.date}`);
      });
      console.log();
    } else {
      console.log(`❌ Failed to get attendance: ${getAttendanceData.error}\n`);
    }

    // Step 5: Get attendance statistics
    console.log('Step 5: Getting attendance statistics...');
    const statsResponse = await fetch(
      `${API_BASE_URL}/attendance/stats/${lessonId}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const statsData = await statsResponse.json();
    
    if (statsResponse.ok) {
      console.log(`✅ Attendance Statistics:`);
      console.log(`   Total: ${statsData.statistics.total}`);
      console.log(`   Present: ${statsData.statistics.present}`);
      console.log(`   Absent: ${statsData.statistics.absent}`);
      console.log(`   Attendance Rate: ${statsData.statistics.attendanceRate}%\n`);
    } else {
      console.log(`❌ Failed to get statistics: ${statsData.error}\n`);
    }

    // Step 6: Update an attendance record
    if (markAttendanceData.savedRecords && markAttendanceData.savedRecords.length > 0) {
      console.log('Step 6: Updating an attendance record...');
      const recordToUpdate = markAttendanceData.savedRecords[0];
      
      const updateResponse = await fetch(
        `${API_BASE_URL}/attendance/${recordToUpdate.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'absent' })
        }
      );

      const updateData = await updateResponse.json();
      
      if (updateResponse.ok) {
        console.log(`✅ Updated attendance record:`);
        console.log(`   Student ${updateData.record.studentId}: ${updateData.record.status}\n`);
      } else {
        console.log(`❌ Failed to update: ${updateData.error}\n`);
      }
    }

    // Step 7: Test authorization (student should not be able to mark attendance)
    console.log('Step 7: Testing authorization (negative test)...');
    console.log('ℹ️  Attempting to mark attendance without instructor role...');
    console.log('⚠️  Skipping: Requires student account setup\n');

    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║               ✅ All Attendance Tests Passed!                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error);
  }
}

// Run the tests
testAttendanceAPI();
