// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { apprOf, apvAttached, apvOrg, defaultLine } from './approval';
import { SEAL_RED, TODAY } from './catalog';
import { docsFor, evState, formDefaults, keyOf } from './evidence';
import { me, person, personLv, proj } from './org';
import { addDays, eok, esc, fdate, short, won } from './util';
import { curWeek, wRange, wrKey, wrLast, wrMem, wrTitle } from './work';

export function receiptImage(r){
  const c=document.createElement('canvas');c.width=360;c.height=540;const g=c.getContext('2d');
  g.fillStyle='#fffdf8';g.fillRect(0,0,360,540);g.fillStyle='#222';g.textAlign='center';
  g.font='bold 22px sans-serif';g.fillText(r.vendor,180,52);g.font='13px sans-serif';g.fillText('서울시 가상구 연구로 12',180,76);g.fillText('사업자 123-45-67890',180,96);
  g.setLineDash([4,4]);g.beginPath();g.moveTo(20,114);g.lineTo(340,114);g.stroke();
  g.textAlign='left';g.font='14px sans-serif';let y=144;
  (r.lines&&r.lines.length?r.lines:[['품목',r.amount]]).forEach(([n,a])=>{g.fillText(n,28,y);g.textAlign='right';g.fillText(eok(a),332,y);g.textAlign='left';y+=26});
  g.beginPath();g.moveTo(20,y);g.lineTo(340,y);g.stroke();y+=32;
  g.font='bold 18px sans-serif';g.fillText('합계',28,y);g.textAlign='right';g.fillText(eok(r.amount)+'원',332,y);g.textAlign='left';y+=40;
  g.font='13px sans-serif';[['카드',r.card],['승인일시',fdate(r.date)+' '+(r.time||'12:31')],['승인번호','3021'+String(r.amount).slice(-4)],['할부','일시불']].forEach(([k,v])=>{g.fillText(k,28,y);g.textAlign='right';g.fillText(v,332,y);g.textAlign='left';y+=24});
  g.textAlign='center';g.fillStyle='#666';g.fillText('* 카드매출전표 (가상 샘플) *',180,512);
  return c.toDataURL('image/png');
}
export function a4Model(e,d){
  const k=keyOf(e,d);const made=S.made[k];const file=S.files[k];const st=evState(e,d);
  if(d.src==='form'||d.src==='approval'){const base=formDefaults(e,d);const m=made?.form||base;return{kind:'doc',title:m.title,rows:m.rows,table:m.table||base.table,body:m.body,appr:d.src==='approval'?(made?.approved?made.line:defaultLine(e.org,'exec',e.amount).map(l=>({role:l.type==='기안'?'기안':personLv(person(l.pid))||person(l.pid)?.role,name:person(l.pid)?.name,date:null}))):null,sample:!made?.form&&!made?.docId&&st==='O'}}
  if(file&&/^image\//.test(file.type))return{kind:'img',title:short(d.n),fileUrl:URL.createObjectURL(file)};
  if(made?.receipt){const r=S.receipts.find(x=>x.id===made.receipt);return{kind:'img',title:'카드매출전표',img:r.img,caption:`${r.vendor} · ${fdate(r.date)} · ${won(r.amount)} · ${r.card}`}}
  if(file)return{kind:'file',file};
  return{kind:'doc',title:short(d.n),rows:[['서류',d.n]],body:'프로토타입 가상 증빙입니다.\n실제 서비스에서는 첨부한 원본 파일이 A4 크기로 들어가요.',sample:true};
}
export function a4Html(e,d){
  const ap0=apprOf(e,d);if(ap0)return apvHtml(ap0);
  const m=a4Model(e,d);const p=proj(e.proj);const o=S.orgs[e.org];const idx=docsFor(e).findIndex(x=>x.n===d.n)+1;
  const meta=`<table><tr><th>과제명</th><td colspan="3">${esc(p.name)}</td></tr><tr><th>연구개발기관</th><td>${esc(o.name)}</td><th>비목·세부유형</th><td>${esc(e.item)} / ${esc(e.sub)}</td></tr><tr><th>집행일</th><td>${fdate(e.date)}</td><th>집행 금액</th><td>${won(e.amount)}</td></tr></table>`;
  let inner='';
  if(m.kind==='img')inner=`<img class="rec" src="${m.img||m.fileUrl}" alt="">${m.caption?`<p style="text-align:center;font-size:12px;color:#444">${esc(m.caption)}</p>`:''}`;
  else if(m.kind==='doc')inner=`${m.appr?`<div class="appr">${m.appr.map(a=>`<div><div class="r">${esc(a.role)}</div><div class="s">${a.date?stampHtml(a.pid,a.name):esc(a.name||'')}</div><div class="d">${a.date?fdate(a.date):'&nbsp;'}</div></div>`).join('')}</div>`:''}
    ${m.rows?.length?`<table>${m.rows.map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`:''}
    ${m.table?`<table><tr>${m.table.head.map(h=>`<th style="width:auto">${esc(h)}</th>`).join('')}</tr>${m.table.rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>`:''}
    ${m.body?`<div class="bodytxt">${esc(m.body)}</div>`:''}${S.docSign?signLine(e.org):''}`;
  else inner=`<p>첨부 파일: ${esc(m.file.name)}</p>`;
  return `<div class="a4"><div class="a4top"><span>${esc(o.name)}</span><span>${esc(p.short)} · 증빙 ${esc(short(d.n))}</span></div><h1>${esc(m.title)}</h1>${meta}${inner}${m.sample?'<div class="wm">가상 샘플</div>':''}<div class="foot"><span>${esc(S.docFooter)}</span><span>문서번호 ${e.proj}-${e.id}-${idx}</span></div></div>`;
}
export async function a4Pdf(e,d){return htmlPdf(a4Html(e,d))}
export function fitA4(el){let fs=11.5;el.style.setProperty('--wfs',fs+'px');while(el.scrollHeight>1124&&fs>8){fs-=.5;el.style.setProperty('--wfs',fs+'px')}return fs}
export async function htmlPdf(html,opt){
  if(!window.html2canvas||!window.jspdf)throw new Error('lib');
  const stage=document.getElementById('a4stage');stage.innerHTML=html;
  const imgs=[...stage.querySelectorAll('img')];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
  try{await document.fonts?.ready}catch(_){}
  if(opt?.fit)fitA4(stage.firstElementChild);
  const canvas=await html2canvas(stage.firstElementChild,{scale:2,backgroundColor:'#ffffff',logging:false});stage.innerHTML='';
  const pdf=new jspdf.jsPDF({unit:'mm',format:'a4'});const pageH=Math.round(canvas.width*297/210);
  for(let y=0,i=0;y<canvas.height-12;y+=pageH,i++){const c=document.createElement('canvas');c.width=canvas.width;c.height=Math.min(pageH,canvas.height-y);
    const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(canvas,0,-y);
    if(i)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',.9),'JPEG',0,0,210,210*c.height/c.width)}
  return pdf.output('blob');
}
export function apvHtml(a){
  const o=S.orgs[apvOrg(a)];const dr=person(a.drafter);
  const row=(ls,label)=>ls.length?`<div class="appr"><div class="t">${label}</div>${ls.map(l=>{const p=person(l.pid);return `<div><div class="r">${esc(l.type==='기안'?'기안':personLv(p)||p?.role||'')}</div><div class="s">${l.st==='승인'?stampHtml(l.pid):l.st==='반려'?'<span class="stamp rej">반려</span>':''}</div><div class="d">${esc(p?.name||'')}<br>${l.date?fdate(l.date.slice(5)):'&nbsp;'}</div></div>`}).join('')}</div>`:'';
  const e=a.link&&S.entries.find(x=>x.id===a.link.e);
  return `<div class="a4"><div class="a4top"><span>${esc(o.name)}</span><span>전자결재 · ${esc(a.form)}</span></div><h1>${esc(a.form.replace(/\(.*\)/,''))}</h1>
  <div class="apprs">${row(a.line.filter(l=>l.type!=='협조'),'결재')}${row(a.line.filter(l=>l.type==='협조'),'협조')}</div>
  <table><tr><th>문서번호</th><td>${esc(a.no||'(결재 요청 시 부여)')}</td><th>기안일</th><td>${fdate(a.date)}</td></tr><tr><th>기안자</th><td>${esc(dr?.name)}</td><th>기안부서</th><td>${esc(dr?.unit||'')}</td></tr>${a.refs.length?`<tr><th>참조</th><td colspan="3">${a.refs.map(i=>esc(person(i)?.name)).join(', ')}</td></tr>`:''}<tr><th>제목</th><td colspan="3"><b>${esc(a.title)}</b></td></tr></table>
  ${a.fields.length?`<table>${a.fields.map(([k,v])=>`<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`:''}
  ${a.rx&&!e?`<table><tr><th>관련 연구</th><td>${esc(proj(a.rx.proj)?.name||'')}<br>${esc(a.rx.item)} / ${esc(a.rx.sub)} (${esc(a.rx.fund)}) · ${won(a.rx.amount)} · ${fdate(a.rx.date)}</td></tr></table>`:''}
  <div class="bodytxt">${esc(a.body)}</div>
  ${(()=>{const at=apvAttached(a);const rows=at.length?at:e?[{e,n:a.link.n}]:[];return rows.length?`<table>${rows.map(x=>`<tr><th>연결 집행</th><td>${esc(proj(x.e.proj).short)} · ${esc(x.e.item)}/${esc(x.e.sub)} · ${esc(x.e.desc)} · ${won(x.e.amount)}<br>증빙: ${esc(short(x.n))}</td></tr>`).join('')}</table>`:''})()}
  ${a.files.length?`<table><tr><th>첨부</th><td>${a.files.map(esc).join('<br>')}</td></tr></table>`:''}
  <div class="foot"><span>${esc(S.docFooter)}</span><span>보존연한 5년</span></div></div>`;
}
export function wrA4(view){
  const ws=curWeek();const prev=addDays(ws,-7);const o=S.orgs[S.view];
  const list=S.reports.filter(r=>r.week===ws&&S.people.find(p=>p.id===r.by)?.org===S.view);
  const staff=S.people.filter(p=>p.org===S.view&&p.acct!=='가입 신청'&&p.acct!=='중지'&&!p.admin);
  const tx=v=>esc(v||'-');const tag=p=>p?`<span class="tg">${p.phase==='제안'?'제안':esc(p.kind||'연구')}</span>`:'<span class="tg">기타 업무</span>';
  let head,rows;
  if(view==='proj'){const groups=[];list.forEach(r=>{const k=wrKey(r);let g=groups.find(x=>x.k===k);if(!g)groups.push(g={k,rs:[]});g.rs.push(r)});
    const rank=g=>{const p=proj(g.rs[0].proj);return !p?3:p.phase==='제안'?2:p.kind==='용역'?1:0};groups.sort((a,b)=>rank(a)-rank(b));
    head=`<colgroup><col style="width:5%"><col style="width:21%"><col style="width:31%"><col style="width:31%"><col style="width:12%"></colgroup><thead><tr><th>No</th><th>프로젝트명</th><th>지난주 실적<br><span style="font-weight:500">${wRange(prev)}</span></th><th>금주 계획<br><span style="font-weight:500">${wRange(ws)}</span></th><th>구성원</th></tr></thead>`;
    rows=groups.map((g,i)=>{const f=g.rs[0];const notes=g.rs.map(r=>r.note).filter(Boolean);const bl=fn=>g.rs.map(r=>`<div class="blk">${tx(fn(r))}</div>`).join('');
      return `<tr><td class="c">${i+1}</td><td><div class="nm">${esc(wrTitle(f))}</div>${tag(proj(f.proj))}</td><td>${bl(wrLast)}</td><td>${bl(r=>r.next)}</td><td>${tx(wrMem(f))}</td></tr>${notes.length?`<tr class="note"><td colspan="2" class="c">주요 내용</td><td colspan="3">${notes.map(esc).join(' / ')}</td></tr>`:''}`}).join('')}
  else{const ppl=staff.filter(p=>list.some(r=>r.by===p.id));
    head=`<colgroup><col style="width:11%"><col style="width:20%"><col style="width:27%"><col style="width:27%"><col style="width:15%"></colgroup><thead><tr><th>이름</th><th>프로젝트명</th><th>지난주 실적<br><span style="font-weight:500">${wRange(prev)}</span></th><th>금주 계획<br><span style="font-weight:500">${wRange(ws)}</span></th><th>주요 내용</th></tr></thead>`;
    rows=ppl.map(p=>{const rs=list.filter(r=>r.by===p.id);return rs.map((r,i)=>`<tr>${i===0?`<td class="c" rowspan="${rs.length}"><b>${esc(p.name)}</b><br><span style="font-size:.85em;color:#555">${esc(p.unit||'')}</span></td>`:''}<td><div class="nm">${esc(wrTitle(r))}</div>${tag(proj(r.proj))}</td><td>${tx(wrLast(r))}</td><td>${tx(r.next)}</td><td>${esc(r.note||'')}</td></tr>`).join('')}).join('')}
  const miss=staff.filter(p=>!list.some(r=>r.by===p.id));
  return `<div class="a4 wr4"><div class="a4top"><span>${esc(o.name)}</span><span>주간 업무보고 · ${view==='proj'?'프로젝트별':'사람별'}</span></div>
  <div class="wr4h"><div><h1>주간 업무보고</h1><p class="wr4m">${fdate(ws)} 주간 · 지난주 ${wRange(prev)} / 금주 ${wRange(ws)} · ${view==='proj'?'프로젝트별':'사람별'}</p><p class="wr4m">작성 ${staff.length-miss.length}/${staff.length}명${miss.length?` · 미작성 ${miss.map(p=>esc(p.name)).join(', ')}`:''}</p></div>
  <div class="sign">${['작성','검토','승인'].map(k=>`<div><b>${k}</b><i></i></div>`).join('')}</div></div>
  <table class="w">${head}<tbody>${rows||'<tr><td colspan="5" class="c">이 주에 올라온 업무보고가 없어요.</td></tr>'}</tbody></table>
  <div class="foot"><span>${esc(S.docFooter||'')}</span><span>출력 ${fdate(TODAY)} · ${esc(me()?.name||'')}</span></div></div>`;
}
export const sealFont=`'Nanum Myeongjo','Noto Serif KR','Batang','AppleMyungjo',serif`;
export function sealSvg(text,kind,cls='seal'){
  const t=[...String(text||'').replace(/\s/g,'')];let cells=[];
  if(kind==='org'){const ch=t.slice(0,16);const cols=Math.max(2,Math.ceil(Math.sqrt(ch.length))),rows=Math.ceil(ch.length/cols);const cw=48/cols,rh=48/rows;
    ch.forEach((c,i)=>{const col=Math.floor(i/rows),row=i%rows;cells.push({c,x:56-cw*(col+.5),y:8+rh*(row+.5),fs:Math.min(cw,rh)*.82})});
    return `<svg class="${cls}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(text)} 직인"><rect x="3" y="3" width="58" height="58" rx="3" fill="none" stroke="${SEAL_RED}" stroke-width="3"/>${cells.map(z=>`<text x="${z.x}" y="${z.y}" font-size="${z.fs.toFixed(1)}" font-family="${sealFont}" font-weight="700" fill="${SEAL_RED}" text-anchor="middle" dominant-baseline="central">${esc(z.c)}</text>`).join('')}</svg>`}
  const nm=t.slice(0,4);let ch=nm.length>=4?nm:nm.length===3?[...nm,'인']:nm.length===2?[...nm,'인']:[...nm,'인'];
  const pos=ch.length===3?[[31,17],[31,31],[17,24]]:ch.length===2?[[24,17],[24,31]]:[[31,17],[31,31],[17,17],[17,31]];
  ch.forEach((c,i)=>cells.push({c,x:pos[i][0],y:pos[i][1]}));
  const frame=kind==='square'?`<rect x="3" y="3" width="42" height="42" rx="4" fill="none" stroke="${SEAL_RED}" stroke-width="2.4"/>`:`<circle cx="24" cy="24" r="21" fill="none" stroke="${SEAL_RED}" stroke-width="2.4"/>`;
  return `<svg class="${cls}" viewBox="0 0 48 48" width="46" height="46" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(text)} 도장"><g transform="rotate(-8 24 24)">${frame}${cells.map(z=>`<text x="${z.x}" y="${z.y}" font-size="12.5" font-family="${sealFont}" font-weight="700" fill="${SEAL_RED}" text-anchor="middle" dominant-baseline="central">${esc(z.c)}</text>`).join('')}</g></svg>`;
}
export const stampOf=pid=>S.stamps[pid]||{kind:'circle'};
export function stampHtml(pid,name){const p=person(pid)||S.people.find(x=>x.name===name);const nm=p?.name||name||'';const st=p?stampOf(p.id):{kind:'circle'};
  if((st.kind==='image'||st.kind==='draw')&&st.img)return `<img class="stamp-img" src="${st.img}" alt="${esc(nm)} ${st.kind==='draw'?'서명':'도장'}">`;
  return sealSvg(nm,st.kind==='square'?'square':'circle')}
export const sealOf=org=>{const o=S.orgs[org];const c=S.orgSeal[org]||(S.orgSeal[org]={kind:'auto',text:o.name.replace(/\(주\)|㈜|\s/g,'')+'인'});return c};
export function orgSealHtml(org){const c=sealOf(org);return c.kind==='image'&&c.img?`<img src="${c.img}" alt="${esc(S.orgs[org].name)} 직인">`:sealSvg(c.text,'org')}
export function signLine(org){const o=S.orgs[org];return `<div class="sign">${fdate(TODAY)}<br>${S.docSeal?`<span class="sealwrap">${esc(o.name)}${orgSealHtml(org)}</span>`:esc(o.name)}</div>`}
export function cleanImage(dataUrl,cb){const im=new Image();im.onload=()=>{const max=400,k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);const x=c.getContext('2d');x.drawImage(im,0,0,c.width,c.height);
  const d=x.getImageData(0,0,c.width,c.height);for(let i=0;i<d.data.length;i+=4){const r=d.data[i],g=d.data[i+1],b=d.data[i+2];if(r>225&&g>225&&b>225)d.data[i+3]=0}x.putImageData(d,0,0);cb(c.toDataURL('image/png'))};im.onerror=()=>cb(null);im.src=dataUrl}
export function apvStamp(){
  const m=me();const st=stampOf(m.id);const opt=(k,l,pv)=>`<button class="stampopt" data-a="stampKind" data-x="${k}" aria-pressed="${st.kind===k}"><span class="pv">${pv}</span><span class="small"><b>${l}</b></span></button>`;
  const imgPv=k=>st.kind===k&&st.img?`<img src="${st.img}" alt="">`:`<span class="small muted">${k==='draw'?'직접 그리기':'파일 올리기'}</span>`;
  return `<div class="page-head"><div><h2>서명·도장</h2><p class="small muted">${esc(m.name)}님이 결재하면 결재란에 찍히는 도장이에요. 전자결재 문서와 연구비 증빙 A4 PDF에 똑같이 들어가요.</p></div></div>
  <section class="card"><h3 class="h3">사용할 도장</h3><div class="stampopts">${opt('circle','원형 도장 (자동)',sealSvg(m.name,'circle'))}${opt('square','사각 도장 (자동)',sealSvg(m.name,'square'))}${opt('draw','서명',imgPv('draw'))}${opt('image','도장 이미지',imgPv('image'))}</div></section>
  ${st.kind==='draw'?`<section class="card"><h3 class="h3">서명 그리기</h3><p class="small muted">마우스나 손가락으로 아래 칸에 서명해 주세요.</p><canvas id="sigpad" width="840" height="320" aria-label="서명 입력 칸"></canvas><div class="row" style="margin-top:8px"><button class="btn sm" data-a="sigClear">지우기</button><button class="btn sm primary" data-a="sigSave">서명 저장</button></div></section>`:''}
  ${st.kind==='image'?`<section class="card"><h3 class="h3">도장 이미지 올리기</h3><p class="small muted">흰 종이에 찍은 도장을 사진으로 찍거나 스캔해서 올려 주세요. 흰 배경은 자동으로 투명하게 바꿔요.</p><label class="btn sm" for="stamp-up">이미지 고르기<input id="stamp-up" type="file" accept="image/*" hidden data-a-change="stampUp"></label></section>`:''}
  <section><h3 class="h3">결재란 미리보기</h3><div class="a4" style="min-height:0;padding:16px;width:auto;max-width:min(380px,100%);box-sizing:border-box"><div class="appr"><div class="t" style="width:auto;padding:4px">결재</div><div><div class="r">${esc(personLv(m)||m.role)}</div><div class="s">${stampHtml(m.id)}</div><div class="d">${esc(m.name)}<br>${fdate(TODAY.slice(5))}</div></div><div><div class="r">팀장</div><div class="s"></div><div class="d">&nbsp;<br>&nbsp;</div></div></div></div></section>`;
}
