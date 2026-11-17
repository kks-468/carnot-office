// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { ABSENT, CK, CK_OLD, HALFK, TODAY } from './catalog';
import { live, me, person, proj } from './org';
import { addDays, fdate, ymd } from './util';

export const weekStart=d=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()-x.getDay());return ymd(x)};
export const curWeek=()=>S.rw||(S.rw=weekStart(TODAY));
export const wRange=ws=>`${fdate(ws).slice(5)}~${fdate(addDays(ws,6)).slice(5)}`;
export const canNotice=()=>{const m=me();return !!m&&(m.admin||/행정|관리자|본부장|단장/.test(m.role))};
export const wrKey=r=>r.proj||('t:'+r.title);
export const wrPrev=r=>S.reports.find(x=>x.by===r.by&&x.week===addDays(r.week,-7)&&wrKey(x)===wrKey(r));
export const wrLast=r=>{const p=wrPrev(r);return p?p.next:(r.last||'')};
export const wrTitle=r=>r.proj?(proj(r.proj)?.name||r.title):r.title;
export const wrMem=r=>r.proj?(proj(r.proj)?.wrMem||''):(r.members||'');
export const ckCls=k=>(CK.find(x=>x[0]===k)||[])[1]||CK_OLD[k]||'etc';
export const evKind=e=>e.kind==='기타'&&e.label?e.label:e.kind;
export const ckMatch=(e,kf)=>kf==='all'||(kf==='absent'?ABSENT.includes(e.kind):kf==='반차'?HALFK.includes(e.kind):e.kind===kf);
export const evTime=e=>e.time?(e.time2?`${e.time}~${e.time2}`:e.time):'';
export function companyEvents(){const own=S.cevents.filter(e=>{const p=person(e.pid||e.by);return p?.org===S.view});
  const mt=S.meetings.filter(m=>live(proj(m.proj))).map(m=>({id:'m_'+m.id,kind:'회의',start:m.date,end:m.date,time:m.start,title:`${proj(m.proj).short} · ${m.topic}`,pid:m.att[0],auto:true}));return [...own,...mt]}
export const evOn=(e,d)=>d>=e.start&&d<=(e.end||e.start);
