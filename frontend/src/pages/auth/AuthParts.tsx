// 로그인·가입 화면에서 함께 쓰는 부품
import type { ReactNode } from 'react';
import { S } from '../../core/state';
import { LOGO, PW_OK } from '../../core/catalog';
import { In } from '../../ui/primitives';

export function AuthBox({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="signup">
      <div className={`signbox ${wide ? '' : 'auth'}`}>
        <div className="logo">
          <img src={LOGO} alt="Carnot" style={{ width: 110 }} />
        </div>
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
