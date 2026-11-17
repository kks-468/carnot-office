// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { HALFK, HIRE, INS_Y, TODAY } from './catalog';
import { person } from './org';
import { addDays, sum } from './util';

export const payYears=()=>[...new Set([...Object.keys(S.pay).map(Number),S.payYear])].filter(Boolean).sort((a,b)=>a-b);
export const insOf=(org,yr)=>{S.ins[org]=S.ins[org]||{};return S.ins[org][yr]||(S.ins[org][yr]={...(INS_Y[yr]||INS_Y[2026])})};
export const gradesOf=(org,yr)=>{S.grades[org]=S.grades[org]||{};return S.grades[org][yr]||(S.grades[org][yr]=[])};
export const pgOf=(pid,yr=S.payYear)=>(S.pgrade[yr]||{})[pid];
export const payParts=(pid,yr=S.payYear)=>{const x=S.people.find(y=>y.id===pid);const g=pgOf(pid,yr);if(g&&x){const row=gradesOf(x.org,yr).find(r=>+r.no===+g);if(row)return{tax:+row.tax||0,free:+row.free||0,src:'grade',g:row}}return{tax:+(S.pay[yr]?.[pid]||0),free:+(S.payFree[yr]?.[pid]||0),src:'manual'}};
export const payOf=(pid,yr=S.payYear)=>{const q=payParts(pid,yr);return q.tax+q.free};
export const costParts=(pid,yr=S.payYear)=>{const x=S.people.find(y=>y.id===pid);const q=payParts(pid,yr);const sal=q.tax+q.free;if(!x)return{sal,tax:q.tax,free:q.free,src:q.src,ins:0,ret:0,tot:sal};const r=insOf(x.org,yr);const ins=x.noIns?0:Math.round(q.tax*(r.np+r.hi+r.hi*r.ltc/100+r.ei+r.ia)/100);const ret=x.noRet?0:Math.round(sal/12);return{sal,tax:q.tax,free:q.free,src:q.src,g:q.g,ins,ret,tot:sal+ins+ret}};
export const costBase=(pid,yr)=>costParts(pid,yr).tot;
export const rkOf=(pid,prj)=>S.rkind[pid]?.[prj]||'현금';
export function workdays(a,b){let n=0;let d=a;while(d<=b){const w=new Date(d+'T00:00:00').getDay();if(w!==0&&w!==6)n++;d=addDays(d,1)}return n}
export function leaveCalc(pid,yr){const p=person(pid);const hire=p.hire||HIRE[pid]||'';const ys=`${yr}-01-01`,ye=`${yr}-12-31`;let auto=0,basis='입사일 미입력';
  const ref=TODAY<ye?TODAY:ye;
  if(hire&&hire<=ref){const h=new Date(hire+'T00:00:00'),r=new Date(ref+'T00:00:00');let mon=(r.getFullYear()-h.getFullYear())*12+r.getMonth()-h.getMonth();if(r.getDate()<h.getDate())mon--;const yrs=Math.floor(mon/12);
    if(yrs<1){auto=Math.min(11,mon);basis=`근속 ${mon}개월 · 1개월마다 1일`}else{auto=Math.min(25,15+Math.floor((yrs-1)/2));basis=`근속 ${yrs}년`}}
  const adj=+((S.leaveAdj[yr]||{})[pid]||0);const ov=(S.leaveSet[yr]||{})[pid];const total=(ov!==undefined&&ov!=='')?+ov:auto+adj;
  const evs=S.cevents.filter(e=>e.pid===pid&&e.start.slice(0,4)===String(yr)&&['연차',...HALFK].includes(e.kind));
  const used=sum(evs.map(e=>e.kind==='연차'?workdays(e.start,e.end||e.start):0.5));return{hire,auto,adj,ov,total,used,left:total-used,evs,basis}}
