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
  const Page = PAGES[S.menu] || HomePage;
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
