import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { createRoot } from 'react-dom/client';
import './styles/app.css';
import App from './App';
import { boot } from './platform/boot';

// 증빙 ZIP·A4 PDF 코드가 전역 이름으로 찾는 라이브러리
Object.assign(window, { JSZip, html2canvas, jspdf: { jsPDF } });

boot().then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
});
