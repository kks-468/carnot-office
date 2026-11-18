// 서비스 이름표: Carnot 로고 + office (카르노오피스)
import { LOGO } from '../core/catalog';

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <div className={`brandmark ${className}`} aria-label="Carnot office">
      <img src={LOGO} alt="Carnot" />
      <span>office</span>
    </div>
  );
}
