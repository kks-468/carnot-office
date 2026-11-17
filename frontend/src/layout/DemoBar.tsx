// 시연용 상단 띠: 시연 순서 바로가기 + 보는 기관/사람 바꾸기 (실서비스에서는 숨겨요)
import { useS } from '../core/state';
import { me } from '../core/org';
import { Btn, In } from '../ui/primitives';

const STEPS: [string, string][] = [
  ['goSignup', '기관 가입'],
  ['goMeeting', '회의 예비 등록'],
  ['goComplete', 'AI 회의록'],
  ['goReceipt', '영수증 촬영'],
  ['goEvidence', '증빙 작성·결재'],
  ['goA4', '건별 A4 내려받기'],
  ['goPlan', '월별 계획표'],
  ['goApv', '전자결재'],
];

export function DemoBar() {
  const S = useS();
  if (!S.demo) return null;
  const m = me();
  return (
    <div className="demo">
      <b>프로토타입 · 가상 샘플 데이터</b>
      <ol className="path" aria-label="시연 순서">
        {STEPS.map(([a, l]) => (
          <li key={a}>
            <Btn a={a} className="">
              {l}
            </Btn>
          </li>
        ))}
      </ol>
      <div className="who-sw">
        <label className="viewas" htmlFor="viewas">
          보는 기관
          <In as="select" id="viewas" data-a-change="setView" value={S.view}>
            {Object.entries(S.orgs)
              .filter(([, o]: [string, any]) => !o.hidden)
              .map(([k, o]: [string, any]) => (
                <option key={k} value={k}>
                  {o.name}
                </option>
              ))}
          </In>
        </label>
        <label className="viewas" htmlFor="viewme">
          보는 사람
          <In as="select" id="viewme" data-a-change="setMe" value={m?.id || ''}>
            {S.people
              .filter((p: any) => p.org === S.view)
              .map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.role}
                </option>
              ))}
          </In>
        </label>
      </div>
    </div>
  );
}
