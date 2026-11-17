// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { apvAttached } from './approval';
import { budgetOf, docInY, inCur, inY } from './budget';
import { APV_DOC, CAT, FORM_RE, TODAY } from './catalog';
import { peopleNames } from './meeting';
import { exemptOrg, expert, forProfit, joined, live, me, peopleOf, person, proj, teamOk } from './org';
import { fdate, short, sum, uid, won } from './util';

export const apvFormOf=n=>(APV_DOC.find(([re])=>re.test(n))||[])[1]||null;
export function srcOf(n){if(S.srcOv&&S.srcOv[n])return S.srcOv[n];if(/^회의록/.test(n))return'form';if(/카드매출전표/.test(n))return'card';if(apvFormOf(n))return'approval';if(FORM_RE.test(n))return'form';return'file'}
export const docVisible=d=>{const p=proj(d.proj);return p&&joined(p,S.view)&&(d.org===S.view||d.share==='전체')};
export const subOf=(item,s)=>(CAT[item]||[]).find(x=>x.s===s)||(CAT[item]||[])[0];
export const keyOf=(e,d)=>`${e.id}|${d.n}`;
export function docsFor(e){
  const o=S.orgs[e.org];const sub=subOf(e.item,e.sub);if(!sub)return[];
  return sub.d.map(raw=>{const d=typeof raw==='string'?{n:raw}:raw;
    if(d.fp&&!forProfit(o))return null;
    if(d.min&&(+e.amount||0)<d.min)return null;
    let kind=d.opt?'opt':'req',note=d.note||d.opt||'';
    if(d.np&&exemptOrg(o)){kind='exempt';note='대학·연구기관은 현황표에 급여정보 포함 시 면제'}
    if(e.sub==='회의비'&&/회의록/.test(d.n)&&(+e.amount||0)<=100000)note='10만원 이하: 목적·일시·장소·내용·참석자 명단 자료로 대체 가능';
    return{n:d.n,kind,note,src:srcOf(d.n)}}).filter(Boolean);
}
export const evState=(e,d)=>e.ev?.[d.n]??(d.kind==='opt'?'N':'X');
export const isPending=(e,d)=>{const m=S.made[keyOf(e,d)];if(!m?.pending||evState(e,d)==='O')return false;const ap=m.appr&&S.appr.find(a=>a.id===m.appr);return !ap||ap.status==='진행'};
export function evSum(e){const ds=docsFor(e).filter(d=>d.kind!=='exempt');let o=0,x=0;ds.forEach(d=>{const s=evState(e,d);if(s==='O')o++;else if(s==='X')x++});return{o,x,ok:x===0}}
export function evidRows(){const f=S.evf;return S.entries.filter(e=>e.org===S.view&&live(proj(e.proj),S.view)&&inCur(e)&&teamOk(proj(e.proj))&&(f.proj==='all'||e.proj===f.proj)&&(f.item==='all'||e.item===f.item)&&(f.sub==='all'||f.item==='all'||e.sub===f.sub)&&(f.st==='all'||(f.st==='miss'?!evSum(e).ok:evSum(e).ok))).sort((a,b)=>a.proj===b.proj?(a.date<b.date?-1:1):a.proj<b.proj?-1:1)}
export function tplFor(n){return S.TPL.find(t=>{try{return new RegExp(t.match).test(n)}catch(_){return false}})}
export function tplCtx(e,d){
  const p=proj(e.proj);const mt=S.meetings.find(x=>x.id===e.meeting);const lead=peopleOf(p).find(x=>x.org===e.org)||me();const ppl=peopleNames(e);
  const doc=S.docs.find(x=>x.id===(S.made[keyOf(e,d)]?.docId||mt?.doc));
  const x=(e.exp?.length&&expert(e.exp[0]))||S.experts.find(y=>e.desc.includes(y.name))||(mt&&mt.exp[0]&&expert(mt.exp[0]))||S.experts[0];
  return{과제명:p.name,과제약칭:p.short,연차:p.year,집행일:fdate(e.date),금액:won(e.amount),거래처:e.vendor&&e.vendor!=='-'?e.vendor:'',내용:e.desc,비목:e.item,세부유형:e.sub,
    인원:ppl.join(', ')||lead?.name||'',참여인원:ppl.length?`${ppl.join(', ')} (${ppl.length}명)`:'',인원수:ppl.length?ppl.length+'명':'','1인당':ppl.length?won(Math.round(e.amount/ppl.length)):'',작성자:lead?.name||'',오늘:fdate(TODAY),
    회의일시:mt?`${fdate(mt.date)} ${mt.start}~${mt.end}`:fdate(e.date),회의장소:mt?.place||'[담당자 입력]',참석자:mt?[...mt.att.map(i=>person(i)?.name),...mt.exp.map(i=>expert(i)?.name)].join(', '):'[담당자 입력]',참석자내부:[...((mt?.att)||e.att||[])].map(i=>person(i)?.name).filter(Boolean).join(', ')||'없음',참석자외부:[...((mt?.exp)||e.exp||[])].map(i=>expert(i)?.name).filter(Boolean).join(', ')||'없음',안건:mt?.topic||e.desc,
    회의록본문:doc?.body?.replace(/^회의록\n+/,'')||'[담당자 입력]',전문가:x?.name||'',전문가소속:x?.org||'',전문가분야:x?.field||'',전문가이력:x?.career||'',서류명:short(d.n)};
}
export const fillStr=(str,c)=>String(str||'').replace(/\{([^}]+)\}/g,(m,k)=>k in c?c[k]:m);
export const ATT_IN='참석자 (내부 인원)',ATT_EX='참석자 (외부 전문가)';
export function attNorm(fm,e){if(!fm||fm.inn)return fm;const i=fm.rows.findIndex(r=>r[0]==='참석자'||r[0]===ATT_IN||r[0]===ATT_EX);if(i<0)return fm;
  const mt=S.meetings.find(m=>m.id===e.meeting)||S.meetings.find(m=>m.entry===e.id);const att=(mt?.att||e.att||[]),exp=(mt?.exp||e.exp||[]);
  if(fm.rows[i][0]==='참석자'){const names=String(fm.rows[i][1]||'').split(/\s*,\s*/).map(x=>x.replace(/\(전문가\)$/,'').trim()).filter(x=>x&&!/담당자 입력/.test(x));
    fm.inn=[];fm.ext=[];names.forEach(n=>{const x=S.experts.find(y=>y.name===n);const p=S.people.find(y=>y.name===n&&y.org===e.org);if(x&&!p)fm.ext.push({id:x.id,name:n});else fm.inn.push(p?{id:p.id,name:n}:{name:n})});
    if(!names.length){fm.inn=att.map(id=>({id,name:person(id)?.name})).filter(x=>x.name);fm.ext=exp.map(id=>({id,name:expert(id)?.name})).filter(x=>x.name)}
    fm.rows.splice(i,1,[ATT_IN,''],[ATT_EX,''])}
  else{fm.inn=att.map(id=>({id,name:person(id)?.name})).filter(x=>x.name);fm.ext=exp.map(id=>({id,name:expert(id)?.name})).filter(x=>x.name);if(!fm.rows.some(r=>r[0]===ATT_EX))fm.rows.splice(i+1,0,[ATT_EX,'']);if(!fm.rows.some(r=>r[0]===ATT_IN))fm.rows.splice(i,0,[ATT_IN,''])}
  return attSync(fm)}
