// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { CAT, RX_AMT, RX_DATE, RX_HIDE, TODAY } from './catalog';
import { apvFormOf, docsFor, formDefaults, keyOf } from './evidence';
import { deptHead, expert, live, lvName, lvRank, me, orgCfg, part, person, personLv, proj, unitChain } from './org';
import { fdate, uid, won } from './util';

export function resolveSteps(org,steps,dr){const o=orgCfg(org);const chain=unitChain(o,dr.unit);const dRank=lvRank(o,dr.level);const res=[];
  steps.forEach(st=>{let p=null,why='';
    if(st.dept){const h=deptHead(org,st.dept,null);if(!h)why='부서에 사람이 없어요';else if(h.id===dr.id)why='기안자 본인이에요';else p=h}
    else{const r=lvRank(o,st.lv);if(r<0)why='없는 직위예요';else if(dRank>=0&&dRank<=r)why='기안자와 같거나 높은 직위예요';else{for(const u of chain){p=S.people.find(x=>x.org===org&&x.unit===u&&x.level===st.lv&&x.id!==dr.id&&!x.admin);if(p)break}if(!p)why='기안자 소속 라인에 해당하는 사람이 없어요'}}
    if(p&&res.some(x=>x.p?.id===p.id)){why='이미 결재선에 있어요';p=null}
    res.push({st,label:st.dept?`${st.dept} 부서장`:lvName(o,st.lv),p,why})});return res}
export function lineSteps(org,fid,amount){const o=orgCfg(org);const steps=[...((fid&&o.formLines[fid])||o.lineTpl)];o.amtRules.forEach(r=>{if(+amount>=+r.min&&r.lv)steps.push({lv:r.lv,type:'결재',amt:r.min})});return steps}
export function defaultLine(org,fid,amount,drafterId){const o=orgCfg(org);const ps=S.people.filter(p=>p.org===org);const dr=(drafterId&&person(drafterId))||(me()?.org===org?me():ps[0]);
  const L=[{pid:dr.id,type:'기안'}];resolveSteps(org,lineSteps(org,fid,amount),dr).forEach(x=>{if(x.p)L.push({pid:x.p.id,type:x.st.type==='합의'?'협조':x.st.type||'결재'})});
  if(L.length===1){const top=ps.filter(p=>p.id!==dr.id).sort((a,b)=>lvRank(o,a.level)-lvRank(o,b.level))[0];if(top)L.push({pid:top.id,type:'결재'})}return lineNorm(L)}
export function lineNorm(L){L.forEach(l=>{if(l.type==='합의')l.type='협조';if(!l.type)l.type='결재'});const seq=L.filter(l=>l.type!=='기안'&&l.type!=='협조');
  seq.forEach((l,i)=>{if(i<seq.length-1&&l.type==='결재')l.type='검토';if(i===seq.length-1)l.type='결재'});return L}
export function migrateLines(){(S.appr||[]).forEach(a=>{lineNorm(a.line);(a.log||[]).forEach(g=>{if(g.act==='합의')g.act='협조'})});Object.values(S.orgCfg||{}).forEach(o=>{[o.lineTpl,...Object.values(o.formLines||{})].forEach(st=>{if(st)lineNorm(st)})})}
export const stepsLabel=(o,steps)=>{const n=lineNorm(steps.map(x=>({type:x.type||'결재'})));return steps.map((x,i)=>(x.dept?`${x.dept} 부서장`:lvName(o,x.lv))+`(${n[i].type})`).join(' → ')};
export function apprLine(org){return defaultLine(org).map(l=>({role:l.type,name:person(l.pid)?.name}))}
export function apprLineOld(org){const ps=S.people.filter(p=>p.org===org);const head=ps.find(p=>/책임자/.test(p.role))||ps[0];const adm=ps.find(p=>/행정|관리자/.test(p.role))||ps[ps.length-1];
  return [{role:'기안',name:(me()||ps[0])?.name},{role:'검토',name:head?.name},{role:'승인',name:adm?.name}]}
