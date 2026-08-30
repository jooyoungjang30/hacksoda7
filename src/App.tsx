import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { NudgeProvider } from './components/nudge/NudgeContext'
import { ToastProvider } from './components/ui/Toast'
import { DashboardPage } from './screens/dashboard/DashboardPage'
import { TeamDetailPage } from './screens/team/TeamDetailPage'
import { NetworkMapPage } from './screens/network/NetworkMapPage'
import Shell from './employee/Shell'
import Overview from './employee/Overview'
import Send from './employee/Send'
import Preferences from './employee/Preferences'
import Received from './employee/Received'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <NudgeProvider>
          <Routes>
            {/* HR admin — 주영 */}
            <Route path="/kudos" element={<DashboardPage />} />
            <Route path="/kudos/team/:teamId" element={<TeamDetailPage />} />
            <Route path="/kudos/network" element={<NetworkMapPage />} />

            {/* Employee — jong */}
            <Route path="/me" element={<Shell />}>
              <Route index element={<Navigate to="/me/overview" replace />} />
              <Route path="overview"    element={<Overview />} />
              <Route path="send"        element={<Send />} />
              <Route path="preferences" element={<Preferences />} />
              <Route path="received"    element={<Received />} />
            </Route>

            <Route path="*" element={<Navigate to="/kudos" replace />} />
          </Routes>
        </NudgeProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
