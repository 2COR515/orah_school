// scripts/reminders.js
// Reminder logic: add, delete, persist to localStorage, and alert when due

// Helper: load reminders from localStorage
function loadReminders() {
  return JSON.parse(localStorage.getItem('reminders') || '[]');
}

// Helper: save reminders to localStorage
function saveReminders(reminders) {
  localStorage.setItem('reminders', JSON.stringify(reminders));
}

// Render reminders list
function renderReminders() {
  const list = document.getElementById('reminder-list');
  list.innerHTML = '';
  const reminders = loadReminders();
  reminders.forEach((rem, idx) => {
    const li = document.createElement('li');
    li.className = 'reminder-item';
    li.innerHTML = `
      <span class="reminder-text">${rem.text}</span>
      <span class="reminder-time">${new Date(rem.time).toLocaleString()}</span>
      <button class="delete-btn" data-idx="${idx}" title="Delete">&times;</button>
    `;
    list.appendChild(li);
  });
}

// Add reminder
document.getElementById('reminder-form').addEventListener('submit', e => {
  e.preventDefault();
  const text = document.getElementById('reminder-text').value.trim();
  const time = document.getElementById('reminder-datetime').value;
  if (!text || !time) return;
  const reminders = loadReminders();
  reminders.push({ text, time });
  saveReminders(reminders);
  renderReminders();
  e.target.reset();
  scheduleReminderAlert({ text, time });
});

// Delete reminder
document.getElementById('reminder-list').addEventListener('click', e => {
  if (e.target.classList.contains('delete-btn')) {
    const idx = +e.target.dataset.idx;
    const reminders = loadReminders();
    reminders.splice(idx, 1);
    saveReminders(reminders);
    renderReminders();
  }
});

// Schedule alert for due reminders (demo/prototype)
function scheduleReminderAlert(reminder) {
  const due = new Date(reminder.time).getTime();
  const now = Date.now();
  const delay = due - now;
  if (delay > 0 && delay < 2 * 60 * 60 * 1000) { // Only schedule if within 2 hours
    setTimeout(() => {
      alert(`Reminder: ${reminder.text}`);
    }, delay);
  }
}

// On load: render reminders and schedule alerts for upcoming ones
document.addEventListener('DOMContentLoaded', () => {
  renderReminders();
  // Schedule alerts for all reminders within 2 hours
  loadReminders().forEach(rem => {
    scheduleReminderAlert(rem);
  });
});
