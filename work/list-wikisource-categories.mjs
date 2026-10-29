import '../src/config/load-env.js';
const origin='https://vi.wikisource.org';
const configured=String(process.env.WIKISOURCE_USER_AGENT||'').trim();
const email=String(process.env.WIKISOURCE_CONTACT_EMAIL||process.env.ADMIN_EMAIL||process.env.SMTP_USER||process.env.MAIL_USER||'').trim();
const contact=configured||(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?`OpenBookImport/1.0 (mailto:${email})`:'');
if(!contact)throw new Error('Configure a contact URL or email before querying Wikisource');
const categories=['Thơ Việt Nam','Văn học dân gian Việt Nam','Cổ tích Việt Nam','Truyện Việt Nam','Văn học Việt Nam'];
for(const name of categories){
 const params=new URLSearchParams({action:'query',list:'categorymembers',cmtitle:`Thể loại:${name}`,cmtype:'page|subcat',cmlimit:'200',format:'json',formatversion:'2'});
 try {const response=await fetch(`${origin}/w/api.php?${params}`,{headers:{'User-Agent':contact,Accept:'application/json'},signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();const all=data.query?.categorymembers||[];const matches=all.filter(({ns,title})=>ns===0&&/(?:tập|tuyển|truyện|thơ|ca dao|cổ tích|dân ca|văn học|thi tập|sử lược|sử ký|truyền kỳ|tản đà|lĩnh nam|việt nam sử)/i.test(title)).map(({title})=>title);const subcategories=all.filter(({ns})=>ns===14).map(({title})=>title);console.log(JSON.stringify({category:name,continue:Boolean(data.continue),matches:matches.slice(0,80),subcategories}));}
 catch(error){console.log(JSON.stringify({category:name,error:error.message}));}
 await new Promise((resolve)=>setTimeout(resolve,1200));
}
