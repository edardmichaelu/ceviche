import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { MeseroSidebar } from '../components/mesero/MeseroSidebar';
import { MeseroHeader } from '../components/mesero/MeseroHeader';
import { PedidoProvider } from '../contexts/PedidoContext';

interface User {
    usuario: string;
    rol: string;
}

interface MeseroLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
}

export function MeseroLayout({ user, isDarkMode, setIsDarkMode, onLogout }: MeseroLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PedidoProvider>
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <MeseroSidebar
          user={user}
          onLogout={onLogout}
          isSidebarOpen={isSidebarOpen}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <MeseroHeader
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            onToggleSidebar={handleToggleSidebar}
            user={user}
          />

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </PedidoProvider>
  );
}
