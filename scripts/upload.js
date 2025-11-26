// scripts/upload.js
// Minimal upload form logic and history panel

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('upload-form');
  const historyList = document.getElementById('history-list');

  // message area
  const msg = document.createElement('div');
  msg.id = 'upload-msg';
  msg.style.margin = '0.75rem 0';
  form.parentNode.insertBefore(msg, form.nextSibling);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.textContent = '';

    const fd = new FormData();
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const topic = form.topic.value;
    const fileInput = form.querySelector('input[name="uploaded_file"]');
    const file = fileInput && fileInput.files[0];
    if (!file) {
      msg.textContent = 'Please choose a file.';
      msg.style.color = 'red';
      return;
    }
    fd.append('uploaded_file', file);
    fd.append('title', title);
    fd.append('description', description);
    fd.append('topic', topic);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const ct = res.headers.get('content-type') || '';
      let data;
      if (ct.includes('application/json')) data = await res.json();
      else data = { ok: false, error: await res.text() };

      if (data.ok) {
        msg.textContent = 'Upload successful';
        msg.style.color = 'green';
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = data.file.url;
        a.target = '_blank';
        a.textContent = title || data.file.originalname;
        li.appendChild(a);
        li.append(' — ' + (data.file.mimetype || 'file'));
        historyList.prepend(li);
        form.reset();
      } else {
        msg.textContent = data.error || 'Upload failed';
        msg.style.color = 'red';
      }
    } catch (err) {
      msg.textContent = 'Upload error: ' + err.message;
      msg.style.color = 'red';
    }
  });
});