export const apvCur=a=>a.status==='진행'?a.line.find(l=>l.type!=='기안'&&l.st==='대기'):null;
export const apvOrg=a=>person(a.drafter)?.org;
export const apvAttached=a=>Object.entries(S.made).filter(([k,m])=>m.apprDoc===a.id||(m.appr===a.id&&m.approved)).map(([k])=>{const i=k.indexOf('|');return{e:S.entries.find(x=>x.id===+k.slice(0,i)),n:k.slice(i+1)}}).filter(x=>x.e);
export const apprOf=(e,d)=>{const m=S.made[keyOf(e,d)];const ap=m&&S.appr.find(a=>a.id===(m.apprDoc||(m.approved&&m.appr)));return ap&&ap.status==='완료'?ap:null};
export function apvList(box){const id=me()?.id;return S.appr.filter(a=>apvOrg(a)===S.view).filter(a=>{
  if(box==='wait')return apvCur(a)?.pid===id;
  if(box==='upcoming')return a.status==='진행'&&a.line.some(l=>l.pid===id&&l.st==='예정');
  if(box==='ref')return a.status!=='임시'&&a.refs.includes(id);
  if(box==='draft')return a.drafter===id&&a.status!=='임시';
  if(box==='done')return a.line.some(l=>l.pid===id&&l.type!=='기안'&&['승인','반려'].includes(l.st));
  if(box==='temp')return a.drafter===id&&a.status==='임시';
  if(box==='rejected')return a.drafter===id&&a.status==='반려';
  return false}).sort((x,y)=>(y.date+y.id).localeCompare(x.date+x.id))}
