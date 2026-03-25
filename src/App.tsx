import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useAppContext } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { TopBar } from './components/TopBar/TopBar';
import { LeftPanel } from './components/ProjectPanel/LeftPanel';
import { EditorPanel } from './components/EditorPanel/EditorPanel';
import { FeedbackPanel } from './components/FeedbackPanel/FeedbackPanel';
import type { Project } from './types';

type AuthScreen = 'login' | 'register';
type AppScreen = 'dashboard' | 'create' | 'editor';

function EditorScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e] text-gray-100 overflow-hidden">
      <TopBar onBackToDashboard={onBack} />
      <main className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <EditorPanel />
        <FeedbackPanel />
      </main>
    </div>
  );
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const { loadProject, reset } = useAppContext();
  const [screen, setScreen] = useState<AppScreen>('dashboard');

  if (!user) return null;

  const handleOpenProject = async (project: Project) => {
    await loadProject(project);
    setScreen('editor');
  };

  const handleBackToDashboard = () => {
    reset();
    setScreen('dashboard');
  };

  if (screen === 'editor') return <EditorScreen onBack={handleBackToDashboard} />;
  if (screen === 'create') return (
    <CreateProjectPage
      onBack={() => setScreen('dashboard')}
      onCreated={(project) => handleOpenProject(project)}
    />
  );
  return (
    <DashboardPage
      onCreateProject={() => setScreen('create')}
      onOpenProject={handleOpenProject}
    />
  );
}

function UnauthenticatedApp() {
  const [screen, setScreen] = useState<AuthScreen>('login');
  return screen === 'login'
    ? <LoginPage onGoRegister={() => setScreen('register')} />
    : <RegisterPage onGoLogin={() => setScreen('login')} />;
}

function AppRouter() {
  const { user } = useAuth();
  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRouter />
      </AppProvider>
    </AuthProvider>
  );
}
