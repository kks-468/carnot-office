import { useEffect, useLayoutEffect } from 'react';
import { markMounted, useS } from './core/state';
import { numify } from './core/runtime';
import { DemoBar } from './layout/DemoBar';
import { Shell } from './layout/Shell';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ModalHost } from './modals/ModalHost';
import { restoreFocus } from './platform/focus';

export default function App() {
  const S = useS();
  // 그린 뒤: 숫자칸에 쉼표 서식을 입히고, 다시 그리면서 잃은 포커스를 돌려놔요.
  useLayoutEffect(() => {
    const root = document.getElementById('root');
    if (root) numify(root);
    restoreFocus();
  });
  useEffect(() => markMounted(), []);
  return (
    <>
      <DemoBar />
      {S.signup ? <SignupPage /> : !S.auth ? <LoginPage /> : <Shell />}
      <ModalHost />
    </>
  );
}
