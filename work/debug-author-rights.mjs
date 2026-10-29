import '../src/config/load-env.js';
import { resolveWikisourceLicense } from '../src/services/book-import.service.js';
const get = async (title) => {
  const p = new URLSearchParams({ action: 'query', prop: 'categories|revisions', cllimit: 'max', rvprop: 'content', rvslots: 'main', titles: title, format: 'json', formatversion: '2' });
  const j = await (await fetch(`https://vi.wikisource.org/w/api.php?${p}`, { headers: { 'User-Agent': process.env.WIKISOURCE_USER_AGENT } })).json();
  return j.query.pages[0];
};
const p = await get('Tác gia:Tản Đà');
const text = p.revisions[0].slots.main.content;
const death = p.categories.map((c) => String(c.title).match(/^Thể loại:Mất\s+(\d{4})$/i)?.[1]).filter(Boolean).map(Number).sort((a,b)=>b-a)[0];
const end = text.search(/^==+\s*Tác phẩm dịch\s*==+\s*$/im);
const links = [...(end < 0 ? text : text.slice(0,end)).matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].map(m=>m[1]);
console.log(JSON.stringify({title:p.title,categories:p.categories.map(c=>c.title),license:resolveWikisourceLicense('',p.categories),death,end,hasPoem:links.includes('Thơ Tản Đà'),titleLinks:links.filter(x=>x.includes('Thơ Tản Đà'))}));
