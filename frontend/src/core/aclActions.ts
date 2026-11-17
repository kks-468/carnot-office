// '설정 → 열람 권한' 화면의 동작. 앱을 시작할 때 A·CHANGE에 더해요.
import { S, render } from './state';
import { A, CHANGE } from './actions';
import { toast } from './runtime';
import { ACL_DEFAULT, isOrgAdmin, type Acl, type Rule } from './acl';

/** 고칠 규칙을 꺼내요. 아직 없으면 기본값을 복사해 만들어요. */
function editRule(scope: string): Rule | null {
  if (!isOrgAdmin()) {
    toast('열람 권한은 기관 관리자만 바꿀 수 있어요.');
    return null;
  }
  const o = S.orgs[S.view];
  const acl: Acl = (o.acl = o.acl || {});
  if (scope.startsWith('proj:')) {
    const id = scope.slice(5);
    acl.projects = acl.projects || {};
    return (acl.projects[id] = acl.projects[id] || structuredClone(acl.research || ACL_DEFAULT.research));
  }
  const k = scope === 'pay' ? 'pay' : 'research';
  return (acl[k] = acl[k] || structuredClone(ACL_DEFAULT[k]));
}

const addTo = (r: Rule, f: 'units' | 'people', v: string) => {
  const a = (r[f] = r[f] || []);
  if (v && !a.includes(v)) a.push(v);
};

export function installAclActions(): void {
  Object.assign(A, {
    aclToggle(x: string) {
      const [scope, f] = x.split('|') as [string, 'all' | 'members' | 'forResearch'];
      const r = editRule(scope);
      if (!r) return;
      // forResearch는 기본이 켬이라 비어 있으면 켜진 것으로 봐요
      r[f] = f === 'forResearch' ? r[f] === false : !r[f];
      render();
    },
    aclRm(x: string) {
      const [scope, f, v] = x.split('|') as [string, 'units' | 'people', string];
      const r = editRule(scope);
      if (!r) return;
      r[f] = (r[f] || []).filter((z) => z !== v);
      render();
    },
    /** 과제별로 따로 정하기 / 기관 기본값 따르기 */
    aclProj(x: string) {
      const [id, on] = x.split('|');
      if (!isOrgAdmin()) return toast('열람 권한은 기관 관리자만 바꿀 수 있어요.');
      const o = S.orgs[S.view];
      const acl: Acl = (o.acl = o.acl || {});
      acl.projects = acl.projects || {};
      if (on === '1') {
        acl.projects[id] = structuredClone(acl.research || ACL_DEFAULT.research);
        S.aclSel = id;
      }
      else delete acl.projects[id];
      render();
    },
    aclPick(x: string) {
      S.aclSel = x;
      render();
    },
  });
  Object.assign(CHANGE, {
    aclLevel(e: Event) {
      const t = e.target as HTMLSelectElement;
      const r = editRule(t.dataset.x || '');
      if (!r) return render();
      if (t.value) r.level = t.value;
      else delete r.level;
      render();
    },
    aclAddUnit(e: Event) {
      const t = e.target as HTMLSelectElement;
      const r = editRule(t.dataset.x || '');
      if (r) addTo(r, 'units', t.value);
      t.value = '';
      render();
    },
    aclAddPerson(e: Event) {
      const t = e.target as HTMLSelectElement;
      const r = editRule(t.dataset.x || '');
      if (r) addTo(r, 'people', t.value);
      t.value = '';
      render();
    },
  });
}
