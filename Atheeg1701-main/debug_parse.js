const fs = require('fs');
const path = 'public/atheeg-test.html';
const html = fs.readFileSync(path, 'utf8');
const start = html.indexOf('<script>');
const end = html.indexOf('</script>', start);
if (start === -1 || end === -1) {
  console.log('script tags not found');
  process.exit(1);
}
const script = html.slice(start + 8, end);
console.log('script length:', script.length);
try {
  new Function(script);
  console.log('parse ok');
} catch (e) {
  console.log('error:', e && e.message);
  console.log('stack:', e && e.stack);
}
