// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { hasBat } from './meeting';

export let nextId=100;let lastT=0;
// 시연(데모)에서는 101, 102…, 서버에 저장할 때는 여러 사람이 동시에 만들어도 겹치지 않게 시간+난수로 만들어요.
export const uid=()=>{if(S.demo!==false)return ++nextId;lastT=Math.max(lastT+1,Date.now()*1000+Math.floor(Math.random()*1000));return lastT};
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const won=n=>Math.round(n||0).toLocaleString('ko-KR')+'원';
export const eok=n=>Math.round(n||0).toLocaleString('ko-KR');
export const sum=a=>a.reduce((x,y)=>x+y,0);
export const pct=(a,b)=>b?Math.round(a/b*1000)/10:0;
export const fdate=d=>d?d.replaceAll('-','.'):'';
export const shortName=n=>{const ws=String(n).split(' ');let a='';for(const w of ws){if(a&&(a+' '+w).length>12)break;a=a?a+' '+w:w}return a.length<n.length?a+'…':a};
export const newCode=()=>{let c;do{c='CN-'+Math.random().toString(36).slice(2,6).toUpperCase()}while(S.projects.some(p=>p.code===c));return c};
export const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const addDays=(s,n)=>{const d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return ymd(d)};
export const addYear=s=>{const d=new Date(s+'T00:00:00');d.setFullYear(d.getFullYear()+1);d.setDate(d.getDate()-1);return ymd(d)};
export const fmtNo=v=>{const d=v.replace(/\D/g,'').slice(0,10);return d.length>5?`${d.slice(0,3)}-${d.slice(3,5)}-${d.slice(5)}`:d.length>3?`${d.slice(0,3)}-${d.slice(3)}`:d};
export const months=p=>{const[y,m]=p.ys.split('-').map(Number);return Array.from({length:12},(_,i)=>{const d=new Date(y,m-1+i,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`})};
export const short=n=>n.replace(/\(.*?\)/g,'').trim();
export const josa=(w,a,b)=>{const h=hasBat(w);return w+(h===null?`${a}(${b})`:h?a:b)};
export const qj=(w,a,b)=>{const h=hasBat(w);return `‘${w}’${h===null?`${a}(${b})`:h?a:b}`};
export const safe=s=>String(s).replace(/[\\/:*?"<>|]/g,'_').replace(/\s+/g,' ').trim();
export const pad=n=>String(n).padStart(2,'0');
export const ymAdd=(ym,n)=>{let y=+ym.slice(0,4),m=+ym.slice(5,7)-1+n;y+=Math.floor(m/12);m=((m%12)+12)%12;return `${y}-${String(m+1).padStart(2,'0')}`};
export const ymDiff=(a,b)=>(+b.slice(0,4)-+a.slice(0,4))*12+(+b.slice(5,7)-+a.slice(5,7));
export const fmtNum=v=>{const s=String(v??'').replace(/[^\d.]/g,'');if(!s)return '';const i=s.indexOf('.');const a=(i<0?s:s.slice(0,i)).replace(/^0+(?=\d)/,'');const b=i<0?null:s.slice(i+1).replace(/\./g,'');return a.replace(/\B(?=(\d{3})+(?!\d))/g,',')+(b===null?'':'.'+b)};
