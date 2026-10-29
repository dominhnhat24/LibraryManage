import fs from 'node:fs';
import zlib from 'node:zlib';

const text = zlib.gunzipSync(fs.readFileSync('work/pg_catalog.csv.gz')).toString('utf8');
const rows = [];
let row = [], field = '', quoted = false;
for (let i = 0; i < text.length; i += 1) {
  const char = text[i];
  if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
  else if (char === '"') quoted = !quoted;
  else if (!quoted && char === ',') { row.push(field); field = ''; }
  else if (!quoted && (char === '\n' || char === '\r')) {
    if (char === '\r' && text[i + 1] === '\n') i += 1;
    row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = '';
  } else field += char;
}
const [headers, ...data] = rows;
const regex = /success|habit|happiness|character|achievement|prosperity|efficiency|self[- ]?culture|self[- ]?development|self[- ]?improvement|thought|concentration|ambition|purpose|strive|conduct|perseverance|living|life lessons/i;
const candidates = data.map((values) => Object.fromEntries(headers.map((key, i) => [key, values[i] || ''])))
  .filter((book) => regex.test(book.Title) && !/(fiction|novels|romance|story|stories|adventure)/i.test(`${book.Bookshelves};${book.Subjects}`))
  .map(({ ID, Title, Authors, Bookshelves, Subjects }) => ({ ID, Title, Authors, Bookshelves, Subjects }));
console.log(JSON.stringify(candidates.filter((book) => /Category: How To|Conduct of life|Success|Attention/i.test(`${book.Bookshelves};${book.Subjects}`)), null, 2));
