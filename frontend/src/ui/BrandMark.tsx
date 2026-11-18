// 서비스 이름표: Carnot office 로고 (어두운 바탕용)
import BRAND from '../assets/brand-office.webp';

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <div className={`brandmark ${className}`}>
      <img src={BRAND} alt="Carnot office" />
    </div>
  );
}
