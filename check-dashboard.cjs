const fs = require('fs');
const content = fs.readFileSync('client/src/pages/dashboard.tsx', 'utf8');
if (!content.includes('export default function Dashboard')) {
  console.log('TRUNCATED');
} else {
  console.log('OK');
}
