// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { curY } from './budget';
import { PERF_KINDS, TODAY } from './catalog';
import { isLead, leadOrg, part, sortParts } from './org';
import { propYearsOf } from './proposal';
import { sum, ymDiff } from './util';

export const PK_UNIT=k=>(PERF_KINDS.find(x=>x[0]===k)||[,'건'])[1];
export const goalName=g=>g.kind==='기타'&&g.label?g.label:g.kind;
export function goalsOf(p){const gs=p.goals||(p.goals=[]);gs.forEach(g=>{if(!g.o){g.o={[leadOrg(p)]:{...(g.t||{})}};delete g.t}});return gs}
export function goalT(p,g,yno,org){const src=org?[g.o?.[org]||{}]:Object.values(g.o||{});return sum(src.map(m=>yno?(+m[yno]||0):sum(Object.values(m).map(Number))))}
export function perfYears(p){const base=p.phase==='제안'?propYearsOf(p):(p.years||[]);const n0=p.phase!=='제안'&&p.start&&p.end&&!p.endOpen?Math.min(9,Math.round(((+p.end.slice(0,4)-+p.start.slice(0,4))*12+(+p.end.slice(5,7)-+p.start.slice(5,7))+1)/12)):0;
  const keys=goalsOf(p).flatMap(g=>Object.values(g.o||{}).flatMap(m=>Object.keys(m).map(Number)));const mx=Math.max(base.length,n0,+p.nYears||0,...keys,1);return Array.from({length:mx},(_,i)=>base[i]||{no:i+1})}
export function outYear(p,o){const y=(p.years||[]).find(y=>y.start<=o.date&&o.date<=y.end);return y?y.no:(o.yno||curY(p)?.no||1)}
export function perfDone(p,g,yno,org){return sum((p.outputs||[]).filter(o=>o.kind===g.kind&&(g.kind!=='기타'||o.label===g.label)&&(!yno||outYear(p,o)===yno)&&(!org||o.org===org)).map(o=>+o.qty||1))}
/* 보기·수정 권한: 각 기관은 자기 기관만, 총괄기관은 모든 기관 */
export const perfOrgs=p=>p.consortium?(isLead(p)?sortParts(p.parts.filter(x=>x.status==='수락')).map(q=>q.org):[S.view]):[S.view];
export const canPerfOrg=(p,org)=>!p.archived&&(isLead(p)||(org===S.view&&part(p,S.view)?.status==='수락'));
export const canGoal=p=>!p.archived&&part(p,S.view)?.status==='수락';
export function perfSel(p){const os=perfOrgs(p);const v=S.pgOrg?.[p.id]??(isLead(p)&&p.consortium&&S.menu==='team'?'all':undefined);return v==='all'&&isLead(p)&&p.consortium?'all':os.includes(v)?v:S.view}
export function gStatus(t){const now=TODAY.slice(0,7);if(+t.prog>=100)return['완료',''];if(now<t.s)return['예정',''];const dur=ymDiff(t.s,t.e)+1;const exp=Math.min(1,(ymDiff(t.s,now)+0.5)/dur)*100;return +t.prog<exp-15?['지연','bad']:['정상','good']}
export function gYear(p){const ys=(p.years||[]);const cy=curY(p);const no=+(S.gY?.[p.id])||cy?.no||1;const y=ys.find(z=>z.no===no)||cy||ys[0];return y}
export function findInv(c){const code=String(c||'').trim().toUpperCase();if(!/^INV-/.test(code))return null;for(const p of S.projects){const v=(p.invites||[]).find(z=>z.code===code);if(v&&!p.archived)return{p,v}}return null}
export const invState=v=>v.used?'used':v.revoked?'revoked':TODAY>v.exp?'expired':'ok';
