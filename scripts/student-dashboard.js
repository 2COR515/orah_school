// scripts/student-dashboard.js
// Handles sidebar nav highlight and floating chat button for student dashboard

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar nav highlight
  document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.addEventListener('click', e => {
      document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      e.preventDefault();
    });
  });

  // Floating chat button click: open chatbot or redirect
  document.getElementById('student-chatbot-btn').addEventListener('click', () => {
    // For demo: redirect or open widget
    alert('Student chatbot coming soon!');
    // window.location.href = 'chatbot.html'; // Example redirect
  });
});