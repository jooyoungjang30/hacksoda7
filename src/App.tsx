import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Shell from './employee/Shell'
import Send from './employee/Send'
import Soon from './employee/Soon'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/me" element={<Shell />}>
          <Route index element={<Navigate to="/me/overview" replace />} />
          <Route path="overview"    element={<Soon what="Overview" />} />
          <Route path="send"        element={<Send />} />
          <Route path="preferences" element={<Soon what="My Preferences" />} />
          <Route path="received"    element={<Soon what="Received" />} />
        </Route>
        <Route path="*" element={<Navigate to="/me/overview" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
