// 로그인·가입 화면에서 함께 쓰는 부품
import type { ReactNode } from 'react';
import { S } from '../../core/state';
import { PW_OK } from '../../core/catalog';
import { In } from '../../ui/primitives';
import { BrandMark } from '../../ui/BrandMark';

/** 로그인할 회사: 이름 아래에 그 회사가 올린 로고 (설정 → 조직도) */
export function OrgMark({ t }: { t: { name: string; short?: string; logo?: string } }) {
  return (
    <div className="orghead">
      <span className="orgname">{t.short || t.name}</span>
      {t.logo ? <img src={t.logo} alt={`${t.name} 로고`} /> : null}
    </div>
  );
}

/** 로그인·가입 화면 틀: 위에는 서비스 이름표(Carnot office), 흰 상자 안에는 회사 로고와 입력칸 */
export function AuthBox({ children, wide, org }: { children: ReactNode; wide?: boolean; org?: { name: string; short?: string; logo?: string } | null }) {
  return (
    <div className="signup">
      <BrandMark className="onbrand" />
      <div className={`signbox ${wide ? '' : 'auth'}`}>
        {org ? <OrgMark t={org} /> : null}
        {children}
      </div>
      <p className="authcopy">Carnot office · © 2026 Carnot. All rights reserved.</p>
    </div>
  );
}

export function PwField({ label, name, ph }: { label: string; name: string; ph?: string }) {
  return (
    <label className="field" htmlFor={`f-${name}`}>
      <span>{label}</span>
      <In id={`f-${name}`} data-b={name} type="password" value={S.f[name] || ''} placeholder={ph || ''} autoComplete={/pw2|new/.test(name) ? 'new-password' : 'current-password'} />
    </label>
  );
}

export function PwRule({ v }: { v?: string }) {
  const ok = v && PW_OK(v);
  return (
    <span className={`pwrule ${!v ? '' : ok ? 'ok' : 'bad'}`}>
      영문과 숫자를 섞어 8자 이상{v ? (ok ? ' ✓' : ' · 아직 부족해요') : ''}
    </span>
  );
}

export function Err({ msg }: { msg?: string }) {
  return msg ? (
    <p className="err" role="alert">
      {msg}
    </p>
  ) : null;
}
