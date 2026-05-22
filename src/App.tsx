import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PracticePage } from './pages/PracticePage';
import { LearningPage } from './pages/LearningPage';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useBackendStatus } from './hooks/useBackendStatus';
import { UI } from './constants/ui.strings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const backendStatus = useBackendStatus();

  return (
    <AuthProvider>
    <BrowserRouter>
      <ErrorBoundary>
        {backendStatus === 'waking' && (
          <div className="bg-[#FAEEDA] dark:bg-amber-900/30 border-b border-[#FAC775] dark:border-amber-700 px-5 py-2 text-center text-[12px] text-[#633806] dark:text-amber-300 flex items-center justify-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            {UI.BACKEND_STARTING}
          </div>
        )}
        {backendStatus === 'offline' && (
          <div className="fixed inset-0 z-[200] bg-white dark:bg-gray-900 flex flex-col items-center justify-center gap-4 px-8">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h2 className="text-lg font-semibold text-[#111827] dark:text-gray-100">{UI.BACKEND_OFFLINE_TITLE}</h2>
            <p className="text-sm text-[#6B7280] dark:text-gray-400 text-center max-w-sm">{UI.BACKEND_OFFLINE_DESC}</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2 bg-[#534AB7] text-white rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer">
              {UI.RETRY}
            </button>
          </div>
        )}
        <ToastProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/practice" element={
              <ProtectedRoute>
                <PracticePage />
              </ProtectedRoute>
            } />
            <Route path="/learning" element={
              <ProtectedRoute>
                <LearningPage />
              </ProtectedRoute>
            } />
            <Route path="/about" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Acerca de</h1>
                  <p className="text-gray-600 dark:text-gray-400">AICodeTutor — Proyecto universitario</p>
                </div>
              </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
    </AuthProvider>
  );
}
