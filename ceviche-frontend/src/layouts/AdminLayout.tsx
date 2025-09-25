import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/admin/Sidebar';
import { Header } from '../components/admin/Header';

interface User {
    usuario: string;
    avatar?: string | null;
}

interface AdminLayoutProps {
    user: User | null;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
    onLogout: () => void;
    onProfileUpdate?: (updatedUser: { usuario: string; avatar?: string | null; }) => void;
}

export function AdminLayout({ user, isDarkMode, setIsDarkMode, onLogout, onProfileUpdate }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  // Actualizar el usuario cuando cambie la prop
  React.useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Callback para manejar actualizaciones del perfil
  const handleProfileUpdate = (updatedUser: { usuario: string; avatar?: string | null; }) => {
    if (currentUser) {
      const newUserData = {
        ...currentUser,
        ...updatedUser
      };
      setCurrentUser(newUserData);

      // Llamar al callback global si existe
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }
    }
  };


  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (!user) {
    return null; // O un spinner de carga
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <Sidebar user={currentUser} onLogout={onLogout} isSidebarOpen={isSidebarOpen} onProfileUpdate={handleProfileUpdate} />
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
