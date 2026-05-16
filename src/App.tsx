import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { TaskBoard } from './components/TaskBoard';
import { ProjectsTeams } from './components/ProjectsTeams';
import { SharedLayout } from './components/SharedLayout';

const AppContent: React.FC = () => {
  const { status } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [taskFilter, setTaskFilter] = useState<string | null>(null);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Login />;
  }

  const navigateToTasks = (filter: string | null = null) => {
    setTaskFilter(filter);
    setActiveTab('tasks');
  };

  return (
    <SharedLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard onKpiClick={navigateToTasks} setActiveTab={setActiveTab} />}
      {activeTab === 'tasks' && <TaskBoard initialFilter={taskFilter} />}
      {activeTab === 'projects' && <ProjectsTeams />}
    </SharedLayout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
