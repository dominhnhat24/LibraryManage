import '../src/config/load-env.js';
import mongoose from 'mongoose';
import { createHash } from 'node:crypto';
import { connectDB } from '../src/config/database.config.js';
import Book from '../src/models/book.model.js';
import Chapter from '../src/models/chapter.model.js';
import { getReadableChapters } from '../src/services/chapter.service.js';

await connectDB();
const books = await Book.find({}, 'title author_name genre import_source source_id source_url license_name file_format file_size').lean();
const chapters = await Chapter.find({}, 'book_id chapter_number title content').sort({ book_id: 1, chapter_number: 1 }).lean();
const genres = ['van_hoc_viet_nam','truyen_ngan_viet_nam','tho_viet_nam','van_hoc_dan_gian','van_hoc_the_gioi','kinh_doanh','phat_trien_ban_than','tam_ly_hoc','lich_su','khoa_hoc'];
const normalize = (value) => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim();
const chaptersByBook = new Map();
for (const chapter of chapters) { const key=String(chapter.book_id); chaptersByBook.set(key,[...(chaptersByBook.get(key)||[]),chapter]); }
const duplicateBooks = Object.entries(books.reduce((acc,book)=>{const key=`${normalize(book.title)}::${normalize(book.author_name)}`;(acc[key]||= []).push(book);return acc;},{})).filter(([,items])=>items.length>1).map(([key,items])=>({key,ids:items.map((book)=>String(book._id)),titles:items.map((book)=>book.title)}));
const emptyPages=chapters.filter((chapter)=>!String(chapter.content||'').trim()).length;
const pageDuplicates=[];
for(const [bookId,bookChapters] of chaptersByBook){const seen=new Map();for(const chapter of bookChapters){const hash=createHash('sha256').update(String(chapter.content||'')).digest('hex');if(seen.has(hash))pageDuplicates.push({bookId,chapters:[seen.get(hash),chapter.chapter_number]});else seen.set(hash,chapter.chapter_number);}}
const badTitles=chapters.filter((chapter)=>/Trang 0|undefined|null/i.test(chapter.title||'')).length;
const sourceProblems=books.filter((book)=>!book.title||!book.author_name||!book.import_source||!book.source_id||!book.source_url||!book.license_name).map((book)=>({id:String(book._id),title:book.title}));
const totals=Object.fromEntries(genres.map((genre)=>[genre,books.filter((book)=>book.genre===genre).length]));
const sourceTotals=books.reduce((acc,book)=>(acc[book.import_source||'legacy']=(acc[book.import_source||'legacy']||0)+1,acc),{});
const longestBooks=[...chaptersByBook.entries()].map(([bookId,items])=>({book:books.find((item)=>String(item._id)===bookId),maxPageCharacters:Math.max(...items.map((item)=>String(item.content||'').length)),pages:items.length})).sort((a,b)=>b.maxPageCharacters-a.maxPageCharacters).slice(0,10).map((item)=>({title:item.book?.title,source:item.book?.import_source,genre:item.book?.genre,maxPageCharacters:item.maxPageCharacters,pages:item.pages}));
const samples=[];
for(const title of ['Lịch sử nước ta','Hạnh phúc lối nào','Self Help; with Illustrations of Conduct and Perseverance','Through the Looking-Glass','Việt Nam sử lược – Quyển II']){
 const book=books.find((item)=>item.title===title);if(!book)continue;
 const readable=await getReadableChapters(book._id,['free'],{page:1,limit:3});
 samples.push({title,format:book.file_format,readerReturned:readable.chapters.length,pagination:readable.pagination,
   firstPageCharacters:readable.chapters[0]?.content?.length||0,firstPageTitle:readable.chapters[0]?.title||'',
   ...(book.file_format==='PDF'?{pdfFileBytes:book.file_size,readerMode:'PDF stream available'}:{})});
}
console.log(JSON.stringify({database:mongoose.connection.name,totalBooks:books.length,totalChapters:chapters.length,genreCounts:totals,bySource:sourceTotals,
 booksWithChapters:chaptersByBook.size,sourceProblems:sourceProblems.length,duplicateBooks,emptyPages,pageDuplicates:pageDuplicates.length,badTitles,samples,longestBooks,
 pages:{min:Math.min(...chapters.map((item)=>item.content.length)),max:Math.max(...chapters.map((item)=>item.content.length)),over14000:chapters.filter((item)=>item.content.length>14000).length}},null,2));
await mongoose.disconnect();
