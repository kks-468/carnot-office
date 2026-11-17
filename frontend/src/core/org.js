// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { lineNorm } from './approval';
import { LV_DEFAULT, PW_OK, TIERS, TODAY, UK_DEFAULT, XSHARE } from './catalog';

export const unitOpts=()=>{const u=(orgCfg(S.view).units||[]).map(x=>x.name);return u.length?u:[S.orgs[S.view].short]};
export const myUnit=()=>{const u=unitOpts();return u.includes(me()?.unit)?me().unit:u[0]};
export const teamOk=p=>S.teamF==='all'||p.team===S.teamF;
export const byTeam=l=>l.filter(teamOk);
export const roleName=q=>q.role==='주관'?'총괄주관':q.role;
export const partLabel=q=>q.role==='주관'?'총괄주관':`${q.tier||''} ${q.role}`.trim();
export const sortParts=ps=>[...ps].sort((a,b)=>TIERS.indexOf(a.tier||'총괄')-TIERS.indexOf(b.tier||'총괄')||['주관','세부주관','참여'].indexOf(a.role)-['주관','세부주관','참여'].indexOf(b.role));
export const part=(p,org)=>p?.parts.find(x=>x.org===org);
export const joined=(p,org)=>part(p,org)?.status==='수락';
export const visible=()=>S.projects.filter(p=>joined(p,S.view)&&!p.archived&&p.phase!=='제안');
export const live=p=>!!p&&joined(p,S.view)&&!p.archived&&p.phase!=='제안';
export const archivedList=()=>S.projects.filter(p=>joined(p,S.view)&&p.archived);
export const proj=id=>S.projects.find(p=>p.id===id);
export const person=id=>S.people.find(x=>x.id===id);
export const expert=id=>S.experts.find(x=>x.id===id);
/* 전문가 공유 범위: org=회사 전체 · team=팀(등록자 소속 부서와 그 하위) · me=나만 */
export const xCat=x=>{const sh=x.share||'org';return sh==='team'||sh==='unit'?'unit':sh};
export const xVal=x=>xCat(x)==='unit'?'unit:'+(x.unit||''):xCat(x);
/* 공유 범위 선택지: 회사 전체 → 내 소속 위계(본부·연구소·팀 …)를 위에서부터 → 나만 보기 */
export function xShareOpts(pid){const u=person(pid)||me();if(!u)return[['org','회사 전체 공유'],['me','나만 보기']];const o=orgCfg(u.org);const path=unitPath(o,u.unit).filter(z=>z.parent);
  return [['org','회사 전체 공유'],...path.map(z=>['unit:'+z.name,`${unitKind(z)||'부서'} 공유 · ${z.name}`]),['me','나만 보기']]}
export const xLabel=x=>{const c=xCat(x);if(c!=='unit')return XSHARE[c];const u=x.by&&person(x.by);const z=u&&orgCfg(u.org).units.find(v=>v.name===x.unit);return `${(z&&unitKind(z))||'부서'} · ${x.unit||''}`};
export const xApply=(x,v)=>{if(v.startsWith('unit:')){x.share='unit';x.unit=v.slice(5)}else x.share=v};
export function expVisible(x,pid){const u=pid?person(pid):me();if(!u)return false;if((x.xo||'sa')!==u.org)return false;const sh=x.share||'org';if(sh==='org'||u.admin||x.by===u.id)return true;if(sh==='team'||sh==='unit'){const o=orgCfg(u.org);return !!x.unit&&unitPath(o,u.unit).some(z=>z.name===x.unit)}return false}
export const visExp=()=>S.experts.filter(x=>expVisible(x));
export const canEditExp=x=>{const u=me();return !!u&&(x.xo||'sa')===u.org&&(u.admin||x.by===u.id||(!x.by&&(x.share||'org')==='org'))};
export const isLead=(p,org=S.view)=>part(p,org)?.role==='주관';
export const peopleOf=p=>p.members.map(person).filter(x=>x&&joined(p,x.org));
export const exemptOrg=o=>['대학','연구기관'].includes(o?.type);
export const forProfit=o=>o?.type==='기업';
export const me=()=>{const p=S.me&&S.people.find(x=>x.id===S.me);return p&&p.org===S.view?p:S.people.find(x=>x.org===S.view)};
export function orgCfg(org){const o=S.orgs[org];if(!o)return null;
  if(!o.levels)o.levels=LV_DEFAULT();
  if(!o.units){const names=[...new Set(S.people.filter(p=>p.org===org).map(p=>p.unit).filter(Boolean))];o.units=[{name:o.name,parent:''},...names.filter(n=>n!==o.name).map(n=>({name:n,parent:o.name}))]}
  S.people.filter(p=>p.org===org).forEach(p=>{if(!p.unit||!o.units.some(u=>u.name===p.unit))p.unit=p.unit||o.units[0].name;if(!p.unit||!o.units.some(u=>u.name===p.unit))o.units.push({name:p.unit,parent:o.units[0].name});if(!o.levels.some(l=>l.k===p.level))p.level=/책임자|관리자|팀장/.test(p.role||'')?(o.levels[o.levels.length-2]||o.levels[0]).k:o.levels[o.levels.length-1].k});
  if(!o.lineTpl)o.lineTpl=o.levels.slice(0,-1).reverse().map(l=>({lv:l.k,type:'결재'}));
  o.formLines=o.formLines||{};o.amtRules=o.amtRules||[];[o.lineTpl,...Object.values(o.formLines)].forEach(st=>{if(Array.isArray(st))lineNorm(st)});return o}
