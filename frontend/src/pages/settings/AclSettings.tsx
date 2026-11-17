// 설정 → 열람 권한: 급여 정보와 연구비를 누가 볼 수 있는지 기관 관리자가 정해요.
import { S, useS } from '../../core/state';
import { ACL_DEFAULT, aclOf, allows, isOrgAdmin, ruleOf, type Rule } from '../../core/acl';
import { orgCfg, part } from '../../core/org';
import { Btn, In } from '../../ui/primitives';
import { UnitOptions } from '../../ui/UnitOptions';

const ownPeople = () => S.people.filter((x: any) => x.org === S.view);

/** 규칙을 한 줄로 */
export function ruleText(r: Rule, research = false): string {
  if (r.all) return '기관 전체';
  const o = orgCfg(S.view);
  const out: string[] = [];
  if (research && r.members) out.push('과제 참여 인력·관리팀');
  if (r.level) out.push(`${o?.levels.find((l: any) => l.k === r.level)?.n || r.level} 이상`);
  if (r.units?.length) out.push(r.units.join(', '));
  if (r.people?.length) out.push(r.people.map((id) => S.people.find((x: any) => x.id === id)?.name || '?').join(', '));
  return out.length ? '관리자 + ' + out.join(' · ') : '관리자만';
}

function Who({ rule, p }: { rule: Rule; p?: any }) {
  const ok = ownPeople().filter((u: any) => allows(rule, u, p));
  return (
    <p className="small muted" style={{ margin: '8px 0 0' }}>
      지금 볼 수 있는 사람 {ok.length}명: {ok.map((u: any) => u.name + (u.admin ? '(관리자)' : '')).join(', ') || '없음'}
    </p>
  );
}

/** 규칙 고치기 (기관 전체 · 과제 참여 인력 · 직위 이상 · 부서 · 사람) */
export function RuleEditor({ scope, research, p }: { scope: string; research?: boolean; p?: any }) {
  const r = ruleOf(scope);
  const o = orgCfg(S.view);
  const off = !isOrgAdmin();
  const tog = (f: 'all' | 'members', label: string, hint: string) => (
    <button type="button" className={`btn sm ${r[f] ? 'primary' : ''}`} data-a="aclToggle" data-x={`${scope}|${f}`} aria-pressed={!!r[f]} disabled={off} title={hint}>
      {r[f] ? '✓ ' : ''}
      {label}
    </button>
  );
  const chips = (f: 'units' | 'people', list: string[], name: (v: string) => string) =>
    list.map((v) => (
      <span key={v} className="pchip">
        {name(v)}
        {off ? null : (
          <button type="button" data-a="aclRm" data-x={`${scope}|${f}|${v}`} aria-label={`${name(v)} 빼기`}>
            ×
          </button>
        )}
      </span>
    ));
  return (
    <div className="aclrule">
      <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
        {tog('all', '기관 전체', '우리 기관 구성원 모두')}
        {research ? tog('members', '과제 참여 인력·관리팀', '그 과제의 참여 인력과 과제 관리팀(하위 부서 포함)') : null}
      </div>
      {r.all ? (
        <p className="small muted" style={{ margin: '8px 0 0' }}>
          우리 기관 구성원 모두 볼 수 있어요.
        </p>
      ) : (
        <div className="grid2" style={{ marginTop: 10 }}>
          <label className="field" htmlFor={`acl-lv-${scope}`}>
            <span>직위 이상</span>
            <In as="select" id={`acl-lv-${scope}`} data-a-change="aclLevel" data-x={scope} value={r.level || ''} disabled={off}>
              <option value="">사용 안 함</option>
              {o?.levels.map((l: any) => (
                <option key={l.k} value={l.k}>
                  {l.n} 이상
                </option>
              ))}
            </In>
          </label>
          <div className="field">
            <label htmlFor={`acl-u-${scope}`}>
              부서 <small>하위 부서 포함</small>
            </label>
            {off ? null : (
              <In as="select" id={`acl-u-${scope}`} data-a-change="aclAddUnit" data-x={scope} value="">
                <option value="">+ 부서 추가</option>
                <UnitOptions o={o} />
              </In>
            )}
            <div className="pchips">{r.units?.length ? chips('units', r.units, (v) => v) : <span className="small muted">없음</span>}</div>
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor={`acl-p-${scope}`}>직접 지정한 사람</label>
            {off ? null : (
              <In as="select" id={`acl-p-${scope}`} data-a-change="aclAddPerson" data-x={scope} value="">
                <option value="">+ 사람 추가</option>
                {ownPeople()
                  .filter((u: any) => !u.admin && !r.people?.includes(u.id))
                  .map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.unit || ''} · {u.role || ''}
                    </option>
                  ))}
              </In>
            )}
            <div className="pchips">{r.people?.length ? chips('people', r.people, (v) => S.people.find((x: any) => x.id === v)?.name || v) : <span className="small muted">없음</span>}</div>
          </div>
        </div>
      )}
      <Who rule={r} p={p} />
    </div>
  );
}

