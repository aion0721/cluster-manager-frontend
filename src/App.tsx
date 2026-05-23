import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireUser } from './components/RequireUser'
import { UserProvider } from './context/UserContext'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { MePage } from './pages/MePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/me"
              element={
                <RequireUser>
                  <MePage />
                </RequireUser>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireUser>
                  <AdminPage />
                </RequireUser>
              }
            />
          </Routes>
        </Layout>
      </UserProvider>
    </BrowserRouter>
  )
}

export default App
