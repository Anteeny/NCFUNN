const fs = require('fs');

function testHtml(filePath) {
  console.log(`Testing ${filePath}...`);
  const html = fs.readFileSync(filePath, 'utf8');
  const scripts = html.match(/<script[\s\S]*?<\/script>/gi) || [];
  let errors = 0;
  scripts.forEach((s, idx) => {
    if (!s.includes('src=')) {
      const code = s.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        new Function(code);
        console.log(`  Script block ${idx + 1}: Valid syntax`);
      } catch (err) {
        console.error(`  Script block ${idx + 1} Error:`, err.message);
        errors++;
      }
    }
  });
  if (errors === 0) console.log(`✓ All scripts in ${filePath} passed syntax verification.`);
}

testHtml('Attendance/tracker.html');
testHtml('Website/index.html');
