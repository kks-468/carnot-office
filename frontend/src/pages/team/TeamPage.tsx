// 연구단 제안관리 · 연구단 연구관리: 과제 목록과 과제 상세 탭
import type { ReactNode } from 'react';
import { useS, S } from '../../core/state';
import { byTeam, isLead, joined, part, partLabel, sortParts } from '../../core/org';
import { periodOf, spentOf, totalBudget } from '../../core/budget';
import { propTotal } from '../../core/proposal';
import { fdate, pct, sum, won } from '../../core/util';
import { Btn, Meter } from '../../ui/primitives';
import { TeamChips } from '../../ui/TeamChips';
import { TeamBudget, TeamGantt, TeamGoalProp, TeamOrgs, TeamPerf, TeamPropCollect, TeamReport, TeamSched, TeamSum } from './TeamTabs';

export function TeamPage() {
  useS();
  const isProp = S.menu === 'teamProp';
  const ph = (p: any) => (p.phase === '제안') === isProp;
  const every = S.projects.filter((p: any) => joined(p, S.view) && !p.archived && p.consortium);
  const p = S.teamSel && every.find((x: any) => x.id === S.teamSel && ph(x));
  if (p) return <TeamDetail p={p} />;
  const all = every.filter(ph);
  const list = byTeam(all);
  const pend = S.projects.filter((x: any) => !x.archived && x.consortium && ph(x) && ['신청 중', '초대 중'].includes(part(x, S.view)?.status));
  return (
    <>
      <div className="page-head">
        <div>
          <h2>{isProp ? '연구단 제안관리' : '연구단 연구관리'}</h2>
          <p className="small muted">
            {isProp ? '제안 단계의 연구단 과제예요. 기관별 편성 총액과 성과 목표를 함께 맞추고, 선정되면 연구단 연구관리로 넘어가요.' : '수행 중인 연구단 과제예요. 기관별 예산·집행률·성과 같은 총괄 수치만 함께 보고, 회의비 같은 세부 집행은 각 기관만 봐요.'} 가입한 기관이 연구단 코드나 초대번호로 참여하고, 총괄기관이 승인하면 그 과제만 공유돼요.
          </p>
        </div>
        <Btn a="joinAsk" className="btn primary">
          참여 신청
        </Btn>
      </div>
      <TeamChips list={all} />
      {pend.map((x: any) => {
        const q = part(x, S.view);
        const L = x.parts.find((y: any) => y.role === '주관');
        return q.status === '초대 중' ? (
          <div className="notice row between" key={x.id}>
            <span>
              <b>{S.orgs[L.org].short}</b>에서 <b>{x.name}</b>에 초대했어요.
            </span>
            <Btn a="acceptInvite" x={x.id} className="btn primary sm">
              초대 수락
            </Btn>
          </div>
        ) : (
          <div className="notice" key={x.id}>
            <b>{x.name}</b>에 참여 신청을 보냈어요 ({q.tier || ''} · {q.role}). {S.orgs[L.org].short}의 승인을 기다리는 중이에요.
          </div>
        );
      })}
      {list.length ? null : isProp ? (
        <div className="notice">제안 중인 연구단 과제가 없어요. 연구제안 관리에서 연구단 과제로 제안을 만들면 여기에 떠요.</div>
      ) : (
        <div className="notice">수행 중인 연구단 과제가 없어요. 과제를 만들 때 ‘연구단 과제’를 고르거나, 단독 과제의 총괄관리에서 연구단 과제로 바꾸면 여기에 떠요. 다른 기관의 연구단에 들어가려면 ‘참여 신청’을 눌러 주세요.</div>
      )}
      <div className="cards">
        {list.map((x: any) => {
          const q = part(x, S.view);
          const ok = x.parts.filter((y: any) => y.status === '수락');
          const req = isLead(x) ? x.parts.filter((y: any) => y.status === '신청 중').length : 0;
          const pre = x.phase === '제안';
          const tot = pre ? sum(ok.map((y: any) => propTotal(x, y.org).T)) : totalBudget(x);
          const X = pre ? 0 : sum(ok.map((y: any) => spentOf(x, y.org)));
          return (
            <Btn key={x.id} a="teamOpen" x={x.id} className="pcard">
              <div className="row between">
                <span className={`chip ${pre ? 'warn' : 'good'}`}>{x.phase} 단계</span>
                {req ? <span className="chip bad">참여 신청 {req}건</span> : <span className="chip org">{partLabel(q)}</span>}
              </div>
              <h3>{x.name}</h3>
              <dl className="kv">
                <dt>부처명</dt>
                <dd>{x.ministry}</dd>
                <dt>연구기간</dt>
                <dd>{periodOf(x)}</dd>
                <dt>참여기관</dt>
                <dd>
                  {ok.length}곳 · {[...new Set(sortParts(ok).map((y: any) => y.tier || '총괄'))].join(', ')}
                </dd>
                <dt>{pre ? '제안 총액' : '당해 사업비'}</dt>
                <dd className="num">{won(tot)}</dd>
              </dl>
              {pre ? (
                <span className="small muted">제안 마감 {x.due ? fdate(x.due) : '-'}</span>
              ) : (
                <>
                  <Meter pct={Math.min(100, pct(X, tot))} />
                  <span className="small muted num">
                    연구단 집행률 {pct(X, tot)}% · {x.year}
                  </span>
                </>
              )}
            </Btn>
          );
        })}
      </div>
    </>
  );
}

