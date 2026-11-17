// 프로토타입에서 그대로 옮긴 로직이에요. 동작을 바꾸지 않으려고 원본 코드를 유지했어요.
// 타입은 화면을 모두 옮긴 뒤 모듈별로 차례로 붙여 나가요.
import { S, render } from './state';
import { loadPdfjs } from '../platform/pdf';
import { visible } from './org';
import { fmtNum } from './util';

export const NATIVE_VALUE=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
export function numify(root){root.querySelectorAll('input[type="number"]').forEach(el=>{el.type='text';el.inputMode='decimal';el.autocomplete='off';el.dataset.num='1';
  Object.defineProperty(el,'value',{configurable:true,get(){return NATIVE_VALUE.get.call(this).replace(/,/g,'')},set(v){NATIVE_VALUE.set.call(this,fmtNum(v))}});NATIVE_VALUE.set.call(el,fmtNum(el.getAttribute('value')))})}
export let toastT;export function toast(t){const e=document.getElementById('toast');e.textContent=t;e.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>e.hidden=true,3400)}
export const openModal=(k,extra={},defaults={})=>{S.modal={k,...extra};if(k==='entry'&&!('e_fund' in defaults))defaults.e_fund='현금';Object.assign(S.f,defaults);render()};
export const toTab=(tab,opts={})=>{S.modal=null;S.signup=null;S.menu='admin';S.tab=tab;S.mwiz=null;Object.assign(S,opts);S.newEntry=opts.newEntry??null;render();window.scrollTo(0,0)};
export const firstProject=()=>visible()[0];
export let DL=null;
export async function save(filename,data){if(DL)return DL.save({filename,data});const blob=data instanceof Blob?data:new Blob([data]);const url=URL.createObjectURL(blob);const el=document.createElement('a');el.href=url;el.download=filename;document.body.appendChild(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
export const dlErr=e=>e?.code==='nodl'?'이 화면에서는 파일 내려받기를 쓸 수 없어요. claude.ai에서 이 페이지를 열면 내려받을 수 있어요.':e?.code==='declined'?'내려받기를 취소했어요.':e?.message==='lib'?'PDF 도구를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.':'파일을 만들지 못했어요. 잠시 후 다시 시도해 주세요.';
export function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
export async function pdfText(file){
  const pdfjsLib=await loadPdfjs();
  const doc=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;const out=[];
  for(let i=1;i<=Math.min(doc.numPages,30);i++){const pg=await doc.getPage(i);const tc=await pg.getTextContent();let line='',lines=[],lastY=null;
    tc.items.forEach(it=>{const y=Math.round(it.transform[5]);if(lastY!==null&&Math.abs(y-lastY)>2){lines.push(line);line=''}line+=it.str;lastY=y});lines.push(line);out.push(lines.join('\n'))}
  const text=out.join('\n');const paras=[];let buf='';
  text.split('\n').forEach(l=>{const t=l.trim();if(!t){if(buf)paras.push(buf),buf='';return}buf+=(buf?' ':'')+t;if(/[.다]$/.test(t)&&buf.length>60){paras.push(buf);buf=''}});if(buf)paras.push(buf);
  return paras.filter(p=>p.length>20).join('\n\n');
}
