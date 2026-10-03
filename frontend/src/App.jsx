// import { Routes, Route, Navigate } from 'react-router-dom'
// import { Toaster } from 'react-hot-toast'
// import { useAuth } from './context/AuthContext'
// import Sidebar from './components/Sidebar'
// import Navbar from './components/Navbar'
// import Login from './pages/Login'
// import Signup from './pages/Signup'
// import Dashboard from './pages/Dashboard'
// import Transactions from './pages/Transactions'
// import Analytics from './pages/Analytics'
// import Profile from './pages/Profile'
// import './styles/dashboard.css'
// import './styles/components.css'

// function ProtectedLayout({ children }) {
//   const { isAuthenticated, loading } = useAuth()

//   if (loading) {
//     return <div className="page-loader"><span className="spinner spinner-dark" /></div>
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />
//   }

//   return (
//     <div className="app-shell">
//       <Sidebar />
//       <div>
//         <Navbar />
//         <main className="main-content">{children}</main>
//       </div>
//     </div>
//   )
// }

// function PublicRoute({ children }) {
//   const { isAuthenticated, loading } = useAuth()
//   if (loading) return null
//   if (isAuthenticated) return <Navigate to="/dashboard" replace />
//   return children
// }

// export default function App() {
//   return (
//     <>
//       <Toaster position="top-right" toastOptions={{
//         style: { fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', borderRadius: '10px' },
//       }} />
//       <Routes>
//         <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
//         <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

//         <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
//         <Route path="/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />
//         <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
//         <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />

//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
//         <Route path="*" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </>
//   )
// }



















// import { useState } from 'react'
// import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
// import { AnimatePresence, motion } from 'framer-motion'
// import { Toaster } from 'react-hot-toast'
// import { useAuth } from './context/AuthContext'
// import Sidebar from './components/Sidebar'
// import Navbar from './components/Navbar'
// import Login from './pages/Login'
// import Signup from './pages/Signup'
// import Dashboard from './pages/Dashboard'
// import Transactions from './pages/Transactions'
// import Analytics from './pages/Analytics'
// import Profile from './pages/Profile'
// import './styles/dashboard.css'
// import './styles/components.css'

// function ProtectedLayout({ children }) {
//   const { isAuthenticated, loading } = useAuth()
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
//   const location = useLocation()

//   if (loading) {
//     return <div className="page-loader"><span className="spinner spinner-dark" /></div>
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />
//   }

//   return (
//     <div className="app-shell">
//       <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
//       <div>
//         <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
//         <main className="main-content">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={location.pathname}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -8 }}
//               transition={{ duration: 0.22, ease: 'easeOut' }}
//             >
//               {children}
//             </motion.div>
//           </AnimatePresence>
//         </main>
//       </div>
//     </div>
//   )
// }

// function PublicRoute({ children }) {
//   const { isAuthenticated, loading } = useAuth()
//   if (loading) return null
//   if (isAuthenticated) return <Navigate to="/dashboard" replace />
//   return children
// }

// export default function App() {
//   return (
//     <>
//       <Toaster position="top-right" toastOptions={{
//         style: { fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', borderRadius: '10px' },
//       }} />
//       <Routes>
//         <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
//         <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

//         <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
//         <Route path="/transactions" element={<ProtectedLayout><Transactions /></ProtectedLayout>} />
//         <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
//         <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />

//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
//         <Route path="*" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </>
//   )
// }






















import { Suspense, lazy, useCallback, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import './styles/dashboard.css'
import './styles/components.css'

const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Insights = lazy(() => import('./pages/Insights'))
const Profile = lazy(() => import('./pages/Profile'))

function BootScreen() {
  return (
    <div className="boot-screen">
      <motion.span
        className="boot-mark"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

function ProtectedLayout({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const openMenu = useCallback(() => setMenuOpen(true), [])

  if (loading) return <BootScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={closeMenu} />
      <div className="app-body">
        <Navbar onOpenMenu={openMenu} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <BootScreen />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

/** Wraps each route so pages cross-fade instead of snapping. */
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.9rem',
            borderRadius: '12px',
            background: '#0F231B',
            color: '#fff',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#23C285', secondary: '#0F231B' } },
          error: { iconTheme: { primary: '#FF6B54', secondary: '#0F231B' } },
        }}
      />

      <Suspense fallback={<BootScreen />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <PageTransition>
                    <Login />
                  </PageTransition>
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <PageTransition>
                    <Signup />
                  </PageTransition>
                </PublicRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </ProtectedLayout>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedLayout>
                  <PageTransition>
                    <Transactions />
                  </PageTransition>
                </ProtectedLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedLayout>
                  <PageTransition>
                    <Analytics />
                  </PageTransition>
                </ProtectedLayout>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedLayout>
                  <PageTransition>
                    <Insights />
                  </PageTransition>
                </ProtectedLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedLayout>
                  <PageTransition>
                    <Profile />
                  </PageTransition>
                </ProtectedLayout>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  )
}