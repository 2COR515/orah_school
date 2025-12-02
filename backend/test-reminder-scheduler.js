// test-reminder-scheduler.js - Testing the automated reminder service
const { runRemindersNow } = require('./reminderService');

async function testReminders() {
  console.log('🧪 Testing Reminder Scheduler\n');
  console.log('Running reminder processor manually...\n');
  await runRemindersNow();
  console.log('\n✅ Reminder test complete!');
}

testReminders();