export function attSync(fm){fm.rows.forEach(r=>{if(r[0]===ATT_IN)r[1]=fm.inn.map(x=>x.name).join(', ')||'없음';if(r[0]===ATT_EX)r[1]=fm.ext.map(x=>x.name).join(', ')||'없음'});return fm}
export function formDefaults(e,d){
  const t=tplFor(d.n);if(!t)return{title:short(d.n),rows:[['작성일',fdate(TODAY)]],body:'[담당자 입력]'};const c=tplCtx(e,d);
  const rows=t.rows.map(([l,v])=>[l,fillStr(v,c),v]).filter(([l,v,raw])=>!(/^\{[^}]+\}$/.test(raw.trim())&&v==='')).map(([l,v])=>[l,v]);
  let table;const p=proj(e.proj);
  if(t.table==='rate'){const ppl=peopleOf(p).filter(x=>x.org===e.org);table={head:['성명','소속','역할','참여율'],rows:ppl.map(x=>[x.name,x.unit,x.role,(S.rates[x.id]?.[p.id]||0)+'%'])}}
  if(t.table==='time'){const ps=(e.att||[]).map(person).filter(Boolean);table={head:['성명','소속','역할','근무 시간'],rows:ps.map(x=>[x.name,x.unit,x.role,t.time||'19:00~22:00'])}}
  const out={title:fillStr(t.title,c)||short(d.n),rows,table,body:fillStr(t.body,c)};return attNorm(out,e);
}
export function pendingApprovals(){const out=[];S.entries.forEach(e=>{if(e.org!==S.view)return;docsFor(e).forEach(d=>{if(isPending(e,d))out.push({e,d})})});return out}
export const docVisibleAny=d=>{const p=proj(d.proj);return p&&joined(p,S.view)&&(d.org===S.view||d.share==='전체')};
export const libScope=(p,y)=>{const es=S.entries.filter(e=>e.proj===p.id&&e.org===S.view&&inY(e,y)).sort((a,b)=>a.date<b.date?-1:1);const docs=S.docs.filter(d=>d.proj===p.id&&docVisibleAny(d)&&docInY(d,p,y)).sort((a,b)=>a.date<b.date?1:-1);
  const aps=S.appr.filter(a=>a.status==='완료'&&apvAttached(a).some(x=>x.e.proj===p.id&&inY(x.e,y)));
  const bud=i=>{if(y){const b=y.budget?.[S.view]||{};return i?b[i]||0:sum(Object.values(b))}if(p.years?.length){const bs=p.years.map(z=>z.budget?.[S.view]||{});return sum(bs.map(b=>i?b[i]||0:sum(Object.values(b))))}return budgetOf(p,S.view,i)};
  const sp=i=>sum(es.filter(e=>!i||e.item===i).map(e=>e.amount));return{es,docs,aps,bud,sp}};
export const entryDoc=x=>{const[id,i]=String(x).split('|');const e=S.entries.find(y=>y.id===+id);return{e,d:docsFor(e)[+i],i:+i}};
export function makeEntryFromReceipt(r,{proj:pid,item,sub,meeting,desc,att=[],exp=[]}){
  const id=uid();const e={id,proj:pid,org:S.view,item,sub,date:r.date,desc,vendor:r.vendor,amount:r.amount,ev:{},receipt:r.id,att:[...att],exp:[...exp]};
  const mt=meeting&&S.meetings.find(x=>x.id===meeting);if(mt){e.meeting=mt.id;mt.entry=id;e.att=[...mt.att];e.exp=[...mt.exp]}
  docsFor(e).forEach(d=>{if(d.kind==='exempt')return;e.ev[d.n]=d.kind==='opt'?'N':'X';
    if(d.src==='card'){e.ev[d.n]='O';S.made[keyOf(e,d)]={receipt:r.id}}
    if(mt&&/^회의록/.test(d.n)&&mt.doc){e.ev[d.n]='O';S.made[keyOf(e,d)]={docId:mt.doc}}});
  r.st='linked';r.entry=id;S.entries.push(e);return e;
}
