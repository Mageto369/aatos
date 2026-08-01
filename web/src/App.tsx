import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { DealsPage } from '@/pages/DealsPage'
import { OrganizationPage } from '@/pages/OrganizationPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/organization" element={<OrganizationPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
