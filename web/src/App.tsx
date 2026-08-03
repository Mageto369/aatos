import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Quotations } from './pages/Quotations'
import { ComplianceDashboard } from './pages/ComplianceDashboard'
import { Documents } from './pages/Documents'
import { Inspections } from './pages/Inspections'
import { Deals } from './pages/Deals'
import { RFQs } from './pages/RFQs'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/rfqs" element={<RFQs />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/compliance" element={<ComplianceDashboard />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/inspections" element={<Inspections />} />
      </Route>
    </Routes>
  )
}

export default App
