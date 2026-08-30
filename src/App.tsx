import { Navigate, Route, Routes } from 'react-router-dom';
import { NudgeProvider } from './components/nudge/NudgeContext';
import { ToastProvider } from './components/ui/Toast';
import { DashboardPage } from './screens/dashboard/DashboardPage';
import { TeamDetailPage } from './screens/team/TeamDetailPage';
import { NetworkMapPage } from './screens/network/NetworkMapPage';

function App() {
  return (
    <ToastProvider>
      <NudgeProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/kudos" replace />} />
          <Route path="/kudos" element={<DashboardPage />} />
          <Route path="/kudos/team/:teamId" element={<TeamDetailPage />} />
          <Route path="/kudos/network" element={<NetworkMapPage />} />
        </Routes>
      </NudgeProvider>
    </ToastProvider>
  );
}

export default App;
