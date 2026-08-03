import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { DealsPage } from '@/pages/DealsPage'
import { OrganizationPage } from '@/pages/OrganizationPage'
import { RfqsPage } from '@/pages/RfqsPage'
import { RfqCreatePage } from '@/pages/RfqCreatePage'
import { DealRoomPage } from '@/pages/DealRoomPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { InspectionsPage } from '@/pages/InspectionsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { PaymentsPage } from '@/pages/PaymentsPage'
import { AdminPage } from '@/pages/AdminPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/rfqs" element={<RfqsPage />} />
                <Route path="/rfqs/new" element={<RfqCreatePage />} />
                <Route path="/deals" element={<DealsPage />} />
                <Route path="/deals/:id" element={<DealRoomPage />} />
                <Route path="/organization" element={<OrganizationPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/inspections" element={<InspectionsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
