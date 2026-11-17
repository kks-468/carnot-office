// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { A } from './actions';
import { ITEMS, RATIO } from './catalog';
import { docsFor } from './evidence';
import { part, proj } from './org';
import { costBase } from './pay';
import { fdate, sum, won } from './util';

export const ratioBudget=t=>{let left=t,o={};ITEMS.forEach((k,i)=>{const v=i===ITEMS.length-1?left:Math.round(t*RATIO[k]/1000)*1000;o[k]=v;left-=v});return o};
export const periodOf=p=>{const ys=p.years||[];return ys.length?`${fdate(ys[0].start)}~${fdate(ys[ys.length-1].end)}`:`${fdate(p.start)}~${fdate(p.end)}`};
export const budgetOf=(p,org,item)=>{const q=part(p,org);if(!q||q.status!=='수락')return 0;return item?q.budget[item]||0:sum(Object.values(q.budget))};
export const curY=p=>p?.years?.find(y=>y.no===p.cur);
export const yLabel=y=>`${y.no}차년도 (${y.start.slice(0,4)}.${+y.start.slice(5,7)}.${+y.start.slice(8)}~${y.end.slice(0,4)}.${+y.end.slice(5,7)}.${+y.end.slice(8)})`;
export const inY=(e,y)=>!y||(e.date>=y.start&&e.date<=y.end);
export const inCur=e=>{const p=proj(e.proj);return !p||!!p.archived||inY(e,curY(p))};
export const yearOf=(p,no)=>p?.years?.find(y=>y.no===+no);
export const docInY=(d,p,y)=>!y||(d.date<=y.end&&(y.no===p.years[0].no||d.date>=y.start));
export const zeroBudget=()=>Object.fromEntries(ITEMS.map(i=>[i,0]));
export const inkOf=(p,org,item)=>{const q=part(p,org);if(!q||q.status!=='수락')return 0;const k=q.inkind||{};return item?k[item]||0:sum(Object.values(k))};
export const fundBudget=(p,org,item,fund)=>fund==='현물'?inkOf(p,org,item):budgetOf(p,org,item)-inkOf(p,org,item);
export const spentF=(p,org,item,fund)=>sum(S.entries.filter(e=>e.proj===p.id&&e.org===org&&(!item||e.item===item)&&inCur(e)&&(e.fund||'현금')===fund).map(e=>e.amount));
export const allocText=(c,k,t)=>`배분 합계 ${won(c+k)} (현금 ${won(c)} · 현물 ${won(k)})${t?` / 사업비 ${won(t)}`:''}`;
export const spentOf=(p,org,item)=>sum(S.entries.filter(e=>e.proj===p.id&&e.org===org&&(!item||e.item===item)&&inCur(e)).map(e=>e.amount));
export const totalBudget=p=>sum(p.parts.filter(q=>q.status==='수락').map(q=>sum(Object.values(q.budget))));
export function mkEntry(e,missing=[]){const full={...e,ev:{}};docsFor(full).forEach(d=>{if(d.kind==='req')full.ev[d.n]=missing.includes(d.n)?'X':'O';else if(d.kind==='opt')full.ev[d.n]='N'});return full}
export function defaultPlan(p,org){
  const o={};ITEMS.forEach(i=>{const b=Math.round(budgetOf(p,org,i)/1000);let w;
    if(i==='연구시설·장비비')w=[3,2,1,0,0,0,0,0,0,0,0,0];
    else if(i==='연구재료비')w=[1,2,2,2,1,1,1,1,1,0,0,0];
    else if(i==='위탁연구개발비')w=[0,0,1,0,0,0,0,0,1,0,0,0];
    else w=Array(12).fill(1);
    const W=sum(w);const arr=w.map(x=>Math.floor(b*x/W));arr[w.lastIndexOf(Math.max(...w))]+=b-sum(arr);o[i]=arr});return o}
export const planOf=(p,org=S.view)=>p.plan[org]||(p.plan[org]=defaultPlan(p,org));
export function seedSub(p,org){if(p.id==='A'&&org==='sa'){const f=v=>Array(12).fill(v);return{'연구활동비':{'회의비':f(800),'야근·특근 식대':f(300),'전문가활용비':f(600),'국내여비':f(500)}}}return{}}
export const subPlanOf=(p,org=S.view)=>{p.subplan=p.subplan||{};return p.subplan[org]||(p.subplan[org]=seedSub(p,org))};
export const actualSub=(p,org,item,sub,mon)=>sum(S.entries.filter(e=>e.proj===p.id&&e.org===org&&e.item===item&&e.sub===sub&&e.date.startsWith(mon)).map(e=>e.amount));
export const actualMonth=(p,org,item,mon)=>sum(S.entries.filter(e=>e.proj===p.id&&e.org===org&&e.item===item&&e.date.startsWith(mon)).map(e=>e.amount));
export const rateOf=(pid,prj)=>+(S.rates[pid]?.[prj]||0);
export const totRate=pid=>sum(S.projects.filter(p=>!p.archived&&p.phase!=='제안'&&p.members.includes(pid)).map(p=>rateOf(pid,p.id)));
export const actRates=pid=>S.projects.filter(p=>!p.archived&&p.phase!=='제안'&&p.members.includes(pid)&&rateOf(pid,p.id)).map(p=>({p,r:rateOf(pid,p.id)}));
export const propRates=(pid,except)=>S.projects.filter(p=>p.phase==='제안'&&p.id!==except).flatMap(p=>p.parts.flatMap(q=>(q.prop?.years?.[0]?.staff||q.prop?.staff||[]).filter(s=>s.pid===pid).map(s=>({p,r:+s.rate||0}))));
export const monthly=(pid,prj)=>Math.round(costBase(pid)*rateOf(pid,prj)/100);
