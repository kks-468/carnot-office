// 제안서 PDF에서 글자를 읽을 때 pdf.js를 필요할 때만 불러와요.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadPdfjs(): Promise<any> {
  const lib = await import('pdfjs-dist');
  lib.GlobalWorkerOptions.workerSrc = workerUrl;
  return lib;
}
