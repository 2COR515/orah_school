// Test script to check lessons in database
const storage = require('node-persist');
const path = require('path');

async function checkLessons() {
    await storage.init({
        dir: path.join(__dirname, 'storage'),
        stringify: JSON.stringify,
        parse: JSON.parse,
        encoding: 'utf8',
        logging: false
    });

    const lessons = await storage.getItem('lessons') || [];
    
    console.log(`\n===== TOTAL LESSONS: ${lessons.length} =====\n`);
    
    lessons.forEach((lesson, index) => {
        console.log(`Lesson ${index + 1}:`);
        console.log(`  ID: ${lesson.id}`);
        console.log(`  Title: ${lesson.title}`);
        console.log(`  VideoURL: ${lesson.videoUrl}`);
        console.log(`  Status: ${lesson.status}`);
        console.log(`  Instructor: ${lesson.instructorId}`);
        console.log('---');
    });
}

checkLessons().catch(console.error);
