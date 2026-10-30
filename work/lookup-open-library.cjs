const fs = require('node:fs/promises');
const path = require('node:path');
const root = 'D:/DNTU/HK1_Nam4_2026/Web_API/LibraryManage';
const books = JSON.parse(await fs.readFile(path.join(root,'work/book-cover-targets.json'),'utf8'));
const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const tokens = s => norm(s).split(' ').filter(x => x.length > 2 && !['the','and','for','from','with','into','volume','vol'].includes(x));
const overlap = (a,b) => { const A = new Set(tokens(a)), B = new Set(tokens(b)); if(!A.size || !B.size)return 0; let n=0; for(const x of A)if(B.has(x))n++; return {a:n/A.size,b:n/B.size,n}; };
const result = [];
for(let i=0;i<books.length;i++){
 const book=books[i];
 if(book.key && book.source){result.push({id:book.id,title:book.title,author:book.author,already:true});continue;}
 try{
  const u = new URL('https://openlibrary.org/search.json');
  u.search = new URLSearchParams({title:book.title,author:book.author,fields:'key,title,author_name,cover_i,edition_count,first_publish_year',limit:'8'}).toString();
  const res=await fetch(u,{headers:{'User-Agent':'HarveyBookCoverAudit/1.0 (book catalog lookup)'},signal:AbortSignal.timeout(20000)});
  if(res.status===429){console.log('rate limit; wait');await new Promise(r=>setTimeout(r,5000));i--;continue;}
  if(!res.ok)throw new Error('HTTP '+res.status);
  const data=await res.json();
  const matches=(data.docs||[]).map(d=>{
   const t=overlap(book.title,d.title),a=overlap(book.author,(d.author_name||[]).join(' '));
   const titleScore=(t.a+t.b)/2, authorScore=(a.a+a.b)/2;
   return {title:d.title,authors:d.author_name||[],coverId:d.cover_i||null,editionCount:d.edition_count||0,year:d.first_publish_year||null,titleScore,authorScore,score:titleScore*0.65+authorScore*0.35,work:d.key};
  }).filter(x=>x.coverId && x.titleScore>=0.72 && x.authorScore>=0.34).sort((a,b)=>b.score-a.score);
  if(matches.length)result.push({id:book.id,title:book.title,author:book.author,candidate:matches[0],alternates:matches.slice(1,3)});
  if((i+1)%10===0)console.log(JSON.stringify({checked:i+1,total:books.length,matched:result.filter(x=>x.candidate).length}));
 }catch(e){result.push({id:book.id,title:book.title,author:book.author,error:String(e.message||e)});}
 await new Promise(r=>setTimeout(r,1100));
}
await fs.writeFile(path.join(root,'work/openlibrary-cover-candidates.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({event:'lookup-complete',books:books.length,matches:result.filter(x=>x.candidate).length,already:result.filter(x=>x.already).length,errors:result.filter(x=>x.error).length}));
