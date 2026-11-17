// 과제 카드 목록 위의 "팀별 보기" 버튼
import { S } from '../core/state';

export function TeamChips({ list }: { list: any[] }) {
  const ts = [...new Set(list.map((p) => p.team).filter(Boolean))] as string[];
  if (S.teamF !== 'all' && !ts.includes(S.teamF)) ts.push(S.teamF);
  if (ts.length < 2 && S.teamF === 'all') return null;
  return (
    <div className="row teamf" role="group" aria-label="팀별 보기">
      <span className="small muted">팀별 보기</span>
      {['all', ...ts].map((t) => {
        const n = t === 'all' ? list.length : list.filter((p) => p.team === t).length;
        return (
          <button key={t} type="button" className={`btn sm ${S.teamF === t ? 'primary' : ''}`} data-a="teamF" data-x={t} aria-pressed={S.teamF === t}>
            {t === 'all' ? '전체' : t}{' '}
            <span className="num" style={{ opacity: 0.7 }}>
              {n}
            </span>
          </button>
        );
      })}
    </div>
  );
}
