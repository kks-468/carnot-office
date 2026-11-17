import { LOGO } from '../core/catalog';
import { LinkBtn } from '../ui/primitives';

export function Footer() {
  return (
    <footer className="cfoot">
      <div className="cf-brand">
        <img src={LOGO} alt="Carnot" />
        <span>office</span>
      </div>
      <div className="cf-meta">
        <span>© 2026 Carnot. All rights reserved.</span>
        <span>Carnot office · 연구행정 지원 플랫폼</span>
        <span>
          <LinkBtn a="cfTerms">이용약관</LinkBtn> · <LinkBtn a="cfTerms">개인정보처리방침</LinkBtn> · 고객지원 support@carnot.example
        </span>
      </div>
    </footer>
  );
}