export let apvSeq=40;
export function apvNo(org){return `${S.orgs[org].short}-2026-${String(++apvSeq).padStart(4,'0')}`}
export function apvLog(a,act,comment){a.log.push({pid:me()?.id,act,date:TODAY,comment:comment||''})}
export function seedAppr(){
  const P=id=>id;const mk=(o)=>({urgent:false,refs:[],files:[],link:null,log:[],...o});
  S.appr=[
    mk({id:'ap1',no:'새솔대-2026-0031',fid:'spend',form:'지출결의서',title:'연구B 산업용 조명 장비 유지보수비 지출',drafter:'p9',date:'2026-11-05',status:'진행',fields:[['지출 내역','조명 장비 정기 점검'],['금액','480,000원'],['지급처','비전테크']],body:'지출 사유\n야간 교대 이미지 품질 확보를 위한 조명 장비 정기 점검 비용입니다.',files:['견적서_비전테크.pdf'],
      line:[{pid:'p9',type:'기안',st:'승인',date:'2026-11-05'},{pid:'p1',type:'결재',st:'대기'},{pid:'p4',type:'결재',st:'예정'}],log:[{pid:'p9',act:'기안',date:'2026-11-05',comment:''}]}),
    mk({id:'ap3',no:'새솔대-2026-0028',fid:'trip',form:'출장계획서',title:'가온소재 파일럿 라인 방문 출장',drafter:'p2',date:'2026-10-24',status:'완료',fields:[['출장자','박도현, 김서윤'],['출장 기간','2026.10.28'],['출장지','가온소재 대전 공장'],['여비 산출','410,000원']],body:'출장 목적\n파일럿 라인 코팅 조건 시험 참관\n\n세부 일정\n10:00 도착 · 14:00 시험 참관',refs:['p3'],
      line:[{pid:'p2',type:'기안',st:'승인',date:'2026-10-24'},{pid:'p1',type:'결재',st:'승인',date:'2026-10-24',comment:'다녀오세요.'},{pid:'p4',type:'결재',st:'승인',date:'2026-10-25'}],log:[{pid:'p2',act:'기안',date:'2026-10-24'},{pid:'p1',act:'승인',date:'2026-10-24',comment:'다녀오세요.'},{pid:'p4',act:'승인',date:'2026-10-25'}]}),
    mk({id:'ap4',no:'새솔대-2026-0026',fid:'gen',form:'일반 품의서',title:'분석 장비 사용료 선결제 품의',drafter:'p3',date:'2026-10-21',status:'반려',fields:[],body:'외부 분석기관 장비 사용료 3개월분을 선결제하고자 합니다.',
      line:[{pid:'p3',type:'기안',st:'승인',date:'2026-10-21'},{pid:'p1',type:'결재',st:'반려',date:'2026-10-22',comment:'견적서를 두 곳 이상 받아 다시 올려 주세요.'},{pid:'p4',type:'결재',st:'예정'}],log:[{pid:'p3',act:'기안',date:'2026-10-21'},{pid:'p1',act:'반려',date:'2026-10-22',comment:'견적서를 두 곳 이상 받아 다시 올려 주세요.'}]}),
    mk({id:'ap5',no:'',fid:'coop',form:'업무협조',title:'연구실 보안 점검 협조 요청',drafter:'p1',date:'2026-11-06',status:'임시',fields:[['수신 부서','산학협력단'],['회신 기한','2026.11.20']],body:'연구실 보안 점검 일정 조율을 요청드립니다.',
      line:[{pid:'p1',type:'기안',st:'예정'},{pid:'p4',type:'결재',st:'예정'}],log:[]}),
    mk({id:'ap6',no:'새솔대-2026-0030',fid:'coop',form:'업무협조',title:'11월 연구비 집행 마감 안내',drafter:'p4',date:'2026-11-03',status:'완료',fields:[['수신 부서','전 연구실'],['회신 기한','-']],body:'11월 연구비 집행 마감은 11월 27일입니다. 증빙 미비 건을 먼저 정리해 주세요.',refs:['p1','p2','p9'],
      line:[{pid:'p4',type:'기안',st:'승인',date:'2026-11-03'},{pid:'p1',type:'협조',st:'승인',date:'2026-11-03'}],log:[{pid:'p4',act:'기안',date:'2026-11-03'},{pid:'p1',act:'합의',date:'2026-11-03'}]}),
  ];
  // 연구A 전문가활용비 내부결재: 증빙과 연결된 진행 문서
  const e=S.entries.find(x=>x.id===7);const d=docsFor(e).find(x=>x.src==='approval');const fm=formDefaults(e,d);
  S.appr.push(mk({id:'ap2',no:'새솔대-2026-0032',fid:'expert',form:'전문가 활용 품의',title:`${e.desc} 자문료 지급 품의`,drafter:'p1',date:'2026-11-06',status:'진행',fields:fm.rows,body:fm.body,link:{e:e.id,n:d.n},
    line:[{pid:'p1',type:'기안',st:'승인',date:'2026-11-06'},{pid:'p4',type:'결재',st:'대기'}],log:[{pid:'p1',act:'기안',date:'2026-11-06'}]}));
  S.made[keyOf(e,d)]={form:{title:'내부결재문서',rows:fm.rows,body:fm.body},pending:true,appr:'ap2'};
}
export function apvComplete(a){a.status='완료';
  if(a.rx&&!a.link&&!a.entry){const rx=a.rx;const p=proj(rx.proj);if(p){const org=apvOrg(a);const id=uid();const e={id,proj:p.id,org,item:rx.item,sub:rx.sub,date:rx.date||TODAY,desc:(rx.desc||'').trim()||a.title,vendor:'',amount:+rx.amount||0,fund:rx.fund||'현금',ev:{},att:[],exp:[],appr:a.id};
    docsFor(e).forEach(d=>{if(d.kind==='exempt')return;e.ev[d.n]=d.kind==='opt'?'N':'X'});S.entries.push(e);a.entry=id;
    const ds=docsFor(e).filter(d=>d.src==='approval');const ad=ds.find(d=>apvFormOf(d.n)===a.fid)||ds.find(d=>apvFormOf(d.n)==='exec'&&['exec','gen'].includes(a.fid))||(a.fid==='exec'?ds[0]:null);if(ad)a.link={e:id,n:ad.n};}}if(a.link){const e=S.entries.find(x=>x.id===a.link.e);const k=`${e.id}|${a.link.n}`;S.made[k]={...(S.made[k]||{}),pending:false,approved:TODAY,appr:a.id,line:a.line.map(l=>({pid:l.pid,role:l.type==='기안'?'기안':personLv(person(l.pid))||person(l.pid)?.role,name:person(l.pid)?.name,date:l.date}))};e.ev[a.link.n]='O'}}
export function apvReject(a){a.status='반려';if(a.link){const k=`${a.link.e}|${a.link.n}`;if(S.made[k]){S.made[k].pending=false}}}
export const rxProjs=()=>S.projects.filter(p=>live(p)&&p.phase!=='제안'&&part(p,S.view)?.status==='수락');
export const rxNew=()=>({proj:'',mode:'new',item:'연구활동비',sub:CAT['연구활동비'][0].s,amount:'',date:TODAY,desc:'',fund:'현금'});
export function rxSync(ed){const rx=ed.rx;const p=rx?.proj&&proj(rx.proj);const set=(keys,v)=>ed.fields.forEach(r=>{if(keys.includes(r[0]))r[1]=v});
  if(!p){set(RX_HIDE,'해당 없음 (회사 자체 품의)');return}
  set(['과제'],p.name);if(rx.mode==='link'){const e=ed.link&&S.entries.find(x=>x.id===+ed.link.split('|')[0]);if(e)set(['비목·세부유형'],`${e.item} / ${e.sub}`);return}
  set(['비목·세부유형'],`${rx.item} / ${rx.sub} (${rx.fund})`);if(+rx.amount)set(RX_AMT,won(+rx.amount));if(rx.date)set(RX_DATE,fdate(rx.date))}
