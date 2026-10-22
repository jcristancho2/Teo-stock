import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RoleRoute } from './components/RoleRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminUploadPage } from './pages/AdminUploadPage'
import { AdminStockPage } from './pages/AdminStockPage'
import { AdminHistoryPage } from './pages/AdminHistoryPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { ComercialStockPage } from './pages/ComercialStockPage'
import { ComercialHistoryPage } from './pages/ComercialHistoryPage'

function Inicio() {
  const { perfil, cargando, cargandoPerfil } = useAuth()
  if (cargando || cargandoPerfil) return <div className="pantalla-centrada">Cargando…</div>
  if (!perfil) return <Navigate to="/login" replace />
  return <Navigate to={perfil.rol === 'admin' ? '/admin' : '/comercial/stock'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Inicio />} />

          <Route
            path="admin"
            element={
              <RoleRoute roles={['admin']}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/cargar-excel"
            element={
              <RoleRoute roles={['admin']}>
                <AdminUploadPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/stock"
            element={
              <RoleRoute roles={['admin']}>
                <AdminStockPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/historial"
            element={
              <RoleRoute roles={['admin']}>
                <AdminHistoryPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/usuarios"
            element={
              <RoleRoute roles={['admin']}>
                <AdminUsersPage />
              </RoleRoute>
            }
          />

          <Route
            path="comercial/stock"
            element={
              <RoleRoute roles={['comercial', 'admin']}>
                <ComercialStockPage />
              </RoleRoute>
            }
          />
          <Route
            path="comercial/historial"
            element={
              <RoleRoute roles={['comercial', 'admin']}>
                <ComercialHistoryPage />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
