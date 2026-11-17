// 프로토타입 화면을 React 컴포넌트로 옮겼어요. 버튼·입력은 data-* 속성으로 core/actions의 A와 연결돼요.
import { apprLine } from '../core/approval';
import { allocText, curY, fundBudget, inY, yLabel } from '../core/budget';
import { ABSENT, AFORMS, CAT, CK, CONS_OPTS, DEF_T, ITEMS, ONEDAY, PERF_KINDS, SRC_LABEL, TIMED, TODAY } from '../core/catalog';
import { ATT_EX, ATT_IN, docsFor, evSum, subOf } from '../core/evidence';
import { aiDocOk, attNames, conflictText, conflictsFor, dayConflicts, dayText, entryCtx, expTitle, mLabel, mStatus, monthLine, peopleNames, pickOpts } from '../core/meeting';
import { joined, me, orgCfg, part, peopleOf, person, proj, sortParts, unitOpts, visExp, visible, xShareOpts } from '../core/org';
import { canPerfOrg, findInv, gYear, invState, perfOrgs, perfYears } from '../core/perf';
import { a4Html } from '../core/print';
import { npYears, propCalc, propTotal, propYearsOf } from '../core/proposal';
import { S } from '../core/state';
import { addDays, eok, fdate, short, sum, won, ymAdd } from '../core/util';
import { curWeek, wRange, wrPrev } from '../core/work';
import { EvRowsFor } from './EvRows';
import { SrcPicker } from '../pages/admin/MeetPages';
import { PropTable } from '../pages/proposal/PropParts';
import { MinFld, Picker } from '../ui/Picker';
import { Raw, ax, jb, jn } from '../ui/jsx';
import { Field, In, OxSummary } from '../ui/primitives';

