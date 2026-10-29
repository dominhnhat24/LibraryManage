import { createHash } from 'node:crypto';
const getText = async (id) => {
 const response=await fetch(`https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 const raw=await response.text();const start=raw.search(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);const end=raw.search(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
 const body=raw.slice(start,end).replace(/^.*?\*\*\*\s*\n/i,'').toLowerCase().replace(/\s+/g,' ').trim();
 return {id,length:body.length,hash:createHash('sha256').update(body).digest('hex'),body};
};
const [a,b]=await Promise.all([getText('368'),getText('34258')]);let common=0;let n=Math.min(a.body.length,b.body.length);for(let i=0;i<n;i++)if(a.body[i]===b.body[i])common++;
console.log(JSON.stringify({a:{id:a.id,length:a.length,hash:a.hash},b:{id:b.id,length:b.length,hash:b.hash},commonPrefix:common,minLength:n,similarity:common/n}));
