// Imports public-domain Project Gutenberg texts only after checking RDF title,
// author, author death date, full-text boundaries, and existing source/title keys.
import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import User from '../src/models/user.model.js';

const root = 'https://www.gutenberg.org';
const targets = [
  ['kinh_doanh',3300],['kinh_doanh',6435],['kinh_doanh',7213],['kinh_doanh',16256],['kinh_doanh',60692],['kinh_doanh',833],
  ['phat_trien_ban_than',21291],['phat_trien_ban_than',20513],['phat_trien_ban_than',13160],['phat_trien_ban_than',2274],['phat_trien_ban_than',59844],['phat_trien_ban_than',148],
  ['tam_ly_hoc',57628],['tam_ly_hoc',57634],['tam_ly_hoc',55262],['tam_ly_hoc',445],['tam_ly_hoc',48869],['tam_ly_hoc',20220],['tam_ly_hoc',1227],
  ['lich_su',7142],['lich_su',1468],['lich_su',2439],
  ['khoa_hoc',944],['khoa_hoc',14474],['khoa_hoc',2355],['khoa_hoc',27378],['khoa_hoc',28247],['khoa_hoc',30155],
  ['van_hoc_the_gioi',1342],['van_hoc_the_gioi',2701],['van_hoc_the_gioi',84],['van_hoc_the_gioi',1661],['van_hoc_the_gioi',98],
  ['van_hoc_the_gioi',2600],['van_hoc_the_gioi',1400],['van_hoc_the_gioi',1260],['van_hoc_the_gioi',768],['van_hoc_the_gioi',174],
  ['van_hoc_the_gioi',28054],['van_hoc_the_gioi',145],['van_hoc_the_gioi',5200],['van_hoc_the_gioi',64317],['van_hoc_the_gioi',1184],
  ['van_hoc_the_gioi',1727],['van_hoc_the_gioi',120],['van_hoc_the_gioi',36],['van_hoc_the_gioi',11],['van_hoc_the_gioi',1257],
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const decode = (s='') => String(s).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const getText = async (url) => { const r=await fetch(url,{headers:{'User-Agent':process.env.WIKISOURCE_USER_AGENT||'HarveyLibrary/1.0 (https://www.gutenberg.org/policy/robot_access.html)'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.text(); };
async function edition(id) {
  const rdf=await getText(`${root}/cache/epub/${id}/pg${id}.rdf`);
  const title=decode(rdf.match(/<dcterms:title[^>]*>([\s\S]*?)<\/dcterms:title>/)?.[1]);
  const agents=[...rdf.matchAll(/<pgterms:agent\b[^>]*>([\s\S]*?)<\/pgterms:agent>/g)].map(m=>({
    name:decode(m[1].match(/<pgterms:name[^>]*>([\s\S]*?)<\/pgterms:name>/)?.[1]),
    death:Number(m[1].match(/<pgterms:deathdate[^>]*>(\d{4})<\/pgterms:deathdate>/)?.[1])||null
  })).filter(a=>a.name);
  const author=agents[0];
  if(!title||!author)throw new Error('RDF thiếu tên tác phẩm hoặc tác giả');
  if(!author.death||author.death>1976)throw new Error(`Không xác minh được tác giả đã mất ít nhất 50 năm (${author.death||'thiếu năm mất'})`);
  return {title,author:author.name,death:author.death};
}
function splitText(raw) {
  const start=raw.search(/\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  const end=raw.search(/\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i);
  if(start<0||end<=start)throw new Error('Toàn văn thiếu dấu bắt đầu/kết thúc của Gutenberg');
  const text=raw.slice(start,end).replace(/^.*?\*\*\*\s*\n/i,'').trim();
  if(text.length<3000)throw new Error(`Toàn văn quá ngắn (${text.length} ký tự)`);
  const lines=text.split(/\r?\n/);
  const re=/^\s*(?:CHAPTER|CHAP\.?|BOOK|PART|SECTION|CANTO|LETTER|STAVE)\s+(?:[IVXLCDM]+|\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN|TWENTY)(?:\b.*)?\s*$/;
  const marks=[];for(let i=0;i<lines.length;i++)if(re.test(lines[i].toUpperCase())&&lines[i].trim().length<160)marks.push(i);
  let sections=marks.length>=2?marks.map((line,i)=>({title:lines[line].trim(),text:lines.slice(line+1,marks[i+1]??lines.length).join('\n').trim()})).filter(x=>x.text.length>300):[];
  if(sections.length<2)sections=[{title:'',text}];
  const pages=[];let wholeBookPage=1;
  for(const section of sections){
    const chunks=[];let body='';
    const flush=()=>{if(body){chunks.push(body);body='';}};
    for(const paragraph of section.text.split(/\n\s*\n/)){
      let p=paragraph.trim();
      if(!p)continue;
      if(body&&body.length+p.length+2>12000)flush();
      while(p.length>12000){
        flush();let cut=p.lastIndexOf(' ',12000);if(cut<7000)cut=12000;
        chunks.push(p.slice(0,cut).trim());p=p.slice(cut).trim();
      }
      body=body?`${body}\n\n${p}`:p;
    }
    flush();
    chunks.forEach((content,index)=>{
      const title=section.title
        ? (chunks.length===1?section.title:`${section.title} · Trang ${index+1}`)
        : `Trang ${wholeBookPage++}`;
      pages.push({title,content});
    });
  }
  return pages.filter(p=>p.content.length>0);
}
const normalize=(s)=>String(s||'').normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const dryRun=process.argv.includes('--dry-run');
const repairChapters=process.argv.includes('--repair-chapters');
let imported=0,skipped=0,failed=0;
try {
  await connectDB();
  const ownerConfigured=process.env.ADMIN_OWNER_ID?await User.findOne({_id:process.env.ADMIN_OWNER_ID,role:'ADMIN'}).select('_id').lean():null;
  const owner=ownerConfigured||await User.findOne({role:'ADMIN'}).select('_id').sort({createdAt:1}).lean();
  if(!owner)throw new Error('Không tìm thấy tài khoản ADMIN');
  const known=new Set((await Book.find({}).select('title author_name import_source source_id').lean()).flatMap(b=>[
    `${normalize(b.title)}::${normalize(b.author_name)}`,
    ...(b.import_source==='project_gutenberg'&&b.source_id?[`pg::${b.source_id}`]:[])
  ]));
  console.log(JSON.stringify({mode:dryRun?'dry-run':'apply',database:mongoose.connection.name,targets:targets.length}));
  for(const [genre,id] of targets){let book,cover;try{
    if(known.has(`pg::${id}`)){
      if(!repairChapters){skipped++;console.log(JSON.stringify({id,genre,status:'EXISTS_SOURCE'}));continue;}
      const current=await Book.findOne({import_source:'project_gutenberg',source_id:String(id)}).select('_id').lean();
      if(!current)throw new Error('Nguồn đã có trong chỉ mục nhưng không tìm thấy bản ghi sách');
      await edition(id);const raw=await getText(`${root}/cache/epub/${id}/pg${id}.txt`);const pages=splitText(raw);
      await Chapter.deleteMany({book_id:current._id});
      await Chapter.insertMany(pages.map((p,i)=>({book_id:current._id,title:p.title.slice(0,200),content:p.content.slice(0,199000),chapter_number:i+1,slug:`pg-${id}-${i+1}`,access_level:'free'})));
      console.log(JSON.stringify({id,genre,status:'CHAPTERS_REBUILT',pages:pages.length}));continue;
    }
    const meta=await edition(id);const key=`${normalize(meta.title)}::${normalize(meta.author)}`;
    if(known.has(key)){skipped++;console.log(JSON.stringify({id,genre,...meta,status:'EXISTS_TITLE_AUTHOR'}));continue;}
    const raw=await getText(`${root}/cache/epub/${id}/pg${id}.txt`);const pages=splitText(raw);
    if(dryRun){console.log(JSON.stringify({id,genre,...meta,pages:pages.length,characters:pages.reduce((n,p)=>n+p.content.length,0),status:'READY'}));known.add(key);known.add(`pg::${id}`);continue;}
    book=await Book.create({title:meta.title.slice(0,200),author_name:meta.author.slice(0,120),category:'ebook',genre,
      description:`Toàn văn gốc Project Gutenberg eBook ${id}. Tác giả qua đời năm ${meta.death}.`,cover_url:'',
      access_level:'free',owner:owner._id,status:'published',import_source:'project_gutenberg',source_id:String(id),
      source_url:`${root}/ebooks/${id}`,license_name:`Project Gutenberg public-domain text; author death year ${meta.death}`,
      license_url:`${root}/policy/permission.html`,language:'en',file_format:'TXT',verified_at:new Date()});
    await Chapter.insertMany(pages.map((p,i)=>({book_id:book._id,title:p.title.slice(0,200),content:p.content.slice(0,199000),chapter_number:i+1,slug:`pg-${id}-${i+1}`,access_level:'free'})));
    known.add(key);known.add(`pg::${id}`);imported++;console.log(JSON.stringify({id,genre,title:meta.title,author:meta.author,deathYear:meta.death,pages:pages.length,status:'IMPORTED',bookId:String(book._id)}));
  }catch(e){if(book?._id){await Chapter.deleteMany({book_id:book._id});await Book.deleteOne({_id:book._id});}failed++;console.log(JSON.stringify({id,genre,status:'SKIPPED',reason:String(e.message||e).slice(0,220)}));}await sleep(150);}
  console.log(JSON.stringify({mode:dryRun?'dry-run':'apply',database:mongoose.connection.name,imported,skipped,failed}));
}finally{await mongoose.disconnect();}
