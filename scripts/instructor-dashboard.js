// scripts/instructor-dashboard.js
// Minimal JS for instructor dashboard navigation and chatbot

document.addEventListener('DOMContentLoaded', () => {
  const navBtns = document.querySelectorAll('.nav-btn');
  const panels = {
    attendance: document.getElementById('attendance-panel'),
    upload: document.getElementById('upload-panel'),
    analytics: document.getElementById('analytics-panel')
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Simple panel highlight (expand as needed)
      Object.values(panels).forEach(panel => panel.classList.remove('active'));
      if (btn.id === 'attendance-btn') panels.attendance.classList.add('active');
      if (btn.id === 'upload-btn') panels.upload.classList.add('active');
      if (btn.id === 'analytics-btn') panels.analytics.classList.add('active');
    });
  });

  // Floating chatbot button (expand to open modal/chat)
  document.querySelector('.chatbot-btn').addEventListener('click', () => {
    alert('Chatbot coming soon!');
  });
});