const TAB_BODY: Record<string, (props: { p: any }) => ReactNode> = {
  sum: TeamSum,
  gantt: TeamGantt,
  perf: TeamPerf,
  sched: TeamSched,
  report: TeamReport,
  budget: TeamBudget,
  goal: TeamGoalProp,
  prop: TeamPropCollect,
  orgs: TeamOrgs,
};

function TeamDetail({ p }: { p: any }) {
  const lead = isLead(p);
  const q = part(p, S.view);
  const req = p.parts.filter((x: any) => x.status === '신청 중').length;
  const pre = p.phase === '제안';
  const TABS: [string, string][] = pre
    ? [
        ['budget', '사업비 편성'],
        ['goal', '성과 목표'],
        ['prop', '제안서 취합'],
        ['orgs', '참여기관'],
      ]
    : [
        ['sum', '사업비 현황'],
        ['gantt', '연구일정'],
        ['perf', '성과'],
        ['sched', '회의일정'],
        ['report', '연차별 보고서'],
        ['orgs', '참여기관'],
      ];
  let tab = S.teamTab;
  if (!TABS.some((x) => x[0] === tab)) tab = TABS[0][0];
  const Body = TAB_BODY[tab];
  return (
    <>
      <div className="apv-bar">
        <div className="row">
          <Btn a="teamBack" className="btn sm">
            ‹ {pre ? '연구단 제안관리' : '연구단 연구관리'}
          </Btn>
          <span className={`chip ${pre ? 'warn' : 'good'}`}>{p.phase} 단계</span>
          <span className="small muted">
            연구단 코드 <b className="num">{p.code}</b>
          </span>
        </div>
        <div className="row">
          {pre ? (
            <>
              <Btn a="propOpen" x={p.id}>
                연구제안 관리에서 편성
              </Btn>
              {lead ? (
                <Btn a="propGoAsk" x={`${p.id}|team`} className="btn primary">
                  선정 · 연구단 연구관리로 전환
                </Btn>
              ) : null}
            </>
          ) : (
            <Btn a="openProject" x={p.id}>
              우리 기관 연구행정으로
            </Btn>
          )}
        </div>
      </div>
      <div className="page-head">
        <div>
          <h2>{p.name}</h2>
          <p className="small muted">
            {p.ministry} · {fdate(p.start)}~{fdate(p.end)}
            {!pre && p.year ? ' · ' + p.year : ''} · 우리 기관 {partLabel(q)}
          </p>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map(([k, l]) => (
          <Btn key={k} a="teamTab" x={k} className={`btn sm ${tab === k ? 'primary' : ''}`} aria-pressed={tab === k}>
            {k === 'orgs' && lead && req ? `${l} (신청 ${req})` : l}
          </Btn>
        ))}
      </div>
      <Body p={p} />
    </>
  );
}
