import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { AdminPodsPage } from './AdminPodsPage'
import { AdminUsersPage } from './AdminUsersPage'

export function AdminPage() {
  return (
    <div className="admin-page">
      <nav className="admin-tabs" aria-label="Admin sections">
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/pods">Pods</NavLink>
      </nav>
      <Routes>
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="pods" element={<AdminPodsPage />} />
      </Routes>
    </div>
  )
}
