import '../src/config/load-env.js';
import { searchWikisourceBooks } from '../src/services/book-import.service.js';
const titles=['Đêm sáng trăng','Cái xó bếp','Dưới bóng hoàng lan','Một đám cưới','Mua nhà','Nhà mẹ Lê','Cô hàng xén','Hai lần chết','Sợi tóc (truyện ngắn)','Tối ba mươi','Con mèo (Nam Cao)','Bài học quét nhà','Cái mặt không chơi được','Bẩy bông lúa lép','Ba người bạn','Bóng người xưa','Đứa con đầu lòng','Ba ngày luân lạc','Hưng Đạo vương','Nửa chừng xuân','Anh phải sống'];
const norm=s=>String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase('vi').replace(/đ/g,'d').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
for (const title of titles) {
 try { const r=await searchWikisourceBooks(title); const expected=norm(title); const c=r.candidates.find(x=>norm(x.title)===expected); const rejected=r.excludedCandidates.find(x=>norm(x.title)===expected); console.log(JSON.stringify({query:title,eligible:Boolean(c),candidate:c&&{title:c.title,author:c.author,characters:c.contentCharacters,sourceUrl:c.sourceUrl},rejected:rejected?.reasons,otherEligible:!c&&r.candidates.map(x=>x.title)})); }
 catch(e){console.log(JSON.stringify({query:title,error:e.message}));}
}
