import '../src/config/load-env.js';
import { searchWikisourceBooks } from '../src/services/book-import.service.js';

const terms = process.argv.slice(2);
for (const query of terms) {
  try {
    const result = await searchWikisourceBooks(query, { minimumCharacters: 5000 });
    console.log(JSON.stringify({ query, eligible: result.candidates.map(({ id, title, author, contentCharacters, license, sourceUrl }) => ({ id, title, author, contentCharacters, license, sourceUrl })), excluded: result.excludedCandidates.map(({ id, title, author, contentCharacters, reasons }) => ({ id, title, author, contentCharacters, reasons })) }));
  } catch (error) { console.log(JSON.stringify({ query, error: error.message })); }
}
