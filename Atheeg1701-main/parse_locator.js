const fs = require('fs');
const html = fs.readFileSync('public/atheeg-test.html', 'utf8');
const start = html.indexOf('<script>');
const end = html.indexOf('</script>', start);
if (start === -1 || end === -1) {
  console.error('script tags not found');
  process.exit(1);
}
const script = html.slice(start + 8, end);
console.log('script length', script.length);
let lastOk = 0;
for (let i = 1; i <= script.length; i++) {
  const snippet = script.slice(0, i);
  try {
    new Function(snippet);
    lastOk = i;
  } catch (e) {
    console.log('first fail at index', i, 'error:', e.message);
    console.log('last ok index', lastOk);
    const startSlice = Math.max(0, lastOk - 200);
    const endSlice = Math.min(script.length, i + 200);
    console.log('context before failure:\n' + snippet.slice(startSlice, endSlice));
    process.exit(0);
  }
}
console.log('no failure found in full script');
