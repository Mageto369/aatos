import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 pt-16 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
