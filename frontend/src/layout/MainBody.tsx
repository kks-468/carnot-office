// 메뉴에 따라 본문 화면을 골라요.
import { useS } from '../core/state';
import { TopBar } from './Shell';
import { AdminBody } from '../pages/admin/AdminBody';
import { ApprovalBody } from '../pages/approval/ApprovalBody';
import { FormsBody } from '../pages/forms/FormsBody';
import { HomePage } from '../pages/home/HomePage';
import { ReportPage } from '../pages/report/ReportPage';
import { CcalPage } from '../pages/ccal/CcalPage';
import { TeamPage } from '../pages/team/TeamPage';
import { ProposalPage } from '../pages/proposal/ProposalPage';
import { ExpertPage } from '../pages/expert/ExpertPage';
import { LibraryPage } from '../pages/library/LibraryPage';
import { SettingsPage, SetTabs } from '../pages/settings/SettingsPage';
import { StaffPage } from '../pages/staff/StaffPage';
import { AclSettings } from '../pages/settings/AclSettings';
import { canPay } from '../core/acl';

const PAGES: Record<string, () => JSX.Element> = {
  home: HomePage,
  report: ReportPage,
  ccal: CcalPage,
  team: TeamPage,
  teamProp: TeamPage,
  proposal: ProposalPage,
  expert: ExpertPage,
  library: LibraryPage,
  settings: SettingsPage,
  staff: StaffPage,
  acl: AclSettings,
};

export function MainBody() {
  const S = useS();
  if (S.menu === 'admin') return <AdminBody />;
  if (S.menu === 'approval')
    return (
      <>
        <TopBar />
        <ApprovalBody />
      </>
    );
  if (S.menu === 'forms') return <FormsBody />;
  let Page = PAGES[S.menu] || HomePage;
  // 급여 열람 권한이 없으면 직원·급여 화면을 열지 않아요
  if (S.menu === 'staff' && !canPay()) Page = NoAccess;
  return (
    <>
      <TopBar tabs={S.menu === 'settings' ? <SetTabs /> : undefined} />
      <div className="body single">
        <div className="work">
          <Page />
        </div>
      </div>
    </>
  );
}

function NoAccess() {
  return <div className="notice">이 화면을 볼 권한이 없어요. 기관 관리자에게 열람 권한을 요청해 주세요.</div>;
}
