const d = new Date();
document.getElementById('live-date').textContent =
  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
