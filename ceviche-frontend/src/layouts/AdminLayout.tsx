import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/admin/Sidebar';
import { Header } from '../components/admin/Header';

interface User {
    usuario: string;
}

interface AdminLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
}

export function AdminLayout({ user, isDarkMode, setIsDarkMode, onLogout }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Debug: Verificar props del layout
  console.log('🔍 AdminLayout - User:', user);
  console.log('🔍 AdminLayout - isDarkMode:', isDarkMode);
  console.log('🔍 AdminLayout - isSidebarOpen:', isSidebarOpen);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (!user) {
    return null; // O un spinner de carga
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar user={user} onLogout={onLogout} isSidebarOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
