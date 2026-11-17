// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { apvCur } from '../core/approval';
import { SRC_LABEL } from '../core/catalog';
import { docsFor, evState, isPending, keyOf } from '../core/evidence';
import { aiDocOk } from '../core/meeting';
import { person } from '../core/org';
import { S } from '../core/state';
import { ax, jn } from '../ui/jsx';
import { In, OxChip } from '../ui/primitives';

export function EvRowsFor({ e }: any) {
  return (
    <div className="evlist">
      {jn(
        docsFor(e).map((d, i) => {
          const tag = (
            <span
              className="row"
              style={{
                gap: '6px',
              }}
            >
              {d.n} <i className={`src ${d.src}`}>{SRC_LABEL[d.src]}</i>
              {d.kind === 'opt' ? <span className="chip">해당 시</span> : null}
            </span>
          );
          if (d.kind === 'exempt')
            return (
              <div className="evrow">
                <div className="nm">
                  {tag}
                  <small>{d.note}</small>
                </div>
                <div className="ctl">
                  <span className="chip">면제</span>
                </div>
              </div>
            );
          const s = evState(e, d);
          const k = keyOf(e, d);
          const made = S.made[k];
          const pend = isPending(e, d);
          const x = `${e.id}|${i}`;
          let acts: any = '';
          if (d.kind === 'opt' && s === 'N')
            acts = (
              <span className="tog" role="group" aria-label="해당 여부">
                <button type="button" className="N" data-a="setEv" data-x={`${x}|N`} aria-pressed="true">
                  해당없음
                </button>
                <button type="button" className="X" data-a="setEv" data-x={`${x}|X`} aria-pressed="false">
                  해당
                </button>
              </span>
            );
          else if (d.src === 'form' && made?.apprDoc)
            acts = (
              <>
                <span className="chip good">전자결재 문서</span>
                <button className="btn sm" data-a="apvOpen" data-x={made.apprDoc}>
                  결재 문서
                </button>
              </>
            );
          else if (d.src === 'form')
            acts = (
              <button className={`btn sm ${s === 'O' ? '' : 'primary'}`} data-a="editForm" data-x={x}>
                {s === 'O' ? '수정' : aiDocOk(d) ? 'AI로 작성' : '작성'}
              </button>
            );
          else if (d.src === 'approval') {
            const ap = S.appr.find((a) => a.id === made?.appr);
            const c = ap && apvCur(ap);
            acts =
              pend && ap ? (
                <>
                  <span className="chip warn">결재 중{c ? ' · ' + person(c.pid)?.name : ''}</span>
                  <button className="btn sm" data-a="apvOpen" data-x={ap.id}>
                    결재 문서 보기
                  </button>
                </>
              ) : s === 'O' ? (
                <>
                  <span className="chip good">결재 완료</span>
                  {ap ? (
                    <button className="btn sm" data-a="apvOpen" data-x={ap.id}>
                      결재 문서
                    </button>
                  ) : null}
                </>
              ) : ap?.status === '반려' ? (
                <>
                  <span className="chip bad" title={ap.line.find((l) => l.st === '반려')?.comment || ''}>
                    반려
                  </span>
                  <button className="btn sm primary" data-a="editForm" data-x={x}>
                    고쳐서 다시 요청
                  </button>
                </>
              ) : (
                <button className="btn sm primary" data-a="editForm" data-x={x}>
                  작성 후 결재 요청
                </button>
              );
          } else if (d.src === 'card') {
            const nr = S.receipts.filter((r) => r.st === 'new').length;
            acts = made?.receipt ? (
              <span className="chip good">앱 영수증 연결됨</span>
            ) : s === 'O' ? null : (
              <>
                <button className="btn sm primary" data-a="pickReceiptFor" data-x={x} {...ax(nr ? '' : 'disabled')}>
                  앱 영수증 연결{nr ? ` (${nr})` : ''}
                </button>
                <label className="btn sm filebtn">
                  사진 첨부
                  <In type="file" id={`evf-${e.id}-${i}`} accept="image/*,.pdf" data-a-change="pickEv" data-x={x} />
                </label>
              </>
            );
          } else {
            const fl = S.files[k];
            acts = (
              <>
                {fl ? <span className="fname">{fl.name}</span> : null}
                <label className="btn sm filebtn">
                  {fl ? '다시 첨부' : '파일 첨부'}
                  <In type="file" id={`evf-${e.id}-${i}`} data-a-change="pickEv" data-x={x} />
                </label>
              </>
            );
          }
          return (
            <div key={i} className="evrow">
              <div className="nm">
                {tag}
                <small>{d.note || ''}</small>
              </div>
              <div className="ctl">
                {acts}
                {<OxChip s={pend ? 'P' : s} label={''} />}
                {s === 'O' ? (
                  <>
                    <button className="btn sm" data-a="previewDoc" data-x={x}>
                      A4 보기
                    </button>
                    <button className="btn sm" data-a="dlDoc" data-x={x}>
                      PDF
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        }),
      )}
    </div>
  );
}
