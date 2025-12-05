// test-reminder-frequency.js - Test the new reminder frequency system
require('dotenv').config();
const { shouldSendReminder, processReminders, runRemindersNow } = require('./reminderService');

console.log('═══════════════════════════════════════════════════════════');
console.log('🧪 Testing Reminder Frequency System');
console.log('═══════════════════════════════════════════════════════════\n');

// Test 1: shouldSendReminder function
console.log('📅 Test 1: shouldSendReminder() function');
console.log('Current day:', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]);
console.log('-----------------------------------------------------------');

const frequencies = ['daily', 'weekly', 'twice-weekly'];
frequencies.forEach(freq => {
  const shouldSend = shouldSendReminder(freq);
  console.log(`${freq.padEnd(15)} → ${shouldSend ? '✅ SEND' : '❌ SKIP'}`);
});

console.log('\n📧 Test 2: Email Configuration Check');
console.log('-----------------------------------------------------------');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('\n⚠️  Warning: Email credentials not configured!');
  console.log('📝 To fix:');
  console.log('   1. Create a .env file in the backend directory');
  console.log('   2. Add: EMAIL_USER=your-email@gmail.com');
  console.log('   3. Add: EMAIL_PASS=your-app-password');
  console.log('   4. For Gmail app passwords: https://myaccount.google.com/apppasswords');
}

console.log('\n🔧 Test 3: Function Availability Check');
console.log('-----------------------------------------------------------');
console.log('shouldSendReminder:', typeof shouldSendReminder === 'function' ? '✅' : '❌');
console.log('processReminders:', typeof processReminders === 'function' ? '✅' : '❌');
console.log('runRemindersNow:', typeof runRemindersNow === 'function' ? '✅' : '❌');

console.log('\n📊 Test 4: Weekly Schedule Matrix');
console.log('-----------------------------------------------------------');
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const scheduleMatrix = {
  daily: [true, true, true, true, true, true, true],
  weekly: [false, true, false, false, false, false, false],
  'twice-weekly': [false, true, false, false, true, false, false]
};

console.log('Frequency      | ' + days.join(' | '));
console.log('---------------|' + '-----+'.repeat(7));

Object.keys(scheduleMatrix).forEach(freq => {
  const row = scheduleMatrix[freq].map(send => send ? ' ✅ ' : ' ❌ ').join(' | ');
  console.log(`${freq.padEnd(15)}| ${row}`);
});

console.log('\n💡 To run actual reminders manually:');
console.log('   node -e "require(\'./reminderService\').runRemindersNow()"');

console.log('\n✅ Reminder frequency system tests complete!');
console.log('═══════════════════════════════════════════════════════════\n');

// Export shouldSendReminder for testing purposes
module.exports = { shouldSendReminder };