/** 급여 권한이 없어도 연구비를 볼 수 있는 과제에서는 인건비 계산용 급여를 보여 줄지 */
function PayForResearch() {
  const on = ruleOf('pay').forResearch !== false;
  return (
    <div className="notice" style={{ marginTop: 12 }}>
      <label className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
        <button type="button" className={`btn sm ${on ? 'primary' : ''}`} data-a="aclToggle" data-x="pay|forResearch" aria-pressed={on} disabled={!isOrgAdmin()}>
          {on ? '✓ 켬' : '끔'}
        </button>
        <span className="small">
          <b>연구비 열람자에게 인건비 계산용 급여 보이기</b>
          <br />
          켜 두면 급여 권한이 없어도, 연구비를 볼 수 있는 과제의 참여 인력 급여가 인건비(참여율)·연구제안 인건비 계산에 쓰여 보여요. 끄면 자기 급여만 보이고, 다른 사람의 급여·기준 인건비 칸은 가려지고 인건비가 0원으로 계산돼요.
        </span>
      </label>
    </div>
  );
}

export function AclSettings() {
  useS();
  const admin = isOrgAdmin();
  const acl = aclOf();
  const projects = S.projects.filter((p: any) => part(p, S.view)?.status === '수락' && !p.archived);
  const sel = projects.find((p: any) => p.id === S.aclSel && acl.projects?.[p.id]);
  return (
    <>
      <div className="page-head">
        <div>
          <h2>열람 권한</h2>
          <p className="small muted">
            급여 정보와 연구비를 누가 볼 수 있는지 정해요. 기관 관리자는 언제나 볼 수 있고, 권한이 없는 사람에게는 메뉴와 과제가 아예 보이지 않아요. 아래 조건 중 하나라도 맞으면 볼 수 있어요.
          </p>
        </div>
      </div>
      {admin ? null : <div className="notice warn">열람 권한은 기관 관리자만 바꿀 수 있어요. 지금 설정을 보여 드려요.</div>}

      <section className="card">
        <h3 className="h3">급여 정보</h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          직원·급여 메뉴(급여, 인상, 휴가)와 구성원별 급여액이에요. 처음에는 관리자만 볼 수 있어요.
        </p>
        <RuleEditor scope="pay" />
        <PayForResearch />
      </section>

      <section className="card">
        <h3 className="h3">연구비 · 기관 기본 범위</h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          연구제안·연구행정·연구단 과제에 똑같이 적용돼요. 과제마다 따로 정하지 않으면 이 범위를 따라요. 처음에는 과제 참여 인력과 관리팀이 볼 수 있어요.
        </p>
        <RuleEditor scope="research" research />
      </section>

      <section className="card">
        <h3 className="h3">연구비 · 과제별 범위</h3>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>과제</th>
                <th>단계</th>
                <th>범위</th>
                <th className="r">볼 수 있는 사람</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {projects.map((p: any) => {
                const own = acl.projects?.[p.id];
                const r = ruleOf('proj:' + p.id);
                const n = ownPeople().filter((u: any) => allows(r, u, p)).length;
                return (
                  <tr key={p.id} className={sel?.id === p.id ? 'on' : ''}>
                    <td>{p.name}</td>
                    <td>
                      <span className={`chip ${p.phase === '제안' ? 'warn' : 'good'}`}>{p.phase}</span>
                    </td>
                    <td className="small">{own ? <b>따로 정함 · {ruleText(own, true)}</b> : <span className="muted">기본값 · {ruleText(acl.research || ACL_DEFAULT.research, true)}</span>}</td>
                    <td className="r num">{n}명</td>
                    <td className="r" style={{ whiteSpace: 'nowrap' }}>
                      {own ? (
                        <>
                          <Btn a="aclPick" x={p.id} className="btn sm">
                            고치기
                          </Btn>{' '}
                          {admin ? (
                            <Btn a="aclProj" x={`${p.id}|0`} className="btn sm">
                              기본값으로
                            </Btn>
                          ) : null}
                        </>
                      ) : admin ? (
                        <Btn a="aclProj" x={`${p.id}|1`} className="btn sm">
                          따로 정하기
                        </Btn>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {projects.length ? null : (
                <tr>
                  <td colSpan={5} className="muted">
                    우리 기관이 참여하는 과제가 없어요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sel ? (
          <div style={{ marginTop: 12 }}>
            <h3 className="h3">{sel.name} 열람 범위</h3>
            <RuleEditor scope={'proj:' + sel.id} research p={sel} />
          </div>
        ) : null}
      </section>
    </>
  );
}
