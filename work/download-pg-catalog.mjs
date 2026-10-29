import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
const url = 'https://www.gutenberg.org/cache/epub/feeds/pg_catalog.csv.gz';
const response = await fetch(url, { signal: AbortSignal.timeout(180000), headers: { 'User-Agent': 'HarveyLibraryImport/1.0 (public-domain source audit)' } });
if (!response.ok || !response.body) throw new Error(`Project Gutenberg catalog HTTP ${response.status}`);
await pipeline(response.body, createWriteStream('work/pg_catalog.csv.gz'));
console.log('Downloaded official catalog feed');
