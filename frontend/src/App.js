// App.js - Root with all providers, routes, and push notification banner
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { ThemeProvider }        from './context/ThemeContext';
import { AuthProvider }          from './context/AuthContext';
import { SocketProvider }        from './context/SocketContext';
import { NotificationProvider }  from './context/NotificationContext';

// Components
import Navbar                from './components/Navbar';
import ProtectedRoute        from './components/ProtectedRoute';
import PushPermissionBanner  from './components/PushPermissionBanner';

// Pages
import Login        from './pages/Login';
import Signup       from './pages/Signup';
import Home         from './pages/Home';
import History      from './pages/History';
import Certificates from './pages/Certificates';
import Analytics    from './pages/Analytics';
import Feedback     from './pages/Feedback';

const AppLayout = ({ children }) => (
  <div className="min-h-screen">
    <Navbar />
    <main>{children}</main>
    <PushPermissionBanner />
  </div>
);

const Protected = ({ children, adminOnly = false }) => (
  <ProtectedRoute adminOnly={adminOnly}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SocketProvider>
            <NotificationProvider>
              <Routes>
                {/* Public */}
                <Route path="/login"  element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected */}
                <Route path="/"            element={<Protected><Home /></Protected>} />
                <Route path="/history"     element={<Protected><History /></Protected>} />
                <Route path="/certificates"element={<Protected><Certificates /></Protected>} />
                <Route path="/analytics"   element={<Protected><Analytics /></Protected>} />
                <Route path="/feedback"    element={<Protected><Feedback /></Protected>} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </SocketProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
