// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { A, CHANGE } from './actions';
import { defaultLine, rxNew } from './approval';
import { allocText, curY, planOf, subPlanOf, totRate, yLabel, yearOf } from './budget';
import { AFORMS, CAT, ITEMS, SRC_LABEL, TODAY } from './catalog';
import { attSync } from './evidence';
import { pkObj, planRows } from './meeting';
import { canEditExp, expert, isLead, me, orgCfg, part, peopleOf, person, proj, stLine, ukRank, ukinds, unitChain, unitKind, unitPath, xApply, xLabel } from './org';
import { gradesOf, insOf, payParts } from './pay';
import { canPerfOrg, goalsOf } from './perf';
import { sealOf } from './print';
import { allocOf, propCalc, propOf, propYearsOf } from './proposal';
import { NATIVE_VALUE, toast } from './runtime';
import { addDays, fdate, fmtNo, fmtNum, months, sum, won } from './util';

/** 화면 전체에 위임 이벤트를 달아요 (data-a 버튼, data-b 입력 등). 앱 시작 때 한 번 호출해요. */
export function installEvents(){
document.addEventListener('input',e=>{const el=e.target;if(!el.dataset||el.dataset.num!=='1')return;const raw=NATIVE_VALUE.get.call(el);const pos=el.selectionStart??raw.length;const before=raw.slice(0,pos).replace(/[^\d.]/g,'').length;const f=fmtNum(raw);if(f===raw)return;NATIVE_VALUE.set.call(el,f);let i=0,c=0;while(i<f.length&&c<before){if(/[\d.]/.test(f[i]))c++;i++}try{el.setSelectionRange(i,i)}catch(_){}},true);
(()=>{let drawing=false,last=null;const pt=(c,e)=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*c.width/r.width,(e.clientY-r.top)*c.height/r.height]};
  document.addEventListener('pointerdown',e=>{const c=e.target;if(c.id!=='sigpad')return;drawing=true;last=pt(c,e);c.setPointerCapture?.(e.pointerId);e.preventDefault()});
  document.addEventListener('pointermove',e=>{if(!drawing)return;const c=document.getElementById('sigpad');if(!c){drawing=false;return}const p=pt(c,e);const x=c.getContext('2d');x.strokeStyle='#14206B';x.lineWidth=6;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(...last);x.lineTo(...p);x.stroke();last=p;window.__sigInk=true});
  document.addEventListener('pointerup',()=>{drawing=false});})();
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t)return;if(t.dataset.self&&e.target!==t)return;if(!S.auth&&/^go/.test(t.dataset.a)&&!['goSignup','goActivate','goFindPw'].includes(t.dataset.a)){const p=me();S.auth={pid:p.id,at:TODAY};S.me=p.id}const fn=A[t.dataset.a];if(fn){if(t.tagName!=='INPUT')e.preventDefault();fn(t.dataset.x)}});
document.addEventListener('submit',e=>{e.preventDefault();const a=e.target.dataset.submit;if(a&&A[a])A[a]()});
document.addEventListener('input',e=>{
  const t=e.target,d=t.dataset;
  if(d.b){S.f[d.b]=t.type==='checkbox'?t.checked:t.value;if((S.modal?.k==='project'||S.modal?.k==='budget')&&(d.b==='n_total'||d.b.startsWith('b_')||d.b.startsWith('k_'))){const ps=document.getElementById('allocSum');const f=S.f,total=+f.n_total||0,ac=sum(ITEMS.map(i=>+f['b_'+i]||0)),ak=sum(ITEMS.map(i=>+f['k_'+i]||0)),al=ac+ak;if(ps){ps.textContent=allocText(ac,ak,total);ps.className='small num '+(!total||al===total?'muted':'err')}const fb=document.querySelector('[data-a="fillRatio"]');if(fb)fb.disabled=!total}}
  if(d.w){S.mwiz[d.w]=t.value;if(S.mwiz.confirm){S.mwiz.confirm=false;const c=document.getElementById('w-confirm');if(c)c.checked=false}}
  if(d.no){t.value=fmtNo(t.value);S.f[d.no]=t.value}
  if(d.limit){S.orgs[S.view].limit=+t.value||0}
  if(d.ffadd!==undefined)return;
  if(d.ff!==undefined){if(d.ff==='body')S.f.form.body=t.value;else S.f.form.rows[+d.ff][1]=t.value}
  if(d.cap&&['date','amount','vendor'].includes(d.cap))S.cap[d.cap]=t.value;
  if(d.fma)AFORMS.find(x=>x.id===S.fm.sel)[d.fma]=t.value;
  if(d.fmi!==undefined)AFORMS.find(x=>x.id===S.fm.sel).fields[+d.fmi]=t.value;
  if(d.tpa)S.TPL.find(x=>x.key===S.fm.tsel)[d.tpa]=t.value;
  if(d.tpr){const[i,j]=d.tpr.split('|').map(Number);S.TPL.find(x=>x.key===S.fm.tsel).rows[i][j]=t.value}
  if(d.fc)S[d.fc]=t.value;
  if(d.fcseal){S.docSeal=t.checked;render();return}
  if(d.sealtext){sealOf(S.view).text=t.value.trim()||sealOf(S.view).text;render();return}
  if(d.ae&&d.ae!=='urgent'&&d.ae!=='link'){if(d.ae==='q'){S.apv.q=t.value;const pos=t.selectionStart;render();const n=document.getElementById('apvq');if(n){n.focus();n.setSelectionRange(pos,pos)}}else if(d.ae==='comment'){S.apv.comment=t.value;S.apv.err=''}else S.apv.edit[d.ae]=t.value}
  if(d.aef!==undefined&&S.apv.edit)S.apv.edit.fields[+d.aef][1]=t.value;
});
document.addEventListener('change',e=>{
  {const t0=e.target,d0=t0.dataset||{};if(d0.ffatt&&t0.value){const fm=S.f.form;if(d0.ffatt==='in'){const p=person(t0.value);fm.inn.push({id:p.id,name:p.name})}else{const x=expert(t0.value);fm.ext.push({id:x.id,name:x.name})}attSync(fm);render();return}if(d0.ffadd!==undefined)return}
  const t=e.target,d=t.dataset;
  if(d.aChange&&CHANGE[d.aChange])return CHANGE[d.aChange](e);
  if(d.pp){const pp=proj(S.propSel);const c0=propCalc(pp,S.view);const pr=c0.pr;let v=Math.max(0,+t.value||0);if(d.pp!=='G')v=Math.min(d.pp==='share'?95:100,v);if(['G','share','cashPct'].includes(d.pp)&&allocOf(pp,S.view,c0.yi)){if(!isLead(pp))return;pp.alloc[S.view][c0.yi]={...allocOf(pp,S.view,c0.yi),[d.pp]:v}}pr[d.pp]=v;render();return}
  if(d.ppi){const[i,k]=d.ppi.split('|');const pr=propCalc(proj(S.propSel),S.view).pr;(pr.items[i]=pr.items[i]||{})[k]=Math.max(0,+t.value||0);render();return}
  if(d.pps){const[i,k]=d.pps.split('|');const st=propCalc(proj(S.propSel),S.view).pr.staff[+i];st[k]=k==='fund'?t.value:Math.max(k==='months'?1:0,Math.min(k==='rate'?100:12,+t.value||0));render();return}
  if(d.gy){S.gY=S.gY||{};S.gY[d.gy]=t.value;render();return}
  if(d.gt){const[pid,tid]=d.gt.split('|');const p=proj(pid);const tk=p.tasks.find(z=>String(z.id)===tid);if(tk&&canPerfOrg(p,tk.org)){tk.prog=Math.max(0,Math.min(100,+t.value||0));render()}return}
  if(d.gm){const[pid,mid,k]=d.gm.split('|');const p=proj(pid);const mm=p.miles.find(z=>String(z.id)===mid);if(mm&&canPerfOrg(p,mm.org)){mm[k]=t.value;render()}return}
  if(d.gmemo){const p=proj(d.gmemo);if(isLead(p)){p.sMemo=t.value;toast('메모를 저장했어요.')}return}
  if(d.pal){const[pid,org,i,fk]=d.pal.split('|');const p=proj(pid);if(!isLead(p))return;let v=Math.max(0,+t.value||0);if(org==='_T'){(p.govT=p.govT||{})[i]=Math.round(v)}else{const c0=propCalc(p,org,+i);const cur=allocOf(p,org,+i)||{G:c0.pr.G,share:c0.pr.share,cashPct:c0.pr.cashPct};if(fk==='share')v=Math.min(95,v);else if(fk==='cashPct')v=Math.min(100,v);else v=Math.round(v);((p.alloc=p.alloc||{})[org]=p.alloc[org]||{})[i]={...cur,[fk||'G']:v}}render();return}
  if(d.imf){S.imf=t.value;render();return}
  if(d.pby){const[pid,k]=d.pby.split('|');S.pbY=S.pbY||{};S.pbY[pid]={...(S.pbY[pid]||{}),[k]:t.value};render();return}
  if(d.pg){const[pid,gid,y,org]=d.pg.split('|');const p=proj(pid);if(!canPerfOrg(p,org))return;const g=goalsOf(p).find(z=>z.id===gid);(g.o[org]=g.o[org]||{})[y]=Math.max(0,Math.round(+t.value||0));render();return}
  if(d.ppb){const q=part(proj(d.ppb),S.view);const pr=q.prop||(q.prop={});pr.payBase=t.value?+t.value:null;render();toast(t.value?`1차년도 ${t.value}년, 2차년도 ${+t.value+1}년… 순서로 급여표를 연결했어요.`:'차년도 시작 연도의 급여표를 자동으로 써요.');return}
  if(d.pyp){const[pid,i]=d.pyp.split('|');const p=proj(pid);const q=part(p,S.view);const pr=propOf(q,propYearsOf(p).length);pr.years[+i].payYr=t.value?+t.value:null;render();return}
  if(d.ppadd){if(!t.value)return;propCalc(proj(S.propSel),S.view).pr.staff.push({pid:t.value,rate:Math.min(20,Math.max(0,100-totRate(t.value))),months:12,fund:'현금'});render();return}
  if(d.mp){const[i,k]=d.mp.split('|');const p=proj(S.tab);const r=planRows(p,curY(p).no)[+i];if(!r)return;r[k]=k==='m1'||k==='m2'?Math.max(1,Math.min(12,+t.value||1)):t.value;if(r.m2<r.m1)r.m2=r.m1;render();return}
  if(d.pn){const p=proj(d.pn);p.nYears=+t.value;p.pyears=null;propYearsOf(p);if(S.propYr>=p.nYears)S.propYr=p.nYears-1;render();toast(`총 ${p.nYears}차년도로 바꿨어요. 늘어난 연차는 마지막 연차 값을 복사해 뒀어요.`);return}
  if(d.pyd){const[pid,i,k]=d.pyd.split('|');const p=proj(pid);const ys=propYearsOf(p);const y=ys[+i];if(!t.value)return;if((k==='start'&&t.value>y.end)||(k==='end'&&t.value<y.start)){toast('시작일은 종료일보다 빨라야 해요.');render();return}y[k]=t.value;if(k==='end'&&ys[+i+1]&&ys[+i+1].start<=t.value)ys[+i+1].start=addDays(t.value,1);render();return}
  if(d.yd){const[pid,no,k]=d.yd.split('|');const p=proj(pid);const y=yearOf(p,no);if(!y||!t.value)return;const nv=t.value;if((k==='start'&&nv>y.end)||(k==='end'&&nv<y.start)){toast('시작일은 종료일보다 빨라야 해요.');render();return}y[k]=nv;if(y.no===p.cur){p.year=yLabel(y);p.ys=y.start.slice(0,7)}render();toast(`${y.no}차년도 기간을 바꿨어요.`);return}
  if(d.rk){const[pid,prj]=d.rk.split('|');(S.rkind[pid]=S.rkind[pid]||{})[prj]=t.value;render();return}
  if(d.pg!==undefined){const yr=S.payYear;S.pgrade[yr]=S.pgrade[yr]||{};if(t.value)S.pgrade[yr][d.pg]=+t.value;else{const q=payParts(d.pg,yr);delete S.pgrade[yr][d.pg];S.pay[yr]=S.pay[yr]||{};S.payFree[yr]=S.payFree[yr]||{};if(!S.pay[yr][d.pg]){S.pay[yr][d.pg]=q.tax;S.payFree[yr][d.pg]=q.free}}render();toast(t.value?`${person(d.pg).name}님을 ${t.value}등급으로 정했어요. 급여가 등급표와 연동돼요.`:`${person(d.pg).name}님 급여를 직접 입력으로 바꿨어요.`);return}
  if(d.payf){(S.payFree[S.payYear]=S.payFree[S.payYear]||{})[d.payf]=Math.max(0,+t.value||0);render();return}
  if(d.gr){const[i,k]=d.gr.split('|');const g=gradesOf(S.view,S.payYear)[+i];if(!g)return;if(k==='name')g.name=t.value.trim();else{const v=Math.max(0,+t.value||0);if(k==='no'){const old=g.no;if(gradesOf(S.view,S.payYear).some(x=>x!==g&&+x.no===v)){toast('같은 등급 번호가 있어요.');render();return}Object.keys(S.pgrade[S.payYear]||{}).forEach(pid=>{if(+S.pgrade[S.payYear][pid]===+old)S.pgrade[S.payYear][pid]=v});g.no=v}else g[k]=v}render();return}
  if(d.pay){(S.pay[S.payYear]=S.pay[S.payYear]||{})[d.pay]=Math.max(0,+t.value||0);render();return}
  if(d.pflag){const[pid,k]=d.pflag.split('|');person(pid)[k]=!t.checked;render();return}
  if(d.ins){insOf(S.view,S.payYear)[d.ins]=Math.max(0,+t.value||0);render();return}
  if(d.tier){const[pid,org]=d.tier.split('|');part(proj(pid),org).tier=t.value;render();return}
  if(d.prole){const[pid,org]=d.prole.split('|');part(proj(pid),org).role=t.value;render();return}
  if(d.labadd){const v=t.value;if(!v)return;const p=proj(d.labadd);p.members.push(v);(S.rates[v]=S.rates[v]||{})[p.id]=0;p.history=p.history||[];p.history.unshift(`${fdate(TODAY)} ${person(v).name} 합류`);render();toast(`${person(v).name}님을 참여 인원에 넣었어요. 참여율을 입력해 주세요.`);return}
  if(d.sal){S.salary[d.sal]=Math.max(0,+t.value||0);render();return}
  if(d.xsh){const x=expert(d.xsh);if(!x||!canEditExp(x))return;if(!x.by)x.by=me().id;xApply(x,t.value);render();toast(`${x.name}님 공유 범위를 ‘${xLabel(x)}’(으)로 바꿨어요.`);return}
  if(d.xg){const x=S.experts.find(y=>y.id===d.xg);x.group=t.value;render();toast(`${x.name}님을 ${t.value} 그룹으로 옮겼어요.`);return}
  if(d.xgn!==undefined){const i=+d.xgn;const old=S.expGroups[i];const nw=t.value.trim();if(!nw||nw===old)return;S.expGroups[i]=nw;S.experts.forEach(e=>{if(e.group===old)e.group=nw});setTimeout(render,0);return}
  if(d.rate){const[pid,prj]=d.rate.split('|');(S.rates[pid]=S.rates[pid]||{})[prj]=Math.max(0,+t.value||0);render();return}
  if(d.fma||d.fmi!==undefined||d.tpa||d.tpr||d.fc){setTimeout(render,0);return}
  if(d.stt){const[ctx,i]=d.stt.split('|');const v=t.value;const st=stLine(ctx)[+i];delete st.lv;delete st.dept;if(v.startsWith('lv:'))st.lv=v.slice(3);else st.dept=v.slice(5);render();return}
  if(d.sty){const[ctx,i]=d.sty.split('|');stLine(ctx)[+i].type=t.value;render();return}
  if(d.stadd){const v=t.value;if(!v)return;stLine(d.stadd).push(v.startsWith('lv:')?{lv:v.slice(3),type:'결재'}:{dept:v.slice(5),type:'결재'});render();return}
  if(d.puk){const [pid,k]=d.puk.split('|');const p=person(pid);const o=orgCfg(p.org);if(t.value)p.unit=t.value;else{const r=ukRank(o,k);const anc=[...unitPath(o,p.unit)].reverse().find(u=>!u.parent||ukRank(o,unitKind(u))<r);p.unit=anc?.name||p.unit}render();toast(`${p.name}님 소속을 ${unitPath(o,p.unit).slice(1).map(u=>u.name).join(' › ')||p.unit}(으)로 바꿨어요.`);return}
  if(d.pu){person(d.pu).unit=t.value;render();toast(`${person(d.pu).name}님의 부서를 바꿨어요.`);return}
  if(d.pl){person(d.pl).level=t.value;render();toast(`${person(d.pl).name}님의 직위를 바꿨어요.`);return}
  if(d.lvn!==undefined){orgCfg(S.view).levels[+d.lvn].n=t.value.trim()||'이름 없음';setTimeout(render,0);return}
  if(d.un!==undefined){const o=orgCfg(S.view);const u=o.units[+d.un];const old=u.name;const nw=t.value.trim();if(!nw||nw===old)return;if(o.units.some(x=>x!==u&&x.name===nw)){toast('같은 이름의 부서가 있어요.');render();return}u.name=nw;S.projects.forEach(p=>{if(p.team===old)p.team=nw});o.units.forEach(c=>{if(c.parent===old)c.parent=nw});S.people.forEach(p=>{if(p.org===S.view&&p.unit===old)p.unit=nw});const fix=st=>st.forEach(z=>{if(z.dept===old)z.dept=nw});fix(o.lineTpl);Object.values(o.formLines).forEach(fix);if(old===o.name){}setTimeout(render,0);return}
  if(d.ukn!==undefined){const o=orgCfg(S.view);const a=ukinds(o);const old=a[+d.ukn];const nv=t.value.trim();if(!nv||nv===old)return;if(a.includes(nv)){toast('이미 있는 단위예요.');render();return}a[+d.ukn]=nv;o.units.forEach(u=>{if(u.kind===old||(!u.kind&&unitKind(u)===old))u.kind=nv});render();toast(`단위 이름을 ${nv}(으)로 바꿨어요.`);return}
  if(d.uk!==undefined){const o=orgCfg(S.view);o.units[+d.uk].kind=t.value;render();toast('부서 유형을 바꿨어요.');return}
  if(d.uh!==undefined){const o=orgCfg(S.view);const u=o.units[+d.uh];if(t.value)u.head=t.value;else delete u.head;render();toast(t.value?`${person(t.value).name}님을 ${u.name} 부서장으로 정했어요.`:`${u.name} 부서장을 자동으로 정해요.`);return}
  if(d.hire){person(d.hire).hire=t.value;render();toast(`${person(d.hire).name}님의 입사일을 바꿨어요.`);return}
  if(d.ladj){const yr=S.leaveYr||+TODAY.slice(0,4);(S.leaveAdj[yr]=S.leaveAdj[yr]||{})[d.ladj]=+String(t.value).replace(/[^\d.-]/g,'')||0;render();return}
  if(d.cuf){S.cuf=t.value;render();return}
  if(d.up!==undefined){const o=orgCfg(S.view);const u=o.units[+d.up];if(unitChain(o,t.value).includes(u.name)){toast('하위 부서를 상위 부서로 지정할 수 없어요.');render();return}u.parent=t.value;render();return}
  if(d.lsown){const o=orgCfg(S.view);if(t.checked)o.formLines[d.lsown]=o.lineTpl.map(l=>({...l}));else delete o.formLines[d.lsown];render();return}
  if(d.lrmin!==undefined){S.orgs[S.view].amtRules[+d.lrmin].min=+t.value||0;setTimeout(render,0);return}
  if(d.lrlv!==undefined){orgCfg(S.view).amtRules[+d.lrlv].lv=t.value;render();return}
  if(d.sim){S.ls[d.sim]=t.value;setTimeout(render,0);return}
  if(d.fmuse){AFORMS.find(x=>x.id===S.fm.sel).use=t.checked;render();return}
  if(d.fcsign){S.docSign=t.checked;render();return}
  if(d.cats){const[si,di]=d.cats.split('|').map(Number);const r=CAT[S.fm.item][si].d[di];const n=typeof r==='string'?r:r.n;S.srcOv[n]=t.value;render();toast(`${n}의 출처를 ‘${SRC_LABEL[t.value]}’(으)로 바꿨어요.`);return}
  if(d.catn){const[si,di]=d.catn.split('|').map(Number);const arr=CAT[S.fm.item][si].d;const r=arr[di];const old=typeof r==='string'?r:r.n;const nw=t.value.trim();if(!nw||nw===old)return;
    if(typeof r==='string')arr[di]=nw;else r.n=nw;if(S.srcOv[old]){S.srcOv[nw]=S.srcOv[old];delete S.srcOv[old]}
    S.entries.forEach(e=>{if(e.ev&&old in e.ev){e.ev[nw]=e.ev[old];delete e.ev[old]}const k=`${e.id}|${old}`;if(S.made[k]){S.made[`${e.id}|${nw}`]=S.made[k];delete S.made[k]}if(S.files[k]){S.files[`${e.id}|${nw}`]=S.files[k];delete S.files[k]}});
    setTimeout(render,0);toast(`서류 이름을 ‘${nw}’(으)로 바꿨어요.`);return}
  if(d.ae==='urgent'){S.apv.edit.urgent=t.checked;return}
  if(d.ae==='link'){S.apv.edit.link=t.value;const ed=S.apv.edit;if(t.value){const[id,...rest]=t.value.split('|');const e=S.entries.find(x=>x.id===+id);if(!ed.title.trim())ed.title=`${proj(e.proj).short} ${e.desc} 집행 품의`;const fd=ed.fields.find(r=>r[0]==='과제');if(fd)fd[1]=proj(e.proj).name;const fs=ed.fields.find(r=>r[0]==='비목·세부유형');if(fs)fs[1]=`${e.item} / ${e.sub}`;const fa=ed.fields.find(r=>r[0]==='집행 금액'||r[0]==='자문료'||r[0]==='금액');if(fa)fa[1]=won(e.amount);const nl=defaultLine(S.view,ed.fid,e.amount);const added=nl.filter(l=>!ed.line.some(x=>x.pid===l.pid));if(added.length){added.forEach(l=>ed.line.push({...l}));toast(`금액 기준에 따라 ${added.map(l=>person(l.pid)?.name).join(', ')}님을 결재선에 추가했어요.`)}}render();return}
  if(d.rx&&S.apv.edit){const ed=S.apv.edit;const rx=ed.rx||(ed.rx=rxNew());rx[d.rx]=t.value;if(d.rx==='item')rx.sub=CAT[rx.item]?.[0]?.s||'';if(d.rx==='proj'){rx.mode=['exec','gen'].includes(ed.fid)?'new':'link';ed.link='';const p=proj(t.value);if(p&&!ed.title.trim())ed.title=`${p.short} ${rx.sub} 집행 품의`}render();return}
  if(d.aetype!==undefined){S.apv.edit.line[+d.aetype].type=t.value;render();return}
  if(d.aeadd){if(t.value){const L=S.apv.edit.line;const last=[...L].reverse().find(l=>l.type==='결재');if(last)last.type='검토';L.push({pid:t.value,type:'결재'});render()}return}
  if(d.aeref){if(t.value){S.apv.edit.refs.push(t.value);render()}return}
  if(d.pick){const[pk,k]=d.pick.split('|');const v=t.value;if(!v)return;const[o,ka,ke]=pkObj[pk]();const key=k==='att'?ka:ke;const add=v.startsWith('team:')?v.slice(5).split(','):[v];o[key]=[...new Set([...(o[key]||[]),...add])];if(S.mwiz)S.mwiz.err='';render();const el=document.getElementById(t.id);if(el)el.focus();return}
  if(d.addsub){const[pid,item]=d.addsub.split('|');const v=t.value;if(!v)return;const sp=subPlanOf(proj(pid));(sp[item]=sp[item]||{})[v]=Array(12).fill(0);render();toast(`${item}에 ${v}을(를) 추가했어요. 월별 금액을 입력해 주세요.`);return}
  if(d.splan){const[pid,item,sub,k]=d.splan.split('|');subPlanOf(proj(pid))[item][sub][+k]=Math.max(0,Math.round(+t.value||0));render();return}
  if(d.plan){const[pid,item,k]=d.plan.split('|');planOf(proj(pid))[item][+k]=Math.max(0,Math.round(+t.value||0));render();return}
  if(d.cap&&['proj','item','sub','meeting'].includes(d.cap)){S.cap[d.cap]=t.value;if(d.cap==='item')S.cap.sub=CAT[t.value][0].s;if(d.cap!=='meeting')S.cap.meeting='';render();return}
  if(d.r){if(d.b==='e_item')S.f.e_sub=CAT[S.f.e_item][0].s;if(d.b==='e_sub')S.f.e_meeting='';if(d.b==='a_item')S.f.a_sub=CAT[S.f.a_item][0].s;if(d.b==='h_item')S.f.h_sub=CAT[S.f.h_item][0].s;if(d.b==='a_item'||d.b==='a_sub'||d.b==='a_proj')S.f.a_meeting='';
    if(d.b==='m_proj'){const ids=new Set(peopleOf(proj(S.f.m_proj)).map(x=>x.id));S.f.m_att=(S.f.m_att||[]).filter(i=>ids.has(i))}
    if(S.mwiz&&d.b==='w_doc')S.mwiz.confirm=false;render()}
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.dataset?.ffadd){e.preventDefault();A.ffAttAdd(e.target.dataset.ffadd);return}if(e.key==='Escape'&&S.modal){S.modal=null;render()}if(e.key==='Enter'&&!S.auth&&!S.signup&&/^f-l_/.test(e.target.id||'')){e.preventDefault();A.login()}});
}
