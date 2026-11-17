// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { A } from './actions';
import { PK_UNIT, goalsOf } from './perf';
import { propOf, propYearsOf, yMonths } from './proposal';
import { uid } from './util';

export function seedPerf(){const G=(kind,t,o2)=>({id:'g'+uid(),kind,unit:PK_UNIT(kind),t,...(o2?{o2}:{})});
  const A=S.projects.find(p=>p.id==='A');if(A&&!A.goals){A.goals=[G('논문(SCI)',{1:1,2:2,3:2}),G('특허 출원',{1:1,2:1,3:2}),G('특허 등록',{2:1,3:1}),G('SW 등록',{2:1}),G('시제품 제작',{3:1}),G('기술이전',{3:1})];
    const o2=A.parts.find(q=>q.role!=='주관'&&q.status==='수락')?.org||'sa';goalsOf(A);A.goals.forEach(g=>{if(g.kind==='특허 출원'){g.o.sa={1:1,2:1,3:1};g.o[o2]={2:1,3:1}}if(g.kind==='시제품 제작'){g.o[o2]={3:1};delete g.o.sa}});
    A.outputs=[{id:uid(),kind:'논문(SCI)',title:'고내열 세라믹 코팅 분리막의 열수축 특성 연구',date:'2026-03-12',org:'sa',qty:1,note:'Journal of Membrane Science'},{id:uid(),kind:'특허 출원',title:'세라믹 코팅 분리막 및 그 제조방법',date:'2026-06-20',org:o2,qty:1,note:'10-2026-0081234'},{id:uid(),kind:'논문(SCI)',title:'바인더 조성에 따른 코팅층 접착력 평가',date:'2026-10-28',org:'sa',qty:1,note:'게재 확정'}]}
  const B=S.projects.find(p=>p.id==='B');if(B&&!B.goals){B.goals=[G('논문(비SCI)',{1:1,2:1}),G('SW 등록',{1:1,2:1}),G('특허 출원',{2:1}),G('사업화 매출',{2:300})];B.outputs=[{id:uid(),kind:'SW 등록',title:'조립 라인 불량 이미지 라벨링 도구 v1.0',date:'2026-09-15',org:'sa',qty:1,note:'C-2026-031245'}]}
  const D=S.projects.find(p=>p.id==='D');if(D&&!D.goals){D.goals=[G('논문(SCI)',{1:1,2:2}),G('특허 출원',{1:1,2:1}),G('SW 등록',{2:1}),G('기술이전',{2:1})];D.outputs=[]}
}
export function seedPropYears(){const D=S.projects.find(p=>p.id==='D');if(!D)return;const ys=propYearsOf(D);D.parts.forEach(q=>{if(!q.prop)return;const pr=propOf(q,ys.length);pr.years.forEach((y,i)=>{const mo=yMonths(ys[i]);y.staff.forEach(st=>st.months=mo);if(i===ys.length-1)y.G=Math.round(y.G*0.75/1000000)*1000000})})}
