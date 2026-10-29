import '../src/config/load-env.js';
import { searchWikisourceBooks } from '../src/services/book-import.service.js';
const titles=['Chí Phèo','Đời thừa','Sống mòn','Trăng sáng','Đôi mắt (Nam Cao)','Cái chết của con Mực','Hai đứa trẻ','Gió lạnh đầu mùa','Tắt đèn','Lều chõng','Số đỏ','Giông tố'];
for (const title of titles) {
 try { const r=await searchWikisourceBooks(title); const c=r.candidates.find(x=>x.title.toLocaleLowerCase('vi')===title.toLocaleLowerCase('vi')) || r.candidates[0]; console.log(JSON.stringify({query:title,eligible:r.eligible,candidate:c&&{title:c.title,author:c.author,characters:c.contentCharacters,sourceUrl:c.sourceUrl,license:c.license},excluded:r.excludedCandidates?.find(x=>x.title.toLocaleLowerCase('vi')===title.toLocaleLowerCase('vi'))})); }
 catch(e){console.log(JSON.stringify({query:title,error:e.message}));}
}
