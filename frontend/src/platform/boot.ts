// 앱 시작
// - 백엔드가 있으면(서버 모드): 로그인 상태를 확인하고 서버 데이터를 불러와 저장을 켜요.
// - 백엔드가 없으면(시연 모드): 브라우저 안의 시연 데이터로 동작해요 (저장되지 않아요).
import { S, render } from '../core/state';
import { A } from '../core/actions';
import { seedDemo } from '../core/seed';
import { installEvents } from '../core/events';
import { doLogin } from '../core/org';
import { probe, api } from './api';
import { applyState, clearData, server, startSync } from './sync';
import { installServerActions } from './serverActions';
import { installAclActions } from '../core/aclActions';

export async function boot(): Promise<void> {
  // 화면 상태(메뉴·탭 등)의 기본값은 시연 데이터 만들기에서 함께 정해져요.
  seedDemo();
  const me = await probe();
  if (me) {
    server.on = true;
    S.demo = false;
    clearData();
    installServerActions();
    if (me.personId) {
      try {
        applyState(await api('/api/state'));
        doLogin(me.personId);
      } catch {
        clearData();
      }
    }
  } else {
    S.demo = true;
  }
  installAclActions();
  installEvents();
  startSync();
  render();
  // 시연 중에는 콘솔과 자동 점검에서 쓸 수 있게 열어 둬요.
  if (S.demo || (window as any).__CARNOT_DEBUG__) Object.assign(window, { S, A, render });
}