export function ModalHost() {
  const m = S.modal;
  if (!m) return null;
  const f = S.f;
  let t: any = '',
    b: any = '',
    act: any = '',
    wide = false;
  if (m.k === 'project') {
    t = '새 과제 등록';
    act = 'saveProject';
    b = (
      <>
        {
          <Field
            label={'과제 유형'}
            name={'n_cons'}
            {...{
              options: CONS_OPTS,
              r: 1,
            }}
          />
        }
        <p
          className="small muted"
          style={{
            margin: '-6px 0 4px',
          }}
        >
          {consHint(f.n_cons)}
        </p>
        <div className="field">
          <span>사업 구분</span>
          <div className="seg" role="group" aria-label="사업 구분">
            {jn(
              ['연구', '용역'].map((k, _i) => (
                <button key={_i} type="button" data-a="nKind" data-x={k} aria-pressed={(f.n_kind || '연구') === k}>
                  {k} 과제
                </button>
              )),
            )}
          </div>
        </div>
        {
          <Field
            label={'사업명'}
            name={'n_name'}
            {...{
              ph: '예: 고효율 수전해 촉매 개발',
            }}
          />
        }
        <div className="grid2">
          {<MinFld name={'n_min'} />}
          {
            <Field
              label={'관리팀 (조직도)'}
              name={'n_team'}
              {...{
                options: unitOpts(),
              }}
            />
          }
        </div>
        {<NewProjYears f={f} />}
        <p className="small muted">
          전체 차년도의 연구 시작일·종료일을 미리 넣어 두면 연차를 마감할 때 다음 차년도 기간이 자동으로 이어져요. 1차년도 시작일을 바꾸면 손대지 않은 칸은 따라서 바뀌어요. 비목별 예산은 과제를 만든
          뒤 총괄관리의 ‘예산 편성’에서 넣어요.
        </p>
      </>
    );
  }
  if (m.k === 'budget') {
    const p = proj(m.id);
    const total = +f.n_total || 0;
    const ac = sum(ITEMS.map((i) => +f['b_' + i] || 0)),
      ak = sum(ITEMS.map((i) => +f['k_' + i] || 0)),
      al = ac + ak;
    const cy = curY(p);
    t = `예산 편성 · ${p.short}${cy ? ' ' + cy.no + '차년도' : ''}`;
    act = 'saveBudget';
    wide = true;
    b = (
      <>
        <p className="small muted">
          {S.orgs[S.view].name}의 {cy ? yLabel(cy) : '당해'} 비목별 예산이에요. 협약서·사업계획서 금액을 현금과 현물로 나눠 넣어 주세요. 현물은 기관부담 중 기존 인력 인건비, 보유 장비 활용 등이에요.
        </p>
        <div className="grid2">
          {
            <Field
              label={'당해 사업비(원) · 선택'}
              name={'n_total'}
              {...{
                type: 'number',
              }}
            />
          }
          <div
            className="field"
            style={{
              alignSelf: 'end',
            }}
          >
            <button type="button" className="btn" data-a="fillRatio" {...ax(total ? '' : 'disabled')}>
              현금을 예시 비율로 채우기
            </button>
          </div>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>비목</th>
                <th className="r">현금(원)</th>
                <th className="r">현물(원)</th>
              </tr>
            </thead>
            <tbody>
              {jn(
                ITEMS.map((i, _i) => (
                  <tr key={_i}>
                    <td>{i}</td>
                    {jn(
                      ['b', 'k'].map((x, _i) => (
                        <td key={_i} className="r">
                          <label>
                            <span hidden>
                              {i} {x === 'b' ? '현금' : '현물'}
                            </span>
                            <In
                              id={`f-${x}_${i}`}
                              type="number"
                              data-b={`${x}_${i}`}
                              value={f[x + '_' + i] || ''}
                              style={{
                                width: '150px',
                                textAlign: 'right',
                              }}
                              step="1000000"
                            />
                          </label>
                        </td>
                      )),
                    )}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
        <p
          id="allocSum"
          className={`small ${!total || al === total ? 'muted' : 'err'} num`}
          style={{
            marginTop: '8px',
          }}
        >
          {allocText(ac, ak, total)}
        </p>
      </>
    );
  }
  if (m.k === 'yearClose') {
    const p = proj(m.id);
    const cy = curY(p);
    const es = S.entries.filter((e) => e.proj === p.id && inY(e, cy));
    const miss = es.filter((e) => !evSum(e).ok);
    const pend = S.appr.filter((a) => a.status === '진행' && a.link && es.some((e) => e.id === a.link.e));
    const nx = p.years.find((z) => z.no === cy.no + 1);
    const warns = [
      [TODAY < cy.end, `연차 기간이 ${fdate(cy.end)}까지 남아 있어요. 미리 마감하면 그 뒤 집행은 다음 연차로 잡혀요`],
      [miss.length, `증빙이 미비한 집행 ${miss.length}건`],
      [pend.length, `진행 중인 결재 ${pend.length}건`],
    ].filter((x) => x[0]);
    t = `${cy.no}차년도 마감`;
    b = (
      <>
        <p>
          <b>{p.name}</b>
        </p>
        <dl
          className="kv"
          style={{
            gridTemplateColumns: '90px 1fr',
            fontSize: '13.5px',
          }}
        >
          <dt>마감 연차</dt>
          <dd className="num">{yLabel(cy)}</dd>
          <dt>다음 연차</dt>
          <dd className="num">
            {cy.no + 1}차년도
            {nx?.plan ? (
              <>
                {' '}
                <span className="chip info">제안 편성 예산 있음</span>
              </>
            ) : null}
          </dd>
        </dl>
        <div className="grid2">
          {
            <Field
              label={`${cy.no + 1}차년도 시작일`}
              name={'yc_ns'}
              {...{
                type: 'date',
              }}
            />
          }
          {
            <Field
              label={`${cy.no + 1}차년도 종료일`}
              name={'yc_ne'}
              {...{
                type: 'date',
              }}
            />
          }
        </div>
        <dl
          className="kv"
          style={{
            display: 'none',
          }}
        />
        <div className="stats">
          <div>
            <span>집행</span>
            <strong>{es.length}건</strong>
          </div>
          <div>
            <span>집행액</span>
            <strong>{won(sum(es.map((e) => e.amount)))}</strong>
          </div>
          <div className={miss.length ? 'bad' : ''}>
            <span>증빙 미비</span>
            <strong>{miss.length}건</strong>
          </div>
        </div>
        {warns.length ? (
          <div className="notice warn">
            <b>마감 전에 확인해 주세요.</b>
            <ul
              style={{
                margin: '6px 0 0',
                paddingLeft: '18px',
              }}
            >
              {jn(warns.map((w, _i) => <li key={_i}>{w[1]}</li>))}
            </ul>
            <p
              className="small"
              style={{
                marginTop: '6px',
              }}
            >
              그대로 마감해도 자료실에서 열람·내려받기는 돼요. 다만 RCMS 정산 전에 채워 두는 게 좋아요.
            </p>
          </div>
        ) : (
          <div className="notice good">증빙과 결재가 모두 정리됐어요.</div>
        )}
        <ul
          className="small"
          style={{
            paddingLeft: '18px',
            margin: '8px 0',
          }}
        >
          <li>{cy.no}차년도 예산·월별 계획·집행·증빙이 자료실 ‘연차 정산 자료’로 묶여요.</li>
          <li>
            {nx?.plan
              ? `${cy.no + 1}차년도 예산은 제안 때 편성한 금액으로 채워져요. 협약 금액과 다르면 총괄관리에서 고쳐 주세요.`
              : `${cy.no + 1}차년도는 예산이 비어 있는 상태로 시작해요. 총괄관리에서 예산을 편성해 주세요.`}
          </li>
          <li>참여연구원·회의 일정·전문가는 그대로 이어져요.</li>
        </ul>
        <label className="check" htmlFor="yc-ok">
          <In id="yc-ok" type="checkbox" data-b="yc_ok" {...ax(f.yc_ok ? 'checked' : '')} />
          <span>
            {cy.no}차년도를 마감하고 {cy.no + 1}차년도를 시작해요.
          </span>
        </label>{' '}
        {m.err ? (
          <p className="err" role="alert">
            {m.err}
          </p>
        ) : null}
        <div className="row">
          <button className="btn" data-a="closeModal">
            취소
          </button>
          <button className="btn primary" data-a="yearDo" data-x={p.id}>
            마감하고 다음 연차 시작
          </button>
        </div>
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={false} />;
  }
  if (m.k === 'wr') {
    t = m.id ? '업무보고 수정' : `업무보고 쓰기 · ${fdate(curWeek())} 주간`;
    act = 'saveWr';
    wide = true;
    const myp = S.projects.filter((p) => joined(p, S.view) && !p.archived);
    const p = f.wr_proj && f.wr_proj !== '_etc' ? proj(f.wr_proj) : null;
    if (f.wr_proj !== f._wrp) {
      f._wrp = f.wr_proj;
      f.wr_mem = p ? p.wrMem || '' : f.wr_mem || '';
    }
    const probe = {
      by: m.id ? S.reports.find((r) => r.id === m.id).by : me().id,
      week: m.id ? S.reports.find((r) => r.id === m.id).week : curWeek(),
      proj: p ? p.id : '',
      title: p ? '' : f.wr_title || '',
    };
    const pv = wrPrev(probe);
    b = (
      <>
        {
          <Field
            label={'프로젝트'}
            name={'wr_proj'}
            {...{
              options: [...myp.map((x) => [x.id, `${x.name}${x.phase === '제안' ? ' (제안)' : ''}`]), ['_etc', '기타 업무 (직접 입력)']],
              r: 1,
            }}
          />
        }{' '}
        {p ? null : (
          <Field
            label={'업무명'}
            name={'wr_title'}
            {...{
              ph: '예: 회계·인사 업무',
              r: 1,
            }}
          />
        )}
        <div className="grid2">
          <div className="field">
            <span>지난주 ({wRange(addDays(probe.week, -7))})</span>
            {pv ? (
              <>
                <div className="wr-prev">{pv.next || '-'}</div>
                <small>지난주에 쓴 금주 계획을 그대로 가져왔어요.</small>
              </>
            ) : (
              <In as="textarea" id="f-wr_last" data-b="wr_last" rows={6} placeholder="지난주에 쓴 업무보고가 없어요. 필요하면 직접 써 주세요." value={f.wr_last || ''} />
            )}
          </div>
          {
            <Field
              label={`금주 계획 (${wRange(probe.week)})`}
              name={'wr_next'}
              {...{
                area: 6,
                ph: '- 한 줄에 하나씩 써요',
              }}
            />
          }
        </div>
        {
          <Field
            label={'주요 내용 (선택)'}
            name={'wr_note'}
            {...{
              ph: '예: 11/13 연차보고서 제출',
            }}
          />
        }{' '}
        {
          <Field
            label={'구성원'}
            name={'wr_mem'}
            {...{
              ph: '예: PM: 김서윤 / 참여: 박도현',
              hint: p ? '과제에 한 번 저장하면 다음부터 모두에게 자동으로 채워져요.' : '',
            }}
          />
        }
        <p className="small muted">
          {me().name}({me().login || ''}) 이름으로 저장되고 회사 전체에 보여요.
        </p>
      </>
    );
  }
  if (m.k === 'cev') {
    if (f._ck !== f.ce_kind) {
      f._ck = f.ce_kind;
      const d = DEF_T[f.ce_kind];
      f.ce_time = d ? d[0] : '';
      f.ce_time2 = d ? d[1] : '';
    }
    t = '회사일정 등록';
    act = 'saveCev';
    const adm = !!me()?.admin;
    const half = ONEDAY.includes(f.ce_kind);
    const oneDay = half;
    b = (
      <>
        <div className="grid2">
          {
            <Field
              label={'종류'}
              name={'ce_kind'}
              {...{
                options: CK.map((x) => x[0]),
                r: 1,
              }}
            />
          }
          {adm ? (
            <Field
              label={'대상 (관리자)'}
              name={'ce_pid'}
              {...{
                options: S.people.filter((p) => p.org === S.view && !p.admin).map((p) => [p.id, `${p.name} · ${p.unit || ''}`]),
              }}
            />
          ) : (
            <div className="field">
              <span>대상</span>
              <div
                className="wr-prev"
                style={{
                  minHeight: 0,
                  padding: '7px 10px',
                }}
              >
                {me().name} · {me().unit || ''}
              </div>
              <small>로그인한 본인 일정으로 등록돼요.</small>
            </div>
          )}
        </div>
        <div className="grid2">
          {
            <Field
              label={oneDay ? '날짜' : '시작일'}
              name={'ce_start'}
              {...{
                type: 'date',
              }}
            />
          }
          {oneDay ? null : (
            <Field
              label={'종료일'}
              name={'ce_end'}
              {...{
                type: 'date',
                hint: '하루면 비워 두세요',
              }}
            />
          )}
        </div>
        {TIMED.includes(f.ce_kind) ? (
          <div className="grid2">
            {
              <Field
                label={half ? '시작 시간' : '시작 시간 (선택)'}
                name={'ce_time'}
                {...{
                  type: 'time',
                }}
              />
            }
            {
              <Field
                label={half ? '끝 시간' : '끝 시간 (선택)'}
                name={'ce_time2'}
                {...{
                  type: 'time',
                }}
              />
            }
          </div>
        ) : null}{' '}
        {f.ce_kind === '기타' ? (
          <Field
            label={'종류 직접 입력'}
            name={'ce_label'}
            {...{
              ph: '예: 건강검진, 재택, 예비군',
            }}
          />
        ) : null}{' '}
        {
          <Field
            label={f.ce_kind === '출장' ? '출장지·목적' : f.ce_kind === '외출' ? '사유 (선택)' : '내용'}
            name={'ce_title'}
            {...{
              ph: f.ce_kind === '출장' ? '예: 가온소재 대전 공장 점검' : f.ce_kind === '외출' ? '예: 병원' : '예: 주간 업무 회의',
            }}
          />
        }{' '}
        {ABSENT.includes(f.ce_kind) ? <p className="small muted">부재 일정은 홈과 회사일정의 ‘오늘 부재’에 표시되고, 연차·반차는 직원·급여 → 연차관리에 자동으로 반영돼요.</p> : null}
      </>
    );
  }
  if (m.k === 'notice') {
    t = '공지 쓰기';
    act = 'saveNotice';
    b = (
      <>
        {<Field label={'제목'} name={'no_title'} />}
        {
          <Field
            label={'내용'}
            name={'no_body'}
            {...{
              area: 8,
            }}
          />
        }
        <label className="check" htmlFor="f-no_pin">
          <In id="f-no_pin" type="checkbox" data-b="no_pin" {...ax(f.no_pin ? 'checked' : '')} />
          <span>필독으로 맨 위에 고정</span>
        </label>
      </>
    );
  }
  if (m.k === 'noticeView') {
    const n = S.notices.find((x) => x.id === m.id);
    t = n.title;
    b = (
      <>
        <p className="small muted">
          {fdate(n.date)} · {person(n.by)?.name || ''}
          {n.pin ? (
            <>
              · <span className="chip bad">필독</span>
            </>
          ) : null}
        </p>
        <div
          style={{
            whiteSpace: 'pre-line',
            lineHeight: '1.7',
          }}
        >
          {n.body}
        </div>
        {n.by === me()?.id || me()?.admin ? (
          <div className="row">
            <button className="btn" data-a="noticeDel" data-x={n.id}>
              삭제
            </button>
          </div>
        ) : null}
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={false} />;
  }
  if (m.k === 'acctDel') {
    const x = person(m.id);
    const o = S.orgs[x.org];
    const ps = S.projects.filter((p) => p.members.includes(x.id) && !p.archived);
    t = '직원 계정 삭제';
    b = (
      <>
        <p
          style={{
            fontSize: '15px',
          }}
        >
          <b>{x.name}</b>님의 계정(
          <span className="num">
            {x.login || ''}@{o.code || ''}
          </span>
          )을 정말 삭제할까요?
        </p>
        <div className="notice warn">
          <ul
            style={{
              margin: 0,
              paddingLeft: '18px',
            }}
          >
            <li>삭제하면 이 아이디로 더는 로그인할 수 없고, 되돌릴 수 없어요.</li>
            {ps.length ? (
              <li>
                참여 중인 과제 {ps.length}건({ps.map((p) => p.short).join(', ')})의 구성원과 참여율에서 빠져요.
              </li>
            ) : null}
            <li>이미 등록된 집행·결재·업무보고 기록은 그대로 남아요.</li>
          </ul>
        </div>
        <p className="small muted">잠시 쓰지 않을 직원이라면 삭제 대신 ‘사용 중지’를 권해요.</p>
        <div className="row">
          <button className="btn" data-a="closeModal">
            취소
          </button>
          <button className="btn danger" data-a="acctDel" data-x={x.id}>
            삭제
          </button>
        </div>
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={false} />;
  }
  if (m.k === 'join' && findInv(f.j_code)) {
    const { p: ip, v } = findInv(f.j_code);
    const st = invState(v);
    const L = ip.parts.find((x) => x.role === '주관');
    const already = part(ip, S.view);
    t = '연구단 과제 참여';
    act = 'saveJoin';
    b = (
      <>
        {
          <Field
            label={'연구단 코드 또는 초대번호'}
            name={'j_code'}
            {...{
              ph: '예: CN-B41M 또는 INV-XXXX-XXXX',
              r: 1,
            }}
          />
        }
        <div className={`notice ${st !== 'ok' || already?.status === '수락' ? 'warn' : 'good'}`}>
          <b>초대번호 확인</b> · {ip.name}
          <br />
          <span className="small">
            총괄 {S.orgs[L.org].name} · 구분 {v.tier} · 역할 {v.role}로 들어가요.
          </span>
          <br />
          <span className="small">
            {st === 'used'
              ? '이미 사용한 번호예요.'
              : st === 'revoked'
                ? '총괄기관이 폐기한 번호예요.'
                : st === 'expired'
                  ? `${fdate(v.exp)}에 만료된 번호예요.`
                  : already?.status === '수락'
                    ? '이미 참여 중인 과제예요.'
                    : '승인 없이 바로 참여하고, 번호는 사용 처리돼요.'}
          </span>
        </div>
      </>
    );
  } else if (m.k === 'join') {
    t = '연구단 과제 참여 신청';
    act = 'saveJoin';
    const code = String(f.j_code || '')
      .trim()
      .toUpperCase();
    const hit = S.projects.find((p) => p.code === code && !p.archived && p.consortium);
    const L = hit && hit.parts.find((x) => x.role === '주관');
    const already = hit && part(hit, S.view);
    b = (
      <>
        {
          <Field
            label={'연구단 코드 또는 초대번호'}
            name={'j_code'}
            {...{
              ph: '예: CN-B41M 또는 INV-XXXX-XXXX',
              r: 1,
            }}
          />
        }
        <p className="small muted">
          총괄기관에서 받은 코드를 넣으면 승인 후 참여해요. 1회용 초대번호를 받았다면 넣는 즉시 참여해요. 시연 코드:{' '}
          {jb(
            S.projects
              .filter((p) => !p.archived && p.code && p.consortium)
              .map((p, _i) => (
                <button key={_i} type="button" className="linkbtn" data-a="jFill" data-x={p.code}>
                  {p.code}
                </button>
              )),
            ' · ',
          )}
        </p>
        {hit ? (
          <div className={`notice ${already ? 'warn' : ''}`}>
            <b>{hit.name}</b>
            <br />
            <span className="small">
              {hit.ministry} · 총괄 {S.orgs[L.org].name} · {hit.phase} 단계
            </span>
            {already ? (
              <>
                <br />
                <span className="small">이미 {already.status === '수락' ? '참여 중' : already.status}인 과제예요.</span>
              </>
            ) : null}
          </div>
        ) : code.length >= 7 ? (
          <div className="notice warn">코드에 맞는 과제가 없어요.</div>
        ) : null}
        <div className="grid2">
          {
            <Field
              label={'희망 구분'}
              name={'j_tier'}
              {...{
                options: ['1세부', '2세부', '3세부', '총괄'],
              }}
            />
          }
          {
            <Field
              label={'희망 역할'}
              name={'j_role'}
              {...{
                options: ['참여', '세부주관'],
              }}
            />
          }
        </div>
        {
          <Field
            label={'신청 메시지'}
            name={'j_msg'}
            {...{
              ph: '예: 1세부 공정 실증 담당으로 참여하려고 해요.',
            }}
          />
        }
        <p className="small muted">총괄기관이 승인하면 이 과제만 우리 기관과 공유돼요. 다른 과제나 우리 기관의 세부 집행은 공유되지 않아요.</p>
      </>
    );
  }
  if (m.k === 'tev') {
    const p = proj(m.id);
    t = `연구단 일정 · ${p.short || p.name}`;
    act = 'saveTev';
    b = (
      <>
        <div className="grid2">
          {
            <Field
              label={'날짜'}
              name={'tv_date'}
              {...{
                type: 'date',
              }}
            />
          }
          {
            <Field
              label={'구분'}
              name={'tv_kind'}
              {...{
                options: ['워크숍', '회의', '보고서 마감', '평가', '기타'],
              }}
            />
          }
        </div>
        {
          <Field
            label={'내용'}
            name={'tv_title'}
            {...{
              ph: '예: 2차년도 중간 점검 워크숍',
            }}
          />
        }
        <p className="small muted">연구단 모든 기관의 일정·회의 탭에 보여요.</p>
      </>
    );
  }
  if (m.k === 'col') {
    const p = proj(m.id);
    const pk = m.kind === 'prop';
    t = pk ? '제안서 양식 올리기' : '보고서 취합 요청';
    act = 'saveCol';
    b = (
      <>
        {
          <Field
            label={'제목'}
            name={'c_title'}
            {...{
              ph: pk ? '예: 세부과제별 제안서 작성 양식' : '예: 2차년도 연차실적보고서 취합',
            }}
          />
        }
        {
          <Field
            label={'제출 마감'}
            name={'c_due'}
            {...{
              type: 'date',
            }}
          />
        }{' '}
        <label className="field" htmlFor="c-tpl">
          <span>
            양식 파일 <small>각 기관이 내려받아 채울 양식이에요 (선택)</small>
          </span>
          <In id="c-tpl" type="file" data-a-change="colTpl" />
          {f.c_tpl ? <small>{f.c_tpl}</small> : null}
        </label>
        <p className="small muted">
          올리면 {p.parts.filter((q) => q.status === '수락').length}개 기관의 {pk ? '제안서 취합' : '연차별 보고서'} 탭에 나타나고, 마감일이 연구단 일정에도 들어가요.
        </p>
      </>
    );
  }
  if (m.k === 'staff') {
    const oc = orgCfg(S.view);
    const o = S.orgs[S.view];
    t = '직원 계정 만들기';
    act = 'saveStaff';
    b = (
      <>
        <div className="grid2">
          {
            <Field
              label={'이름'}
              name={'s_name'}
              {...{
                ph: '예: 홍길동',
              }}
            />
          }
          <label className="field" htmlFor="f-s_login">
            <span>아이디</span>
            <In id="f-s_login" data-b="s_login" type="text" value={f.s_login || ''} placeholder="예: gildong.hong" autoComplete="off" />
            <small>로그인: 아이디@{o.code || ''}</small>
          </label>{' '}
          {
            <Field
              label={'부서'}
              name={'s_unit'}
              {...{
                options: (oc.units || []).map((u) => u.name),
              }}
            />
          }
          {
            <Field
              label={'직위'}
              name={'s_level'}
              {...{
                options: (oc.levels || []).map((l) => [l.k, l.n]),
              }}
            />
          }
          {
            <Field
              label={'직급'}
              name={'s_role'}
              {...{
                ph: '예: 선임연구원',
              }}
            />
          }
          {
            <Field
              label={'이메일'}
              name={'s_email'}
              {...{
                type: 'email',
                ph: '초대 메일을 받을 주소',
              }}
            />
          }
          {
            <Field
              label={`${S.payYear}년 월 급여(원)`}
              name={'s_pay'}
              {...{
                type: 'number',
                step: 10000,
              }}
            />
          }
        </div>
        <label className="check" htmlFor="f-s_student">
          <In id="f-s_student" type="checkbox" data-b="s_student" {...ax(f.s_student === true ? 'checked' : '')} />
          <span>학생연구원 (4대보험·퇴직급여 제외)</span>
        </label>
      </>
    );
  }
  if (m.k === 'proposal') {
    t = '새 제안 과제';
    act = 'saveProposal';
    b = (
      <>
        {
          <Field
            label={'과제 유형'}
            name={'pr_cons'}
            {...{
              options: CONS_OPTS,
              r: 1,
            }}
          />
        }
        <p
          className="small muted"
          style={{
            margin: '-6px 0 4px',
          }}
        >
          {consHint(f.pr_cons)}
        </p>
        {
          <Field
            label={'과제명'}
            name={'pr_name'}
            {...{
              ph: '예: 수소 저장용 고분자 복합소재 개발',
            }}
          />
        }
        {
          <Field
            label={'공고·사업명'}
            name={'pr_call'}
            {...{
              ph: '예: 2027년 소재부품기술개발사업',
            }}
          />
        }
        <div className="grid2">
          {<MinFld name={'pr_min'} />}
          {
            <Field
              label={'관리팀 (조직도)'}
              name={'pr_team'}
              {...{
                options: unitOpts(),
              }}
            />
          }
          {
            <Field
              label={'총 연구기간'}
              name={'pr_n'}
              {...{
                options: Array.from(
                  {
                    length: 9,
                  },
                  (_, i) => [String(i + 1), `${i + 1}차년도`],
                ),
              }}
            />
          }
          {
            <Field
              label={'제안 마감'}
              name={'pr_due'}
              {...{
                type: 'date',
              }}
            />
          }
          {
            <Field
              label={'사업 시작(예정)'}
              name={'pr_start'}
              {...{
                type: 'date',
              }}
            />
          }
          {
            <Field
              label={'사업 종료(예정)'}
              name={'pr_end'}
              {...{
                type: 'date',
              }}
            />
          }
        </div>
        <p className="small muted">
          {f.pr_cons === 'cons' ? '우리 기관이 총괄주관으로 만들어져요. 연구단 코드가 생기니 함께할 기관에 알려 주면 참여 신청을 받을 수 있어요.' : '우리 기관 단독 제안으로 만들어져요.'}
        </p>
      </>
    );
  }
  if (m.k === 'propGo') {
    const p = proj(m.id);
    const ps = p.parts.filter((q) => q.status === '수락');
    const notOk = ps.filter((q) => !propTotal(p, q.org).ok);
    const overAll = ps.flatMap((q) => propCalc(p, q.org, 0).st.filter((s) => s.left < s.rate));
    t = '선정 · 추진 단계로 전환';
    b = (
      <>
        <p>
          <b>{p.name}</b>{' '}
          <span className="small muted">
            {fdate(p.start)}~{fdate(p.end)}
          </span>
        </p>
        {<PropTable p={p} />}{' '}
        {notOk.length ? (
          <div className="notice warn">편성이 끝나지 않은 기관이 있어요: {notOk.map((q) => S.orgs[q.org].short).join(', ')}. 그대로 전환하면 지금 편성 값으로 예산이 들어가요.</div>
        ) : (
          <div className="notice good">모든 기관 편성이 재원 구성과 일치해요.</div>
        )}{' '}
        {overAll.length ? <div className="notice bad">참여율 초과: {overAll.map((s) => `${s.x.name} 남은 ${s.left}% · 제안 ${s.rate}%`).join(', ')}. 전환하면 총 참여율이 100%를 넘어요.</div> : null}
        <ul
          className="small"
          style={{
            paddingLeft: '18px',
            margin: '8px 0',
          }}
        >
          <li>1차년도 편성이 지금 예산으로 들어가고, 2차년도 이후 편성은 각 연차 예산 계획으로 저장돼요. 연차를 마감하면 다음 연차 예산이 자동으로 채워져요.</li>
          <li>연차 기간(총 {propYearsOf(p).length}차년도)이 연구행정의 연차 관리로 그대로 넘어가요.</li>
          <li>제안 인건비의 참여율과 현금·현물 구분이 과제 인건비(참여율)로 넘어가요.</li>
          <li>
            연구행정 관리에 과제가 생기고,{' '}
            {p.consortium ? (
              <>
                과제가 <b>연구단 제안관리 → 연구단 연구관리</b>로 옮겨져요. 기관별 성과 목표는 연구관리의 성과로, 제안서 취합 자료는 그대로 남아요.
              </>
            ) : (
              '과제가 추진 단계로 바뀌어요.'
            )}
          </li>
        </ul>
        <div className="row">
          <button className="btn" data-a="closeModal">
            취소
          </button>
          <button className="btn primary" data-a="propGoDo" data-x={`${p.id}|${m.from || ''}`}>
            {p.consortium ? '연구단 연구관리로 전환' : '추진 단계로 전환'}
          </button>
        </div>
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={true} />;
  }
  if (m.k === 'invite') {
    t = '참여기관 초대';
    act = 'saveInvite';
    const hit = Object.values(S.orgs).find((o) => o.number === f.i_no && !o.hidden);
    const ip = proj(m.id);
    const qq = String(f.i_q || '').trim();
    const cand = Object.entries(S.orgs).filter(([k, o]) => !o.hidden && !part(ip, k) && (!qq || o.name.includes(qq) || o.short.includes(qq) || o.number.includes(qq)));
    b = (
      <>
        {
          <Field
            label={'플랫폼 가입 기관 찾기'}
            name={'i_q'}
            {...{
              ph: '기관 이름이나 번호',
              r: 1,
            }}
          />
        }
        <div
          className="tw"
          style={{
            maxHeight: '180px',
            margin: '-4px 0 10px',
          }}
        >
          <table>
            <tbody>
              {jn(
                cand.slice(0, 8).map(([, o], _i) => (
                  <tr key={_i}>
                    <td>
                      {o.name}
                      <br />
                      <span className="small muted">
                        {o.type || ''} · {o.number}
                      </span>
                    </td>
                    <td className="r">
                      <button type="button" className={`btn sm ${f.i_no === o.number ? 'primary' : ''}`} data-a="iFill" data-x={o.number}>
                        {f.i_no === o.number ? '선택됨' : '선택'}
                      </button>
                    </td>
                  </tr>
                )),
              ) || (
                <tr>
                  <td className="muted small">찾는 기관이 없어요. 가입 전이면 1회용 초대번호를 보내 주세요.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <label className="field" htmlFor="i_no">
          <span>사업자등록번호 또는 고유번호</span>
          <In id="i_no" type="text" inputMode="numeric" data-no="i_no" value={f.i_no || ''} placeholder="000-00-00000" />
        </label>
        <p className="small muted">
          시연 번호:{' '}
          <button type="button" className="linkbtn" data-a="iFill" data-x="333-86-77889">
            누리테크(주)
          </button>
        </p>
        {hit ? (
          <div className="notice">
            가입된 기관: <b>{hit.name}</b> · 초대하면 그 기관의 연구단 과제 화면에 수락 버튼이 떠요.
          </div>
        ) : null}
        <div className="grid2">
          {
            <Field
              label={'구분'}
              name={'i_tier'}
              {...{
                options: ['1세부', '2세부', '3세부', '총괄'],
              }}
            />
          }
          {
            <Field
              label={'역할'}
              name={'i_role'}
              {...{
                options: ['참여', '세부주관'],
              }}
            />
          }
        </div>
        {
          <Field
            label={'배정 사업비(원)'}
            name={'i_amount'}
            {...{
              type: 'number',
            }}
          />
        }
      </>
    );
  }
  if (m.k === 'invcode') {
    const ip = proj(m.id);
    t = '1회용 초대번호 만들기';
    act = 'saveInvCode';
    b = (
      <>
        <p className="small muted">
          <b>{ip.name}</b> 연구단에 들어올 기관에 보낼 번호예요. 받은 기관이 <b>연구단 과제 → 참여 신청</b>에 번호를 넣으면 승인 없이 바로 참여하고, 번호는 그 즉시 사용 처리돼요.
        </p>
        <div className="grid2">
          {
            <Field
              label={'구분'}
              name={'ic_tier'}
              {...{
                options: ['1세부', '2세부', '3세부', '총괄'],
              }}
            />
          }
          {
            <Field
              label={'역할'}
              name={'ic_role'}
              {...{
                options: ['참여', '세부주관'],
              }}
            />
          }
        </div>
        <div className="grid2">
          {
            <Field
              label={'보낼 곳 메모 (선택)'}
              name={'ic_memo'}
              {...{
                ph: '예: 누리테크 김연구 책임',
              }}
            />
          }
          {
            <Field
              label={'유효 기간'}
              name={'ic_days'}
              {...{
                options: [
                  ['7', '7일'],
                  ['14', '14일'],
                  ['30', '30일'],
                ],
              }}
            />
          }
        </div>
      </>
    );
  }
  if (m.k === 'gtask') {
    const p = proj(m.id);
    const y = gYear(p);
    const os = sortParts(p.parts.filter((x) => x.status === '수락'))
      .map((q) => q.org)
      .filter((o) => canPerfOrg(p, o));
    t = m.tid ? '세부 연구 수정' : '세부 연구 추가';
    act = 'saveGTask';
    const opts = Array.from(
      {
        length: Math.max(24, (p.years || []).length * 12),
      },
      (_, i) => ymAdd((p.years?.[0]?.start || y.start).slice(0, 7), i),
    ).map((z) => [z, `${z.slice(0, 4)}년 ${+z.slice(5, 7)}월`]);
    b = (
      <>
        {os.length > 1 ? (
          <Field
            label={'기관'}
            name={'gt_org'}
            {...{
              options: os.map((o) => [o, S.orgs[o].short]),
            }}
          />
        ) : null}
        {
          <Field
            label={'세부 연구'}
            name={'gt_title'}
            {...{
              ph: '예: 실증 설비 설치·운영',
            }}
          />
        }
        <div className="grid3">
          {
            <Field
              label={'시작 월'}
              name={'gt_s'}
              {...{
                options: opts,
              }}
            />
          }
          {
            <Field
              label={'종료 월'}
              name={'gt_e'}
              {...{
                options: opts,
              }}
            />
          }
          {
            <Field
              label={'진척률(%)'}
              name={'gt_prog'}
              {...{
                type: 'number',
              }}
            />
          }
        </div>
        {m.tid ? (
          <button type="button" className="btn sm" data-a="gTaskDel" data-x={`${p.id}|${m.tid}`}>
            이 세부 연구 삭제
          </button>
        ) : null}
      </>
    );
  }
  if (m.k === 'perfGoal') {
    const p = proj(m.id);
    t = '성과 목표 추가';
    act = 'savePerfGoal';
    const os = perfOrgs(p).filter((o) => canPerfOrg(p, o));
    b = (
      <>
        <p className="small muted">{p.name} · 목표 수치는 추가한 뒤 표에서도 고칠 수 있어요.</p>
        {p.consortium && os.length > 1 ? (
          <Field
            label={'목표를 넣을 기관'}
            name={'pg_org'}
            {...{
              options: os.map((o) => [o, S.orgs[o].short]),
            }}
          />
        ) : null}
        <div className="grid2">
          {
            <Field
              label={'성과 종류'}
              name={'pg_kind'}
              {...{
                options: PERF_KINDS.map((x) => x[0]),
                r: 1,
              }}
            />
          }
          {f.pg_kind === '기타' ? (
            <Field
              label={'성과 이름'}
              name={'pg_label'}
              {...{
                ph: '예: 표준 제안, 기술료',
              }}
            />
          ) : (
            <Field
              label={'단위'}
              name={'pg_unit'}
              {...{
                options: ['건', '명', '백만원'],
              }}
            />
          )}
        </div>
        <div className="grid3">
          {jn(
            perfYears(p).map((y, _i) => (
              <Field
                key={_i}
                label={`${y.no}차년도 목표`}
                name={`pg_t${y.no}`}
                {...{
                  type: 'number',
                }}
              />
            )),
          )}
        </div>
      </>
    );
  }
  if (m.k === 'perfOut') {
    const p = proj(m.id);
    t = '성과 등록';
    act = 'savePerfOut';
    const ks = [...new Set<any>([...(p.goals || []).map((g) => g.kind), ...PERF_KINDS.map((x) => x[0])])];
    const os = perfOrgs(p).filter((o) => canPerfOrg(p, o));
    b = (
      <>
        {p.consortium && os.length > 1 ? (
          <Field
            label={'성과 기관'}
            name={'po_org'}
            {...{
              options: os.map((o) => [o, S.orgs[o].short]),
            }}
          />
        ) : (
          <p className="small muted">
            {p.name} · {S.orgs[S.view].short} 성과로 등록돼요.
          </p>
        )}
        <div className="grid2">
          {
            <Field
              label={'성과 종류'}
              name={'po_kind'}
              {...{
                options: ks,
                r: 1,
              }}
            />
          }
          {f.po_kind === '기타' ? (
            <Field
              label={'성과 이름'}
              name={'po_label'}
              {...{
                ph: '목표에 넣은 기타 성과 이름과 똑같이',
              }}
            />
          ) : (
            <Field
              label={'일자'}
              name={'po_date'}
              {...{
                type: 'date',
              }}
            />
          )}
        </div>
        {<Field label={/논문|발표/.test(f.po_kind) ? '논문 제목' : /특허/.test(f.po_kind) ? '발명의 명칭' : /SW/.test(f.po_kind) ? '프로그램 이름' : '성과명'} name={'po_title'} />}
        <div className="grid2">
          {<Field label={/논문|발표/.test(f.po_kind) ? '학술지·학회' : /특허/.test(f.po_kind) ? '출원·등록 번호' : /SW/.test(f.po_kind) ? '등록 번호' : '비고'} name={'po_note'} />}
          {f.po_kind === '사업화 매출' ? (
            <Field
              label={'금액(백만원)'}
              name={'po_qty'}
              {...{
                type: 'number',
              }}
            />
          ) : f.po_kind === '인력양성' ? (
            <Field
              label={'인원(명)'}
              name={'po_qty'}
              {...{
                type: 'number',
              }}
            />
          ) : f.po_kind === '기타' ? (
            <Field
              label={'일자'}
              name={'po_date'}
              {...{
                type: 'date',
              }}
            />
          ) : null}
        </div>
      </>
    );
  }
  if (m.k === 'pyDel') {
    const p = proj(m.id);
    const y = propYearsOf(p)[m.idx];
    t = `${y.no}차년도 삭제`;
    act = 'propYrDelDo';
    b = (
      <>
        <p>
          <b>{p.name}</b>의 {y.no}차년도({fdate(y.start)}~{fdate(y.end)})를 지울까요?
        </p>
        <p className="small muted">모든 참여기관의 {y.no}차년도 편성(정부지원·인건비·비목)이 함께 지워지고, 뒤 차년도 번호가 하나씩 당겨져요. 되돌릴 수 없어요.</p>
      </>
    );
  }
  if (m.k === 'meeting') {
    t = m.id ? '회의 일정 수정' : '회의 예비 등록';
    act = 'saveMeeting';
    wide = true;
    const p = proj(f.m_proj);
    const att = f.m_att || [],
      ex = f.m_exp || [];
    const cs =
      p && f.m_date && f.m_start && f.m_end
        ? conflictsFor({
            id: m.id,
            date: f.m_date,
            start: f.m_start,
            end: f.m_end,
            att,
            exp: ex,
          })
        : [];
    const bad = new Set<any>(cs.flatMap((c) => c.names));
    b = (
      <>
        {
          <Field
            label={'과제'}
            name={'m_proj'}
            {...{
              options: visible().map((q) => [q.id, `${q.short} · ${q.name}`]),
              r: 1,
            }}
          />
        }
        <div className="grid3">
          {
            <Field
              label={'날짜'}
              name={'m_date'}
              {...{
                type: 'date',
                r: 1,
              }}
            />
          }
          {
            <Field
              label={'시작'}
              name={'m_start'}
              {...{
                type: 'time',
                r: 1,
                step: 600,
              }}
            />
          }
          {
            <Field
              label={'종료'}
              name={'m_end'}
              {...{
                type: 'time',
                r: 1,
                step: 600,
              }}
            />
          }
        </div>
        <div className="grid2">
          {
            <Field
              label={'장소'}
              name={'m_place'}
              {...{
                ph: '예: 공학관 302호',
              }}
            />
          }
          {
            <Field
              label={'안건'}
              name={'m_topic'}
              {...{
                ph: '예: 분리막 시험 결과 공유',
              }}
            />
          }
        </div>
        {p ? (
          <Picker
            pk={'m'}
            {...{
              pool: peopleOf(p),
              bad,
              title: '참석 예정자',
            }}
          />
        ) : null}{' '}
        {cs.length ? (
          <div className="notice bad" role="alert">
            <b>시간이 겹쳐서 등록할 수 없어요.</b>
            <br />
            {jb(
              cs.map((c) => conflictText(c)),
              <br />,
            )}
          </div>
        ) : att.length + ex.length ? (
          <div className="notice">참석 예정자의 다른 회의와 시간이 겹치지 않아요.</div>
        ) : null}{' '}
        {m.id ? null : <p className="small muted">시연: 11월 12일 11:00~12:00에 박도현을 넣으면 연구B 회의와 겹쳐요.</p>}
      </>
    );
  }
  if (m.k === 'entry') {
    const item = f.e_item;
    t = `집행 등록 · ${item}`;
    act = 'saveEntry';
    wide = true;
    const e = {
      org: S.view,
      item,
      sub: f.e_sub,
      amount: +f.e_amount || 0,
    };
    const docs = docsFor(e);
    const sub = subOf(item, f.e_sub);
    const p = proj(S.tab);
    const ms = sub?.meeting ? S.meetings.filter((x) => x.proj === p.id && x.status === '완료' && !x.entry) : [];
    b = (
      <>
        {m.fromSched ? <div className="notice">일정관리의 예정 일정에서 가져왔어요. 저장하면 일정이 완료로 바뀌어요.</div> : null}
        <div className="grid2">
          {m.anyItem ? (
            <Field
              label={'비목'}
              name={'e_item'}
              {...{
                options: ITEMS,
                r: 1,
              }}
            />
          ) : null}
          {
            <Field
              label={'세부유형'}
              name={'e_sub'}
              {...{
                options: CAT[item].map((s) => s.s),
                r: 1,
              }}
            />
          }
          {
            <Field
              label={'재원'}
              name={'e_fund'}
              {...{
                options: ['현금', '현물'],
                hint: `현물 예산 ${won(fundBudget(p, S.view, item, '현물'))}`,
              }}
            />
          }
        </div>
        {sub?.note ? <p className="small muted">{sub.note}</p> : null}{' '}
        {sub?.meeting ? (
          <Field
            label={'연결할 회의'}
            name={'e_meeting'}
            {...{
              options: [['', '연결 안 함'], ...ms.map((x) => [x.id, `${fdate(x.date)} ${x.topic}`])],
              hint: '회의를 연결하면 플랫폼에서 만든 회의록이 증빙으로 붙어요.',
            }}
          />
        ) : null}
        <div className="grid3">
          {
            <Field
              label={'집행일'}
              name={'e_date'}
              {...{
                type: 'date',
                r: 1,
              }}
            />
          }
          {
            <Field
              label={'금액(원)'}
              name={'e_amount'}
              {...{
                type: 'number',
                r: 1,
              }}
            />
          }
          {<Field label={'거래처'} name={'e_vendor'} />}
        </div>
        {
          <Field
            label={'내용'}
            name={'e_desc'}
            {...{
              ph: '예: 학회 발표 출장',
            }}
          />
        }{' '}
        {(() => {
          const po = pickOpts(f.e_sub);
          if (!po || f.e_meeting) return null;
          const dc = dayConflicts(f.e_sub, f.e_date, f.e_att || [], {
            sched: f.e_sched,
          });
          const bad = new Set<any>(dc.flatMap((c) => c.names));
          const n = (f.e_att || []).length + (f.e_exp || []).length;
          return (
            <>
              <Picker
                pk={'e'}
                {...{
                  pool: peopleOf(p),
                  bad,
                  ...po,
                }}
              />
              {dc.length ? (
                <div className="notice bad" role="alert">
                  <b>같은 사람이 같은 날 두 번 잡힐 수 없어요.</b>
                  <br />
                  {jb(
                    dc.map((c) => dayText(c)),
                    <br />,
                  )}
                </div>
              ) : null}
              {n && +f.e_amount ? <p className="small muted num">1인당 {won(Math.round(+f.e_amount / n))}</p> : null}
            </>
          );
        })()}
        <section>
          <h3 className="h3">
            필요한 증빙 <span className="muted small">저장하면 증빙 화면이 열려요. 거기서 서식 작성, 결재 요청, 영수증 연결을 해요.</span>
          </h3>
          <div className="evlist">
            {jn(
              docs.map((d, _i) => (
                <div key={_i} className="evrow">
                  <div className="nm">
                    <span
                      className="row"
                      style={{
                        gap: '6px',
                      }}
                    >
                      {d.n} <i className={`src ${d.src}`}>{SRC_LABEL[d.src]}</i>
                      {d.kind === 'opt' ? <span className="chip">해당 시</span> : null}
                      {d.kind === 'exempt' ? <span className="chip">면제</span> : null}
                    </span>
                    <small>{d.note || ''}</small>
                  </div>
                </div>
              )),
            )}
          </div>
        </section>
      </>
    );
  }
  if (m.k === 'evidence') {
    const e = S.entries.find((x) => x.id === m.id);
    const s = evSum(e);
    t = '증빙';
    b = (
      <>
        <p className="small muted">
          {fdate(e.date)} · {proj(e.proj).short} · {e.item} / {e.sub} · {e.desc} · <span className="num">{won(e.amount)}</span>
        </p>
        <div className="row between">
          <span className="row">
            {<OxSummary e={e} />} <span className="small muted">{s.ok ? '증빙이 모두 갖춰졌어요.' : 'X인 서류를 채워 주세요.'}</span>
          </span>
          <button className="btn warm sm" data-a="dlEntry" data-x={e.id}>
            이 건 A4 PDF 전체 내려받기
          </button>
        </div>
        {<EvRowsFor e={e} />}
        {m.err ? (
          <p className="err" role="alert">
            {m.err}
          </p>
        ) : null}
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={true} />;
  }
  if (m.k === 'form') {
    const e = S.entries.find((x) => x.id === m.id);
    const d = docsFor(e)[m.i];
    const fm = f.form;
    t = `${fm.title} ${d.src === 'approval' ? '작성 · 전자결재' : '작성'}`;
    act = 'saveForm';
    wide = true;
    b = (
      <>
        <p className="small muted">
          {e.desc} · {won(e.amount)} · 과제·기관·집행 정보는 자동으로 들어가요.
        </p>
        <div className="grid2">
          {jn(
            fm.rows.map(([k, v], i) =>
              fm.inn && k === ATT_IN ? (
                <AttField key={i} fm={fm} e={e} k={'in'} />
              ) : fm.inn && k === ATT_EX ? (
                <AttField key={i} fm={fm} e={e} k={'ex'} />
              ) : (
                <label key={i} className="field" htmlFor={`ff-${i}`}>
                  <span>{k}</span>
                  <In id={`ff-${i}`} type="text" data-ff={i} value={v} />
                </label>
              ),
            ),
          )}
        </div>
        {fm.table ? (
          <>
            <div className="tw">
              <table>
                <thead>
                  <tr>{jn(fm.table.head.map((h, _i) => <th key={_i}>{h}</th>))}</tr>
                </thead>
                <tbody>{jn(fm.table.rows.map((r, _i) => <tr key={_i}>{jn(r.map((c, _i) => <td key={_i}>{c}</td>))}</tr>))}</tbody>
              </table>
            </div>
            <p className="small muted">참여율은 인건비(참여율) 화면 값을 그대로 가져와요.</p>
          </>
        ) : null}{' '}
        {aiDocOk(d)
          ? (() => {
              const p = proj(e.proj);
              const c = entryCtx(e, f.ai_type || '회의록');
              const nAtt = c.att.length + c.exp.length;
              return (
                <section className="aibox">
                  <div className="row between">
                    <div>
                      <b>AI로 본문 작성</b>{' '}
                      <span className="small muted">총괄관리에 올린 제안서·보고서·이전 회의록과 {nAtt ? `참석자 ${nAtt}명${c.exp.length ? '·전문가 이력' : ''}` : '집행 정보'}을 읽고 써요</span>
                    </div>
                    {f.ai_src === 'ai' ? <span className="chip good">AI 작성</span> : f.ai_src === 'sample' ? <span className="chip warn">예시 초안</span> : null}
                  </div>
                  <Raw html={monthLine(c)} />
                  {<SrcPicker p={p} sel={f.ai_srcs || []} act={'aiSrc'} />}
                  <div
                    className="row"
                    style={{
                      marginTop: '8px',
                    }}
                  >
                    {/자문/.test(d.n) && /회의록/.test(d.n) ? (
                      <label>
                        <span hidden>만들 서류</span>
                        <In
                          as="select"
                          id="f-ai_type"
                          data-b="ai_type"
                          data-r="1"
                          style={{
                            width: 'auto',
                          }}
                        >
                          {jn(
                            ['회의록', '자문의견서'].map((v, _i) => (
                              <option key={_i} {...ax(f.ai_type === v ? 'selected' : '')}>
                                {v}
                              </option>
                            )),
                          )}
                        </In>
                      </label>
                    ) : null}
                    <button type="button" className="btn primary" data-a="aiForm" {...ax(f.ai_gen ? 'disabled' : '')}>
                      {f.ai_gen ? '자료를 읽고 작성하는 중…' : f.ai_src ? 'AI로 다시 작성' : 'AI로 본문 작성'}
                    </button>
                    <span className="small muted">발언·결정 사항은 지어내지 않고 [담당자 입력]으로 남겨요.</span>
                  </div>
                  {f.ai_note ? (
                    <p
                      className="small muted"
                      style={{
                        margin: '6px 0 0',
                      }}
                    >
                      {f.ai_note}
                    </p>
                  ) : null}
                </section>
              );
            })()
          : ''}{' '}
        <label className="field" htmlFor="ff-body">
          <span>
            본문
            {aiDocOk(d) ? (
              <>
                {' '}
                <small>AI 초안을 고쳐 쓰고 [담당자 입력]을 모두 채워 주세요</small>
              </>
            ) : null}
          </span>
          <In as="textarea" id="ff-body" data-ff="body" rows={aiDocOk(d) ? 14 : 10} {...ax(f.ai_gen ? 'readonly' : '')} value={fm.body || ''} />
        </label>{' '}
        {d.src === 'approval' ? (
          <div className="notice">
            저장하면 전자결재로 결재가 요청돼요. 결재선:{' '}
            {apprLine(e.org)
              .map((a) => `${a.role} ${a.name}`)
              .join(' → ')}
          </div>
        ) : null}
      </>
    );
  }
  if (m.k === 'pickReceipt') {
    const e = S.entries.find((x) => x.id === m.id);
    t = '앱 영수증 연결';
    b = (
      <>
        <p className="small muted">
          {e.desc} · {won(e.amount)}
        </p>
        <div className="tw">
          <table>
            <tbody>
              {jn(
                S.receipts
                  .filter((r) => r.st === 'new')
                  .map((r, _i) => (
                    <tr key={_i}>
                      <td>
                        <img className="rthumb" src={r.img} alt="" />
                      </td>
                      <td className="num">{fdate(r.date)}</td>
                      <td>{r.vendor}</td>
                      <td className="r num">
                        {eok(r.amount)} {r.amount !== e.amount ? <span className="chip warn">금액 다름</span> : null}
                      </td>
                      <td className="r">
                        <button className="btn sm primary" data-a="linkReceipt" data-x={r.id}>
                          연결
                        </button>
                      </td>
                    </tr>
                  )),
              )}
            </tbody>
          </table>
        </div>
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={false} />;
  }
  if (m.k === 'assign') {
    const r = S.receipts.find((x) => x.id === m.id);
    t = '영수증 연결';
    act = 'saveAssign';
    const sub = subOf(f.a_item, f.a_sub);
    const ms = sub?.meeting ? S.meetings.filter((x) => x.proj === f.a_proj && x.status === '완료' && !x.entry) : [];
    b = (
      <>
        <div
          className="row"
          style={{
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <img
            src={r.img}
            alt="영수증"
            style={{
              width: '120px',
              border: '1px solid var(--line)',
              borderRadius: '6px',
            }}
          />
          <dl
            className="kv"
            style={{
              gridTemplateColumns: '64px 1fr',
              fontSize: '13px',
            }}
          >
            <dt>사용일</dt>
            <dd>
              {fdate(r.date)} {r.time || ''}
            </dd>
            <dt>가맹점</dt>
            <dd>{r.vendor}</dd>
            <dt>금액</dt>
            <dd className="num">{won(r.amount)}</dd>
            <dt>올린 사람</dt>
            <dd>{person(r.by)?.name || '-'}</dd>
          </dl>
        </div>
        <div className="notice small">
          추천: {proj(m.sg.proj)?.short || ''} · {m.sg.item} / {m.sg.sub}
          {m.sg.meeting ? ` · ${S.meetings.find((x) => x.id === m.sg.meeting)?.topic} 회의` : ''}
        </div>
        {
          <Field
            label={'과제'}
            name={'a_proj'}
            {...{
              options: visible().map((p) => [p.id, `${p.short} · ${p.name}`]),
              r: 1,
            }}
          />
        }
        <div className="grid2">
          {
            <Field
              label={'비목'}
              name={'a_item'}
              {...{
                options: ITEMS,
                r: 1,
              }}
            />
          }
          {
            <Field
              label={'세부유형'}
              name={'a_sub'}
              {...{
                options: CAT[f.a_item].map((s) => s.s),
                r: 1,
              }}
            />
          }
        </div>
        {sub?.meeting ? (
          <Field
            label={'연결할 회의'}
            name={'a_meeting'}
            {...{
              options: [['', '연결 안 함'], ...ms.map((x) => [x.id, `${fdate(x.date)} ${x.topic}`])],
            }}
          />
        ) : null}
        {<Field label={'내용'} name={'a_desc'} />}
        {(() => {
          const po = pickOpts(f.a_sub);
          if (!po || f.a_meeting) return null;
          const dc = dayConflicts(f.a_sub, r.date, f.a_att || []);
          return (
            <>
              <Picker
                pk={'a'}
                {...{
                  pool: peopleOf(proj(f.a_proj)),
                  bad: new Set<any>(dc.flatMap((x) => x.names)),
                  ...po,
                }}
              />
              {dc.length ? (
                <div className="notice bad">
                  {jb(
                    dc.map((x) => dayText(x)),
                    <br />,
                  )}
                </div>
              ) : null}
            </>
          );
        })()}
      </>
    );
  }
  if (m.k === 'sched') {
    t = '일정 추가';
    act = 'saveSched';
    const isMeet = CAT[f.h_item].find((x) => x.s === f.h_sub)?.meeting;
    b = (
      <>
        <div className="grid2">
          {
            <Field
              label={'비목'}
              name={'h_item'}
              {...{
                options: ITEMS,
                r: 1,
              }}
            />
          }
          {
            <Field
              label={'세부유형'}
              name={'h_sub'}
              {...{
                options: CAT[f.h_item].map((x) => x.s),
                r: 1,
              }}
            />
          }
        </div>
        {isMeet ? (
          <div className="notice row between">
            <span>회의는 참석자 시간 중복을 확인할 수 있게 회의 예비 등록으로 넣는 게 좋아요.</span>
            <button type="button" className="btn sm" data-a="newMeeting" data-x={S.tab}>
              회의 예비 등록
            </button>
          </div>
        ) : null}
        <div className="grid3">
          {
            <Field
              label={'날짜'}
              name={'h_date'}
              {...{
                type: 'date',
                r: 1,
              }}
            />
          }
          {
            <Field
              label={'예상 금액(원)'}
              name={'h_amount'}
              {...{
                type: 'number',
                r: 1,
              }}
            />
          }
        </div>
        {
          <Field
            label={'내용'}
            name={'h_title'}
            {...{
              ph: '예: 시제품 코팅 야간 작업',
            }}
          />
        }{' '}
        {(() => {
          const po = pickOpts(f.h_sub);
          if (!po || isMeet) return null;
          const dc = dayConflicts(f.h_sub, f.h_date, f.h_att || []);
          const bad = new Set<any>(dc.flatMap((c) => c.names));
          const n = (f.h_att || []).length + (f.h_exp || []).length;
          return (
            <>
              <Picker
                pk={'h'}
                {...{
                  pool: peopleOf(proj(S.tab)),
                  bad,
                  ...po,
                }}
              />
              {dc.length ? (
                <div className="notice bad" role="alert">
                  <b>같은 사람이 같은 날 두 번 잡힐 수 없어요.</b>
                  <br />
                  {jb(
                    dc.map((c) => dayText(c)),
                    <br />,
                  )}
                </div>
              ) : null}
              {n && +f.h_amount ? <p className="small muted num">1인당 {won(Math.round(+f.h_amount / n))}</p> : null}
              {f.h_sub === '야근·특근 식대' ? <p className="small muted">시연: 11월 26일 야근에 박도현을 넣으면 연구B 일정과 겹쳐요.</p> : null}
            </>
          );
        })()}
      </>
    );
  }
  if (m.k === 'schedView') {
    const x = S.sched.find((y) => y.id === m.id);
    const en = S.entries.find((e) => e.id === x.entry);
    t = x.title;
    b = (
      <>
        <dl
          className="kv"
          style={{
            gridTemplateColumns: '80px 1fr',
            fontSize: '13.5px',
          }}
        >
          <dt>날짜</dt>
          <dd>{fdate(x.date)}</dd>
          <dt>비목</dt>
          <dd>
            {x.item} / {x.sub}
          </dd>
          <dt>예상 금액</dt>
          <dd className="num">{won(x.amount)}</dd>
          {peopleNames(x).length ? (
            <>
              <dt>인원</dt>
              <dd>
                {peopleNames(x).join(', ')} ({peopleNames(x).length}명)
              </dd>
            </>
          ) : null}
          <dt>상태</dt>
          <dd>
            {x.status === '완료' ? (
              <>
                <span className="chip info">완료</span> 집행 {won(en?.amount)} {en ? <OxSummary e={en} /> : null}
              </>
            ) : x.date < TODAY ? (
              <span className="chip bad">지난 예정</span>
            ) : (
              <span className="chip org">예정</span>
            )}
          </dd>
        </dl>
        <div className="row">
          {x.status !== '완료' ? (
            <>
              <button className="btn primary" data-a="schedToEntry" data-x={x.id}>
                집행 등록
              </button>
              <button className="btn" data-a="delSched" data-x={x.id}>
                삭제
              </button>
            </>
          ) : (
            <button className="btn" data-a="openEvidence" data-x={x.entry}>
              증빙 보기
            </button>
          )}
        </div>
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={false} />;
  }
  if (m.k === 'aform') {
    t = '양식 선택';
    const q = (f.aq || '').trim();
    b = (
      <>
        <label className="field" htmlFor="f-aq">
          <span>양식 검색</span>
          <In id="f-aq" type="text" data-b="aq" data-r="1" value={f.aq || ''} placeholder="예: 출장, 지출" />
        </label>{' '}
        {jn(
          [...new Set<any>(AFORMS.map((x) => x.group))].map((g, _i) => {
            const xs = AFORMS.filter((x) => x.use !== false && x.group === g && (!q || x.name.includes(q)));
            return xs.length ? (
              <section key={_i}>
                <h3 className="h3">{g} 양식</h3>
                <div className="formlist">
                  {jn(
                    xs.map((fm, _i) => (
                      <button key={_i} data-a="apvStart" data-x={fm.id}>
                        <b>{fm.name}</b>
                        <small>{fm.desc}</small>
                      </button>
                    )),
                  )}
                </div>
              </section>
            ) : null;
          }),
        )}
        <p className="small muted">연구행정 양식은 집행 건과 연결할 수 있어요. 최종 승인되면 그 집행의 내부결재 증빙이 자동으로 O가 돼요.</p>
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={true} />;
  }
  if (m.k === 'archive') {
    const p = proj(m.id);
    const es = S.entries.filter((e) => e.proj === p.id);
    const miss = es.filter((e) => !evSum(e).ok);
    const pend = S.appr.filter((a) => a.status === '진행' && a.link && es.some((e) => e.id === a.link.e));
    const plans = S.meetings.filter((x) => x.proj === p.id && x.status !== '완료').length + S.sched.filter((x) => x.proj === p.id && x.status !== '완료').length;
    const docs = S.docs.filter((d) => d.proj === p.id).length;
    const warns = [
      [miss.length, `증빙이 미비한 집행 ${miss.length}건`],
      [pend.length, `진행 중인 결재 ${pend.length}건`],
      [plans, `끝나지 않은 일정 ${plans}건`],
    ].filter((x) => x[0]);
    t = '과제 종료 · 자료실로 옮기기';
    b = (
      <>
        <p>
          <b>{p.name}</b>{' '}
          <span className="small muted">
            {fdate(p.start)}~{fdate(p.end)}
          </span>
        </p>
        <div className="stats">
          <div>
            <span>문서</span>
            <strong>{docs}건</strong>
          </div>
          <div>
            <span>집행</span>
            <strong>{es.length}건</strong>
          </div>
          <div>
            <span>집행액</span>
            <strong>{won(sum(es.map((e) => e.amount)))}</strong>
          </div>
        </div>
        {warns.length ? (
          <div className="notice warn">
            <b>옮기기 전에 확인해 주세요.</b>
            <ul
              style={{
                margin: '6px 0 0',
                paddingLeft: '18px',
              }}
            >
              {jn(warns.map((w, _i) => <li key={_i}>{w[1]}</li>))}
            </ul>
            <p
              className="small"
              style={{
                marginTop: '6px',
              }}
            >
              그대로 옮기면 미비 상태로 보관돼요. 자료실에서 진행 중으로 되돌려 다시 정리할 수 있어요.
            </p>
          </div>
        ) : (
          <div className="notice good">증빙, 결재, 일정이 모두 정리돼 있어요.</div>
        )}{' '}
        <label className="check" htmlFor="arc-ok">
          <In id="arc-ok" type="checkbox" data-b="arc_ok" {...ax(f.arc_ok ? 'checked' : '')} />
          <span>과제를 종료하고 자료실로 옮겨요. 참여기관 화면에서도 진행 중 목록에서 빠져요.</span>
        </label>{' '}
        {m.err ? (
          <p className="err" role="alert">
            {m.err}
          </p>
        ) : null}
        <div className="row">
          <button className="btn" data-a="closeModal">
            취소
          </button>
          <button className="btn primary" data-a="archiveDo" data-x={p.id}>
            자료실로 옮기기
          </button>
        </div>
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={false} />;
  }
  if (m.k === 'meetView') {
    const x = S.meetings.find((y) => y.id === m.id);
    const p = proj(x.proj);
    const en = S.entries.find((e) => e.id === x.entry);
    t = x.topic;
    b = (
      <>
        <div className="row">
          <span
            className={`chip ${
              {
                done: 'info',
                plan: 'org',
                late: 'bad',
              }[mStatus(x)]
            }`}
          >
            {mLabel(x)}
          </span>
          <span className="chip">{p.short}</span>
        </div>
        <dl
          className="kv"
          style={{
            gridTemplateColumns: '70px 1fr',
            fontSize: '13.5px',
          }}
        >
          <dt>일시</dt>
          <dd className="num">
            {fdate(x.date)} {x.start}~{x.end}
          </dd>
          <dt>장소</dt>
          <dd>{x.place || '-'}</dd>
          <dt>참석자</dt>
          <dd>{attNames(x)}</dd>
          <dt>회의록</dt>
          <dd>
            {x.doc ? (
              <button className="linkbtn" data-a="openDoc" data-x={x.doc}>
                보기
              </button>
            ) : (
              '-'
            )}
          </dd>
          <dt>회의비</dt>
          <dd>{en ? `${won(en.amount)} ${(<OxSummary e={en} />)}` : x.status === '완료' ? <span className="chip warn">미등록</span> : '-'}</dd>
        </dl>
        <div className="row">
          {x.status !== '완료' ? (
            <>
              <button className="btn primary" data-a="startComplete" data-x={x.id}>
                완료 처리
              </button>
              <button className="btn" data-a="editMeeting" data-x={x.id}>
                일정 수정
              </button>
              <button className="btn" data-a="askDelMeeting" data-x={x.id}>
                삭제
              </button>
            </>
          ) : null}
          {x.status === '완료' && !x.entry ? (
            <button className="btn primary" data-a="goReceipt">
              영수증에서 회의비 연결
            </button>
          ) : null}
        </div>
        {m.confirmDel ? (
          <div className="notice bad row between">
            <span>이 예비 일정을 삭제할까요?</span>
            <span className="row">
              <button className="btn sm" data-a="noDel">
                취소
              </button>
              <button className="btn sm primary" data-a="delMeeting" data-x={x.id}>
                삭제
              </button>
            </span>
          </div>
        ) : null}
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={false} />;
  }
  if (m.k === 'a4') {
    const e = S.entries.find((x) => x.id === m.id);
    const d = docsFor(e)[m.i];
    t = `${short(d.n)} · A4 미리보기`;
    b = (
      <>
        <div
          className="a4wrap"
          dangerouslySetInnerHTML={{
            __html: a4Html(e, d),
          }}
        />
        <div className="row">
          <button className="btn primary" data-a="dlDoc" data-x={`${e.id}|${m.i}`}>
            A4 PDF 내려받기
          </button>
          {m.back ? (
            <button className="btn" data-a="openEvidence" data-x={e.id}>
              증빙 목록으로
            </button>
          ) : null}
        </div>
        {m.err ? (
          <p className="err" role="alert">
            {m.err}
          </p>
        ) : null}
      </>
    );
    return <WrapModal t={t} b={b} act={''} wide={true} />;
  }
  if (m.k === 'doc') {
    t = '제안서·보고서 올리기';
    act = 'saveDoc';
    b = (
      <>
        <div className="grid2">
          {
            <Field
              label={'과제'}
              name={'d_proj'}
              {...{
                options: visible().map((p) => [p.id, p.short + ' · ' + p.name]),
              }}
            />
          }
          {
            <Field
              label={'종류'}
              name={'d_kind'}
              {...{
                options: ['제안서', '보고서', '계획서', '기타'],
              }}
            />
          }
        </div>
        {<Field label={'문서명'} name={'d_name'} />}
        {
          <Field
            label={'공개 범위'}
            name={'d_share'}
            {...{
              options: [
                ['전체', '참여기관 전체'],
                ['소속', '소속 기관만'],
              ],
            }}
          />
        }{' '}
        <label className="field" htmlFor="d_file">
          <span>파일 (PDF, TXT)</span>
          <In id="d_file" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" data-a-change="pickDocFile" />
          <small>{m.reading ? 'PDF에서 글자를 읽는 중…' : 'PDF는 글자를 뽑아 근거 문단으로 나눠요. 스캔 이미지 PDF와 HWP는 실제 개발 단계에서 지원해요.'}</small>
        </label>{' '}
        {
          <Field
            label={'읽은 내용 (고칠 수 있어요)'}
            name={'d_text'}
            {...{
              area: 8,
              ph: '문단을 빈 줄로 나누면 AI 회의록의 근거 문단으로 쓰여요.',
            }}
          />
        }
      </>
    );
  }
  if (m.k === 'expert') {
    t = '전문가 등록';
    act = 'saveExpert';
    b = (
      <>
        <div className="grid2">
          {<Field label={'이름'} name={'x_name'} />}
          {<Field label={'소속'} name={'x_org'} />}
          {
            <Field
              label={'전문가 그룹'}
              name={'x_group'}
              {...{
                options: S.expGroups,
                hint: '그룹은 전문가 관리의 그룹 설정에서 추가해요.',
              }}
            />
          }
          {<Field label={'분야'} name={'x_field'} />}
          {<Field label={'연락처'} name={'x_phone'} />}
          {
            <Field
              label={'메일'}
              name={'x_email'}
              {...{
                type: 'email',
                ph: 'name@example.com',
              }}
            />
          }
        </div>
        {
          <Field
            label={'주요 이력'}
            name={'x_career'}
            {...{
              area: 4,
              ph: '예: OO대학교 교수. 분리막 소재 연구 10년.',
            }}
          />
        }
        {
          <Field
            label={'공유 범위'}
            name={'x_share'}
            {...{
              options: xShareOpts(),
              hint: '내 소속 위계에서 골라요. 고른 부서와 그 하위 부서 직원이 볼 수 있어요.',
            }}
          />
        }
      </>
    );
  }
  if (m.k === 'member') {
    t = '구성원 초대';
    act = 'saveMember';
    b = `${(<Field label={'이름'} name={'m_name2'} />)}${(<Field label={'소속'} name={'m_unit'} />)}${(
      <Field
        label={'역할'}
        name={'m_role'}
        {...{
          ph: '예: 연구원',
        }}
      />
    )}`;
  }
  if (m.k === 'view') {
    const d = S.docs.find((x) => x.id === m.id);
    return (
      <WrapModal
        t={d.name}
        b={
          <>
            <div className="small muted">
              {d.kind} · {fdate(d.date)}
            </div>
            <div
              style={{
                whiteSpace: 'pre-wrap',
                maxWidth: '65ch',
              }}
            >
              {d.body || d.paras.join('\n\n')}
            </div>
          </>
        }
        act={''}
        wide={false}
      />
    );
  }
  return <WrapModal t={t} b={b} act={act} wide={wide} />;
}
export function WrapModal({ t, b, act, wide }: any) {
  const style = wide ? ' style="max-width:860px"' : '';
  const okLbl = act === 'propYrDelDo' ? '삭제' : act === 'saveInvCode' ? '초대번호 만들기' : act === 'saveInvite' ? '초대 보내기' : null;
  if (!act)
    return (
      <div className="overlay" data-a="closeModal" data-self="1">
        <div className="modal" role="dialog" aria-modal="true" aria-label={t} {...ax(style)}>
          <div className="row between">
            <h2>{t}</h2>
            <button className="btn sm" data-a="closeModal">
              닫기
            </button>
          </div>
          {b}
        </div>
      </div>
    );
  return (
    <div className="overlay" data-a="closeModal" data-self="1">
      <form className="modal" noValidate role="dialog" aria-modal="true" aria-label={t} data-submit={act} {...ax(style)}>
        <h2>{t}</h2>
        {b}
        {S.modal.err ? (
          <p className="err" role="alert">
            {S.modal.err}
          </p>
        ) : null}
        <div className="row">
          <button type="button" className="btn" data-a="closeModal">
            취소
          </button>
          <button type="submit" className="btn primary">
            {okLbl || (act === 'saveForm' && S.modal.src === 'approval' ? '저장하고 결재 요청' : '저장')}
          </button>
        </div>
      </form>
    </div>
  );
}
export function NewProjYears({ f }: any) {
  const ys = npYears(f);
  const cur = Math.min(+f.n_cur || 1, ys.length);
  return (
    <>
      <div className="grid2">
        {
          <Field
            label={'총 연구기간'}
            name={'n_ny'}
            {...{
              options: Array.from(
                {
                  length: 9,
                },
                (_, i) => [String(i + 1), `${i + 1}차년도`],
              ),
              r: 1,
            }}
          />
        }
        {
          <Field
            label={'지금 진행 중인 차년도'}
            name={'n_cur'}
            {...{
              options: ys.map((y) => [String(y.no), `${y.no}차년도`]),
              r: 1,
            }}
          />
        }
      </div>
      <div
        className="tw"
        style={{
          margin: '-2px 0 6px',
        }}
      >
        <table>
          <thead>
            <tr>
              <th>차년도</th>
              <th>연구 시작일</th>
              <th>연구 종료일</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {jn(
              ys.map((y, _i) => (
                <tr key={_i}>
                  <td>{y.no}차년도</td>
                  <td>
                    <label>
                      <span hidden>{y.no}차년도 시작일</span>
                      <In
                        id={`f-${y.ks}`}
                        type="date"
                        data-b={y.ks}
                        data-r="1"
                        value={y.start || ''}
                        style={{
                          width: 'auto',
                        }}
                      />
                    </label>
                  </td>
                  <td>
                    <label>
                      <span hidden>{y.no}차년도 종료일</span>
                      <In
                        id={`f-${y.ke}`}
                        type="date"
                        data-b={y.ke}
                        data-r="1"
                        value={y.end || ''}
                        style={{
                          width: 'auto',
                        }}
                      />
                    </label>
                  </td>
                  <td>{y.no < cur ? <span className="chip">지난 연차</span> : y.no === cur ? <span className="chip good">진행 중</span> : <span className="chip">예정</span>}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
export function AttField({ fm, e, k }: any) {
  const isIn = k === 'in';
  const L = isIn ? fm.inn : fm.ext;
  const p = proj(e.proj);
  const opts = isIn
    ? (() => {
        const team = peopleOf(p).filter((x) => x.org === e.org && !L.some((y) => y.id === x.id));
        const rest = S.people.filter((x) => x.org === e.org && !x.admin && x.acct !== '가입 신청' && !team.includes(x) && !L.some((y) => y.id === x.id));
        return `${
          team.length ? (
            <optgroup label="이 과제 참여 인원">
              {jn(
                team.map((x, _i) => (
                  <option key={_i} value={x.id}>
                    {x.name} · {x.role || ''} · {x.unit || ''}
                  </option>
                )),
              )}
            </optgroup>
          ) : null
        }${
          rest.length ? (
            <optgroup label="그 외 우리 기관 직원">
              {jn(
                rest.map((x, _i) => (
                  <option key={_i} value={x.id}>
                    {x.name} · {x.role || ''} · {x.unit || ''}
                  </option>
                )),
              )}
            </optgroup>
          ) : null
        }`;
      })()
    : (() => {
        const gs: any = {};
        visExp()
          .filter((x) => !L.some((y) => y.id === x.id))
          .forEach((x) => {
            (gs[x.group || '전문가'] = gs[x.group || '전문가'] || []).push(x);
          });
        return jn(
          Object.entries(gs).map(([g, xs], _i) => (
            <optgroup key={_i} label={g}>
              {jn(
                xs.map((x, _i) => (
                  <option key={_i} value={x.id}>
                    {x.name} · {x.org || ''} {expTitle(x) || ''}
                  </option>
                )),
              )}
            </optgroup>
          )),
        );
      })();
  return (
    <div
      className="field"
      style={{
        gridColumn: '1/-1',
      }}
    >
      <span>
        {isIn ? '참석자 · 내부 인원' : '참석자 · 외부 전문가'} <small>{L.length}명</small>
      </span>
      <div
        className="pchips"
        style={{
          minHeight: '26px',
        }}
      >
        {jn(
          L.map((x, j) => (
            <span key={j} className={`pchip ${isIn ? '' : 'exp'}`}>
              {x.name}
              {x.id ? null : (
                <>
                  {' '}
                  <small>직접 입력</small>
                </>
              )}
              <button type="button" data-a="ffAttRm" data-x={`${k}|${j}`} aria-label={`${x.name} 빼기`}>
                ×
              </button>
            </span>
          )),
        ) || <span className="small muted">{isIn ? '아직 없어요' : '없음 (외부 전문가가 없으면 비워 두세요)'}</span>}
      </div>
      <div
        className="row"
        style={{
          flexWrap: 'wrap',
          gap: '6px',
          marginTop: '4px',
        }}
      >
        <label>
          <span hidden>{isIn ? '내부 인원' : '외부 전문가'} 고르기</span>
          <In
            as="select"
            id={`ffatt-${k}`}
            data-ffatt={k}
            style={{
              width: 'auto',
              maxWidth: '300px',
            }}
          >
            <option value="">{isIn ? '+ 직원에서 고르기' : '+ 전문가 관리에서 고르기'}</option>
            {opts}
          </In>
        </label>{' '}
        <label
          style={{
            flex: '1',
            minWidth: '160px',
          }}
        >
          <span hidden>직접 입력</span>
          <In id={`ffadd-${k}`} type="text" data-ffadd={k} placeholder={isIn ? '직접 입력 (예: 홍길동 연구원)' : '직접 입력 (예: 김OO 교수, OO대)'} />
        </label>
        <button type="button" className="btn sm" data-a="ffAttAdd" data-x={k}>
          추가
        </button>
      </div>
    </div>
  );
}
export const consHint = (v) =>
  v === 'cons' ? '연구단 관리에 함께 뜨고, 연구단 코드로 다른 기관의 참여 신청을 받을 수 있어요.' : '연구 관리에서만 보여요. 나중에 총괄관리에서 연구단 과제로 바꿀 수 있어요.';
