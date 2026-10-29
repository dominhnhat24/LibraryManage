import '../src/config/load-env.js';

const categories = [
  'Thơ Việt Nam', 'Văn học dân gian Việt Nam', 'Truyện ngắn Việt Nam',
  'Tiểu thuyết Việt Nam', 'Truyện dài Việt Nam', 'Truyện Nôm',
  'Ca dao Việt Nam', 'Truyện cười Việt Nam', 'Vè', 'Tập thơ', 'PVCC-Việt Nam'
];
const headers = { 'User-Agent': process.env.WIKISOURCE_USER_AGENT };
const results = [];
for (const category of categories) {
  const pages = [], subcategories = [];
  let continuation;
  do {
    const params = new URLSearchParams({ action: 'query', list: 'categorymembers', cmtitle: `Thể loại:${category}`,
      cmtype: 'page|subcat', cmlimit: '200', format: 'json', formatversion: '2' });
    if (continuation) params.set('cmcontinue', continuation);
    let response;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      response = await fetch(`https://vi.wikisource.org/w/api.php?${params}`, { headers, signal: AbortSignal.timeout(30000) });
      if (response.status !== 429 && response.status !== 503) break;
      const retryAfterSeconds = Number(response.headers.get('retry-after')) || 0;
      const backoffMs = Math.min(60000, retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : (5000 * (2 ** attempt)));
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} reading ${category}`);
    const json = await response.json();
    for (const member of json.query?.categorymembers || []) {
      if (member.ns === 0) pages.push(member.title);
      else if (member.ns === 14) subcategories.push(member.title);
    }
    continuation = json.continue?.cmcontinue;
  } while (continuation);
  results.push({ category, pages, subcategories });
  await new Promise((resolve) => setTimeout(resolve, 3000));
}
console.log(JSON.stringify(results, null, 2));
