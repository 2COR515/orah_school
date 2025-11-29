// Quick test to verify videoUrl and quiz are now being saved
const db = require('./db');

async function testVideoUrlStorage() {
  console.log('\n🧪 Testing videoUrl Storage Fix...\n');
  
  await db.initDb();
  
  // Create a test lesson with videoUrl and quiz
  const testLesson = {
    instructorId: 'TEST-INSTRUCTOR',
    title: 'Test Video Storage',
    description: 'Testing if videoUrl and quiz are saved',
    topic: 'Testing',
    status: 'draft',
    videoUrl: '/uploads/test-video.mp4',
    quiz: [
      {
        question: 'Test question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 0
      }
    ],
    files: [],
    durationMinutes: 10
  };
  
  console.log('📝 Creating test lesson with:');
  console.log('   videoUrl:', testLesson.videoUrl);
  console.log('   quiz:', testLesson.quiz.length, 'questions');
  
  const created = await db.addLesson(testLesson);
  
  console.log('\n✅ Lesson created with ID:', created.id);
  console.log('\n📊 Stored lesson data:');
  console.log('   videoUrl:', created.videoUrl || '❌ MISSING');
  console.log('   quiz:', created.quiz ? `✅ ${created.quiz.length} questions` : '❌ MISSING');
  
  // Retrieve it to double-check
  const retrieved = await db.getLesson(created.id);
  
  console.log('\n🔍 Retrieved lesson data:');
  console.log('   videoUrl:', retrieved.videoUrl || '❌ MISSING');
  console.log('   quiz:', retrieved.quiz ? `✅ ${retrieved.quiz.length} questions` : '❌ MISSING');
  
  if (retrieved.videoUrl && retrieved.quiz) {
    console.log('\n✅ ✅ ✅ FIX VERIFIED! videoUrl and quiz are being saved! ✅ ✅ ✅\n');
  } else {
    console.log('\n❌ ❌ ❌ FIX FAILED! Data is still not being saved! ❌ ❌ ❌\n');
  }
  
  // Clean up test lesson
  await db.deleteLesson(created.id);
  console.log('🧹 Test lesson cleaned up\n');
}

testVideoUrlStorage().catch(console.error);
