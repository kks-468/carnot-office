// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { actRates, propRates } from './budget';
import { ITEMS, TODAY } from './catalog';
import { isStudent, part, person } from './org';
import { costBase, payYears } from './pay';
import { addDays, addYear, sum } from './util';

export function propYearsOf(p){if(!p.pyears||!p.pyears.length){const n=Math.max(1,+p.nYears||1);const ys=[];let st=p.start||TODAY;for(let i=0;i<n;i++){const en=i===n-1?p.end:(addYear(st)>p.end?p.end:addYear(st));ys.push({no:i+1,start:st,end:en});st=addDays(en,1);if(st>p.end)break}p.pyears=ys;p.nYears=ys.length}return p.pyears}
export function propOf(q,n){const pr=q.prop||(q.prop={});if(!pr.years){const base={G:pr.G||0,share:pr.share||0,cashPct:pr.cashPct||0,ind:pr.ind||0,staff:pr.staff||[],items:pr.items||{}};['G','share','cashPct','ind','staff','items'].forEach(k=>delete pr[k]);pr.years=[base]}
  while(pr.years.length<n)pr.years.push(JSON.parse(JSON.stringify(pr.years[pr.years.length-1])));if(pr.years.length>n)pr.years.length=n;pr.years.forEach(y=>{y.staff=y.staff||[];y.items=y.items||{}});return pr}
export const yMonths=py=>Math.max(1,(+py.end.slice(0,4)*12+ +py.end.slice(5,7))-(+py.start.slice(0,4)*12+ +py.start.slice(5,7))+1);
export function propTotal(p,org){const n=propYearsOf(p).length;const cs=Array.from({length:n},(_,i)=>propCalc(p,org,i));const lab=c=>sum(c.rows.filter(r=>r.auto==='lab').map(r=>r.c+r.k));
  return{cs,T:sum(cs.map(c=>c.T)),G:sum(cs.map(c=>c.pr.G)),Bc:sum(cs.map(c=>c.Bc)),Bk:sum(cs.map(c=>c.Bk)),cashT:sum(cs.map(c=>c.cashT)),kindT:sum(cs.map(c=>c.kindT)),lab:sum(cs.map(lab)),ok:cs.every(c=>c.ok)}}
export function propPayYr(q,i,py){const pr=q.prop||{};const y=pr.years?.[i]||{};const ys=payYears();const y0=+String(py.start||TODAY).slice(0,4);
  const want=+y.payYr||(+pr.payBase?+pr.payBase+i:y0);const how=+y.payYr?'직접':+pr.payBase?'기준연도':'자동';
  if(ys.includes(want))return{yr:want,want,ok:true,how};const lo=ys.filter(v=>v<=want);return{yr:lo.length?Math.max(...lo):Math.min(...ys),want,ok:false,how}}
export function allocOf(p,org,i){const v=p.alloc?.[org]?.[i];return v==null?null:typeof v==='object'?v:{G:+v}}
export function propCalc(p,org,yi){
  const q=part(p,org);if(!q)return null;const ys=propYearsOf(p);const i=Math.max(0,Math.min(yi??(S.propYr>=0?S.propYr:0),ys.length-1));const py=ys[i];const pr=propOf(q,ys.length).years[i];const al=allocOf(p,org,i);if(al){if(al.G!=null)pr.G=+al.G;if(al.share!=null)pr.share=+al.share;if(al.cashPct!=null)pr.cashPct=+al.cashPct}
  const T=pr.share>=100?0:Math.round(pr.G/(1-pr.share/100)/1000)*1000;const B=Math.max(0,T-pr.G);const Bc=Math.round(B*pr.cashPct/100/1000)*1000;const Bk=B-Bc;
  const pyr=propPayYr(q,i,py);const yr=pyr.yr;
  const lab={'인건비':{c:0,k:0},'학생인건비':{c:0,k:0}};
  const st=pr.staff.map(s=>{const x=person(s.pid);const base=costBase(s.pid,yr);const amt=Math.round(base*s.rate/100*s.months/1000)*1000;const it=isStudent(x)?'학생인건비':'인건비';lab[it][s.fund==='현물'?'k':'c']+=amt;const act=actRates(s.pid);return{...s,x,base,amt,it,act,other:propRates(s.pid,p.id),left:Math.max(0,100-sum(act.map(a=>a.r)))}});
  const rows=ITEMS.map(i=>{if(lab[i])return{i,c:lab[i].c,k:lab[i].k,auto:'lab'};if(i==='간접비')return{i,c:0,k:0,auto:'ind'};const v=pr.items[i]||{};return{i,c:+v.c||0,k:+v.k||0}});
  const direct=sum(rows.filter(r=>r.i!=='간접비').map(r=>r.c));rows.find(r=>r.i==='간접비').c=Math.round(direct*pr.ind/100/1000)*1000;
  const C=sum(rows.map(r=>r.c)),K=sum(rows.map(r=>r.k));
  return{pr,T,B,Bc,Bk,cashT:pr.G+Bc,kindT:Bk,st,rows,C,K,yr,pyr,py,yi:i,n:ys.length,ok:T>0&&C===pr.G+Bc&&K===Bk};
}
export function alYear(p){const n=propYearsOf(p).length;const v=S.alY?.[p.id]??0;return Math.max(-1,Math.min(v,n-1))}
export function npYears(f){const n=Math.min(9,Math.max(1,+f.n_ny||1));const av=f._av||(f._av={});const out=[];
  for(let i=1;i<=n;i++){const ks=i===1?'n_ys':'n_s'+i,ke='n_e'+i;
    if(i>1){const d=out[i-2].end?addDays(out[i-2].end,1):'';if(!f[ks]||f[ks]===av[ks]){f[ks]=d;av[ks]=d}}
    const de=f[ks]?addYear(f[ks]):'';if(!f[ke]||f[ke]===av[ke]){f[ke]=de;av[ke]=de}out.push({no:i,start:f[ks],end:f[ke],ks,ke})}return out}