export const lvRank=(o,k)=>o.levels.findIndex(l=>l.k===k);
export const lvName=(o,k)=>o.levels.find(l=>l.k===k)?.n||'';
export const personLv=p=>{if(!p)return'';const o=orgCfg(p.org);return o?lvName(o,p.level):''};
export function unitChain(o,u){const out=[];let cur=u;while(cur&&!out.includes(cur)){out.push(cur);cur=o.units.find(x=>x.name===cur)?.parent||''}return out}
export function deptHead(org,u,excl){const o=orgCfg(org);const uu=o.units.find(x=>x.name===u);const hp=uu?.head&&S.people.find(p=>p.id===uu.head&&p.org===org);if(hp&&hp.id!==excl)return hp;return S.people.filter(p=>p.org===org&&p.unit===u&&p.id!==excl&&!p.admin).sort((a,b)=>lvRank(o,a.level)-lvRank(o,b.level))[0]}
export const ukinds=o=>o.unitKinds||(o.unitKinds=[...UK_DEFAULT]);
export const unitKind=u=>u.kind||(!u.parent?'기관':null)||(!u.parent?'기관':/본부$/.test(u.name)?'본부':/팀$/.test(u.name)?'팀':/연구실$/.test(u.name)?'연구실':/센터$/.test(u.name)?'센터':'팀');
export const ukRank=(o,k)=>k==='기관'?-1:(ukinds(o).indexOf(k)<0?99:ukinds(o).indexOf(k));
export function unitOrder(o){const root=o.units.find(u=>!u.parent);const out=[];const walk=(n,d)=>{const u=o.units.find(x=>x.name===n);if(!u||out.some(z=>z.u===u))return;out.push({u,d});o.units.filter(x=>x.parent===n).forEach(c=>walk(c.name,d+1))};if(root)walk(root.name,0);o.units.forEach(u=>{if(!out.some(z=>z.u===u))out.push({u,d:1})});return out}
export function memberKinds(o){return ukinds(o).filter(k=>o.units.some(u=>u.parent&&unitKind(u)===k))}
export const leadOrg=p=>p.parts.find(q=>q.role==='주관')?.org||S.view;
/* 목표는 기관별로 저장해요: g.o[org][차년도] = 수치 */
export function unitPath(o,name){const out=[];const seen=new Set();let u=o.units.find(x=>x.name===name);while(u&&!seen.has(u)){seen.add(u);out.unshift(u);u=u.parent?o.units.find(x=>x.name===u.parent):null}return out}
export const isStudent=x=>/대학원생|학부/.test(x?.role||'');
export const orgColor=(p,org)=>{const i=sortParts(p.parts.filter(x=>x.status==='수락')).findIndex(q=>q.org===org);return `var(--s${(i<0?0:i)%8+1})`};
export function stLine(ctx){const o=orgCfg(S.view);return ctx==='def'?o.lineTpl:o.formLines[ctx.slice(2)]}
export function doLogin(pid){const p=person(pid);if(!p)return;S.auth={pid,at:TODAY};S.view=p.org;S.me=pid;S.openTabs=null;S.teamF='all';S.teamSel=null;S.propSel=null;S.libSel=null;S.menu='home';S.tab='overview';S.sub='cards';S.f={};S.modal=null;S.signup=null;render();window.scrollTo(0,0)}
export const pwRule=v=>`<span class="pwrule ${!v?'':PW_OK(v)?'ok':'bad'}">영문과 숫자를 섞어 8자 이상${v?(PW_OK(v)?' ✓':' · 아직 부족해요'):''}</span>`;
