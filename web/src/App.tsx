import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { Dashboard } from './pages/Dashboard'
import { RFQs } from './pages/RFQs'
import { Quotations } from './pages/Quotations'
import { Deals } from './pages/Deals'
import { DealRoomPage } from './pages/DealRoomPage'
import { ComplianceDashboard } from './pages/ComplianceDashboard'
import { Documents } from './pages/Documents'
import { Inspections } from './pages/Inspections'
import { ProductsPage } from './pages/ProductsPage'
import { OrganizationPage } from './pages/OrganizationPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminPage } from './pages/AdminPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/rfqs" element={<RFQs />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/deals/:id/room" element={<DealRoomPage />} />
        <Route path="/compliance" element={<ComplianceDashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/inspections" element={<Inspections />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/organization" element={<OrganizationPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App
